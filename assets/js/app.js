/** Start global variables used by the camera ui **/
const   PICTUREWIDTH = 1280,
        PICTUREHEIGHT = 960,
        TIMEAFTERPICTURETAKEN = 5000,
        TIMEBEFORERESET = 60000;

let     gotCamera = false,
        pictureInprogress = false,
        idleTime;
/** End global variables used by the camera ui **/



/** Start global variables used by the preview screen **/
const   WINDOWWIDTH = window.innerWidth,
        WINDOWHEIGHT = window.innerHeight,
        possiblePictureX = [0, (WINDOWWIDTH - 250)],
        possiblePictureY = [0, (WINDOWHEIGHT - 250)],
        MINROTATION = -15,
        MAXROTATION = 15,
        TIMEBETWEENHIGHLIGHTING = 15000,
        TIMEPICTUREISHIGHLIGHTED = 5000;
        PREVIEWSCREENUPDATETIME = 25000;

let     lastRotation = 0,
        picturesOnBoard = [],
        picturesOnServer = [],
        picturesHighlighted = [],
        updatePaused = false;
/** End global variables used by the preview screen **/



/** Start utility functions **/
/**
 * Returns a random int between min and max values defines in global const. It check against last returned value, so the same value cannot accure twice in a row.
 * 
 * @returns {int}
 */
function getRandomRotation() {
    min = Math.ceil(MINROTATION);
    max = Math.floor(MAXROTATION);
    num = Math.floor(Math.random() * (max - min + 1)) + min;

    if(num === lastRotation) {
        getRandomRotation();
    } else {
        return num;
    }
}

/**
 * Returns an object of random generated x and y values between the given min and max value. Both min and max is possible returned values.
 * 
 * @param {array} x - An array of min and max x values 
 * @param {array} y - An array of min and max y values
 * @return {object} - An object of random generated x and y values.
 */
function getRandomCordinates(x, y) {
    let xMin = x[0];
    let xMax = x[1];
    let yMin = y[0];
    let yMax = y[1];

    let newX = Math.floor(Math.random() * (xMax - xMin + 1)) + xMin;
    let newY = Math.floor(Math.random() * (yMax - yMin + 1)) + yMin;

    return { x: newX, y: newY };
}

/**
 * Takes a string with path to an image and returns image element
 * 
 * @param {string} imageSrc - A string to a imagePath
 * @return {object} - A DOM object/element
 */
function buildImageElement(imageSrc) {
    let pictureRotation = 'rotate('+ getRandomRotation() + 'deg)';
    let pictureCoordinates = getRandomCordinates(possiblePictureX, possiblePictureY);

    let $pictureToAdd = $('<img />', {
        src: imageSrc,
    }).css({
        top: pictureCoordinates.y,
        left: pictureCoordinates.x,
        transform: pictureRotation,
    });

    return $pictureToAdd[0];
}

/**
 * Creates a new element that animates on the screen to create transition effect. Hides alle other sections than the "to" section
 * 
 * @param {DOMObject} to - The DOM Object we want to be visible after transition effect 
 */
function makeScreenTransition(to) {
    let $transitionElement = $('<div />', { 
        class: 'transition-element'
    });

    $('body').append($transitionElement);

    setTimeout(() => {
        $('section').hide();
        to.show();
    }, 750);

    setTimeout(() => {
        $transitionElement.remove();
    }, 1500);
}

/**
 * return a random function from an array
 * 
 * @param {array} array - array to return value from
 */
function getRandomFromArray(array) {
    let maxValue = array.length;
    let randomArrayKey = Math.floor(Math.random() * maxValue);

    return array[randomArrayKey];
}

/**
 * Resets the app back to welcome screen
 */
function resetInterface() {
    const transiteTo = $('#welcome');
    const $canvas = document.getElementById("canvas");
    const $trigger = $('#trigger');

    makeScreenTransition(transiteTo);

    setTimeout(function() {
        $trigger.show();
        $canvas.getContext('2d').clearRect(0, 0, $canvas.width, $canvas.height);
        $canvas.width = 0;
        $canvas.height = 0;
    }, 750);
}
/** End utility functions **/



/** Start of functions interacting with the server **/
/**
 * Try to store the picture on the server, if successfull reset the ui to the welcome screen
 * 
 * @param {string} imageData - a string with the image data
 */
function savePictureOnServer(imageData) {
    $.ajax({
        type: 'POST',
        url: 'assets/ajaxhandlers/savePicture.php',
        data: {
            image: imageData
        }
    }).done(function(o) {
        let result = JSON.parse(o);

        if(result.status == 'ok') {
            pictureInprogress = false;
            setTimeout(resetInterface, TIMEAFTERPICTURETAKEN);
        }
    });
}

/**
 * Gets all Pictures on the server
 * 
 * @return {promise<array>} - A promice with array of all pictures found on server
 */
async function getAllPictures() {
    return new Promise(resolve => {
        let pictures = [];
        $.ajax({
            type: 'POST',
            url: '/assets/ajaxhandlers/getPictures.php',
        }).done(function(response) {
            let result = JSON.parse(response);

            if(result.status == 'ok') {
                let data = JSON.parse(result.data);
                picturesOnServer = [];
                $.each(data, function(k, v) {
                    let fullImagePath = v;
                    let neededImagePath = fullImagePath.substring(fullImagePath.indexOf('assets'));

                    picturesOnServer.push(neededImagePath);
                    pictures.push(neededImagePath);
                });
            }

            resolve(pictures);
        });
    });
}
/** End of functions interacting with the server **/



/** Start of functions manipulation the preview screen **/
/**
 * Part of the preciew init adds all images to the board when site is loaded
 * 
 * @param {array} imageArray - array of paths to all pictures on server
 */
function addImagesToBoard(imageArray) {
    const pictureContainer = document.getElementById("preview-container");
    
    $.each(imageArray, function(k, v) {
        picturesOnBoard.push(v);
        pictureContainer.append(buildImageElement(v));
    });
}

/**
 * Get all pictures found on the server, then checks for difference between pictures on the server and pictures allready on the board (preview screen)
 * If there is a difference it means there have been taking new picutres and we add them to the board
 */
function checkForNewPictures() {
    if(!updatePaused) {
        getAllPictures().then(() => {
            if(picturesOnServer.length !== picturesOnBoard.length) {
                updatePaused = true;

                lengthDifference = picturesOnServer.length - picturesOnBoard.length;
                nextImageInArray = picturesOnServer.length - lengthDifference;
                
                lastImageToAdd = picturesOnServer.length - 1;

                addNewImageToBoard(nextImageInArray, lastImageToAdd);
            }
        });
    }
}

/**
 * Adds newly found picures outside the board and animates them in
 * 
 * @param {int} nextIndex - Represents a key value of an array
 * @param {int} lastIndex - Represents a key value of an array
 */
function addNewImageToBoard(nextIndex, lastIndex) {
    let imagePath = picturesOnServer[nextIndex];

    picturesOnBoard.push(imagePath);

    const pictureContainer = document.getElementById("preview-container");

    let pictureStartY = getRandomFromArray([-300, (WINDOWHEIGHT + 300)]);
    let pictureStartX = getRandomCordinates(possiblePictureX, possiblePictureY);
    let pictureStartRotation = 'rotate(0deg)';

    let $picture = buildImageElement(imagePath);

    $($picture).css({
        top: pictureStartY,
        left: pictureStartX.x,
        transform: pictureStartRotation
    });

    $(pictureContainer).append($picture);

    let pictureEndRotation = 'rotate(' + getRandomRotation() + 'deg)';
    let pictureEndCoordinates = getRandomCordinates(possiblePictureX, possiblePictureY);

    setTimeout(function() {
        $($picture).css({
            top: pictureEndCoordinates.y,
            left: pictureEndCoordinates.x,
            transform: pictureEndRotation
        });

        if(nextIndex < lastIndex) {
            addNewImageToBoard(nextIndex + 1, lastIndex);
        } else {
            updatePaused = false;
        }
    }, 500);
}

/**
 * Highlight (zoom in on) a random picture, store the highlighted pictures to make sure we hightlight all pictures before a picture can be highlighted again
 */
function highlightPicture() {
    if(picturesOnBoard.length != picturesHighlighted.length || picturesHighlighted.length == 0) {
        imageToHighlight = Math.floor(Math.random() * (picturesOnBoard.length - 1 + 1)) + 1;

        if($.inArray(imageToHighlight, picturesHighlighted) < 0) {
            picturesHighlighted.push(imageToHighlight);
            $('.standard-preview img:nth-child('+ imageToHighlight +')').addClass('highlight');

            setTimeout(function() {
                $('.standard-preview img:nth-child('+ imageToHighlight +')').removeClass('highlight');
            }, TIMEPICTUREISHIGHLIGHTED);
        } else {
            highlightPicture();    
        }
    } else {
        picturesHighlighted = [];
        highlightPicture();
    }
}
/** End of functions manipulation the preview screen **/



/** Start camera function **/
/**
 * Adds class to element then counts. When counting is done take picture.
 * 
 * @param {DOMObject} element - element to add styles to
 * @param {int} from - Number to start count from
 * @param {int} to - Number to count to.
 */
function runCountdown(element, from, to) {
    let currentTime = from;
    countdownActive = true;

    $(element).addClass('countdown-running');
    $(element).text(currentTime);

    if(from > to) {
        currentTime--;

        setTimeout(function() {
            runCountdown(element, currentTime, to);
        }, 1000)
    } else {
        if(!pictureInprogress) {
            takePicture();
        }

        $(element).text('');
        $(element).removeClass('countdown-running').hide();
    }
    
}

/**
 * Draws an image on the canvas from the video stream, stores it as a string. Calls the save function.
 */
function takePicture() {
    pictureInprogress = true;
    const videoContainer = document.getElementById("videoContainer");
    const $canvas = document.getElementById("canvas");

    videoContainer.pause();

    $canvas.width = PICTUREWIDTH;
    $canvas.height = PICTUREHEIGHT;
    $canvas.getContext('2d').drawImage(videoContainer, 0, 0, PICTUREWIDTH, PICTUREHEIGHT);
    
    let imageData = $canvas.toDataURL();

    savePictureOnServer(imageData);
}

/**
 * Gets the permissions to use the camera and sets the constrains. Also inits the trigger button.
 */
function initCameraInterface() {
    const constraints = {
        video: {
            facingMode: 'user',
            width: {
                min: 1280,
                ideal: 1280,
                max: 1920,
            },
            height: {
                min: 720,
                ideal: 960,
                max: 1080,
            }
        },
        audio: false
    };

    if(gotCamera) {
        const videoContainer = document.getElementById("videoContainer");
        videoContainer.play();
    } else {
        navigator.mediaDevices.getUserMedia(constraints).then(cameraSuccess);
    }
    
    const transiteTo = $('#camera');
    const $trigger = $('#trigger');

    $trigger.click(function() {
        runCountdown($trigger, 3, 0);
    });

    idleTime = setTimeout(resetInterface, TIMEBEFORERESET);
    makeScreenTransition(transiteTo);
}

/**
 * When got permissions load the stream into the video element on page.
 * 
 * @param {stream} stream - The videostream from the users device
 */
function cameraSuccess(stream) {
    const videoContainer = document.getElementById("videoContainer");
    videoContainer.srcObject = stream;
    
    gotCamera = true;
}
/** End camera functions **/



/** Init functions **/
/**
 * We use the same js file to both the camera ui and the preview. We start be detecting what functions is needed by the current page.
 */
function determineView() {
    if($('#welcome').length > 0) {
        initWelcomeScreen();
    } else {
        initPreviewScreen();
    }
}

/**
 * Sets the click function on the welcome screen
 */
function initWelcomeScreen() {
    $('#start-camera').click(initCameraInterface);
}

/**
 * Starts the preview screen
 */
function initPreviewScreen() {
    getAllPictures().then(result => {
        addImagesToBoard(result);

        setInterval(highlightPicture, TIMEBETWEENHIGHLIGHTING);
        setInterval(checkForNewPictures, PREVIEWSCREENUPDATETIME);
    });
}

/**
 * Starts the app on page load
 */
window.addEventListener("load", determineView, false);
