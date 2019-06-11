let constrains = {
    video: {
        facingMode: 'user'
    },
    audio: false
};

const   preview = document.getElementById('preview'),
        result = document.getElementById('result'),
        sensor = document.getElementById('sensor'),
        trigger = document.getElementById('trigger'),
        countdown = document.getElementById('countdown'),
        container = document.getElementById('preview-container'),
        MAXROTATION = 15,
        MINROTATION = -15,
        SCREENWIDTH = window.innerWidth - 250,
        SCREENHEIGHT = window.innerHeight - 250;

let lastRotation = 0;
let lastX = 0;
let lastY = 0;

let allImages = [];
let imagesOnTheBoard = [];
let imagesHighlighted = [];

let updatePaused = false;


function startCamera(constrains) {
    navigator.mediaDevices.getUserMedia(constrains).then(function(stream) {
        track = stream.getTracks()[0];
        preview.srcObject = stream;
    })
    .catch(function(error) {
        console.error('Hovsa!', error);
    });
}

function startCoundown(timeLeft) {
    countdown.classList.remove('hide');
    countdown.innerText = timeLeft;
    timeLeft--;

    if(timeLeft >= 0) {
        setTimeout(function() {
            startCoundown(timeLeft)
        }, 1000);
    } else {
        countdown.classList.add('hide');
        takePicture();
    }
}

function takePicture() {
    sensor.width = 1280;
    sensor.height = 960;
    sensor.getContext('2d').drawImage(preview, 0, 0, 1280, 960);
    let imageData = sensor.toDataURL();
    result.src = sensor.toDataURL("image/webp");
    sensor.classList.add('hide');
    result.classList.remove('hide');

    saveAsImage(imageData);

    setTimeout(function() {
        location.reload();
    }, 5000);
}

function saveAsImage(imageData) {
    $.ajax({
        type: 'POST',
        url: 'assets/ajaxhandlers/save.php',
        data: {
            image: imageData
        }
    }).done(function(o) {
        console.log(o);
    });
}

function startPreview() {
    $.ajax({
        type: 'POST',
        url: 'assets/ajaxhandlers/getImages.php',
    }).done(function(o) {
        let images = JSON.parse(o);

        $.each(images, function(k, v) {
            let fullImagePath = v;
            let neededImagePath = fullImagePath.substring(fullImagePath.indexOf('assets'));

            let rotation = 'rotate(' + getRotation() + 'deg)';
            let position = getPosition();

            let image = $('<img />', {
                src: neededImagePath,
            }).css({
                top: position[1],
                left: position[0],
                transform: rotation
            });

            allImages.push(neededImagePath);
            imagesOnTheBoard.push(neededImagePath);

            $(container).append(image);
        });
        
        setInterval(highlightPicture, 13000);
        setInterval(checkForNewImages, 10000);
    });
}

function checkForNewImages() {
    if(!updatePaused) {
        $.ajax({
            type: 'POST',
            url: 'assets/ajaxhandlers/getImages.php',
        }).done(function(o) {
            let images = JSON.parse(o);

            allImages = []; 

            $.each(images, function(k, v) {
                let fullImagePath = v;
                let neededImagePath = fullImagePath.substring(fullImagePath.indexOf('assets'));
    
                allImages.push(neededImagePath);
            });

            if(allImages.length !== imagesOnTheBoard.length) {
                updatePaused = true;

                lengthDifference = allImages.length - imagesOnTheBoard.length;
                nextImageInArray = allImages.length - lengthDifference;
                
                lastImageToAdd = allImages.length - 1;

                addNewImageToTheBoard(nextImageInArray, lastImageToAdd);
            }
        });
    }
}

function addNewImageToTheBoard(nextIndex, lastIndex) {
    let imagePath = allImages[nextIndex];

    imagesOnTheBoard.push(imagePath);

    let possibleStartY = [-300, (window.innerHeight + 300)];

    let startRotation = 'rotate(0deg)';
    let startPositionY = possibleStartY[Math.floor(Math.random() * 2)];
    let startPositionX = getPosition()[0];

    if(typeof startPositionX === "undefined") {
        startPositionX = 0;
    }

    let image = $('<img />', {
        src: imagePath,
    }).css({
        top: startPositionY,
        left: startPositionX,
        transform: startRotation
    });

    $(container).append(image);

    let endRotation = 'rotate(' + getRotation() + 'deg)';
    let endPosition = getPosition();

    setTimeout(function() {
        image.css({
            top: endPosition[1],
            left: endPosition[0],
            transform: endRotation
        });

        if(nextIndex < lastIndex) {
            addNewImageToTheBoard(nextIndex + 1, lastIndex);
        } else {
            updatePaused = false;
        }
    }, 150);
}

function getRotation() {
    min = Math.ceil(MINROTATION);
    max = Math.floor(MAXROTATION);
    num = Math.floor(Math.random() * (max - min + 1)) + min;

    if(num === lastRotation) {
        getRotation();
    } else {
        return num;
    }
}

function getPosition() {
    min = 0;
    xMax = Math.floor(SCREENWIDTH);
    yMax = Math.floor(SCREENHEIGHT);

    x = Math.floor(Math.random() * (xMax - min + 1)) + min;
    y = Math.floor(Math.random() * (yMax - min + 1)) + min;

    if(x === lastX) {
        getPosition();
    }

    if(y === lastY) {
        getPosition();
    } else {
        return [x, y];
    }
}

function highlightPicture() {
    if(imagesOnTheBoard.length != imagesHighlighted.length || imagesHighlighted.length == 0) {
        imageToHighlight = Math.floor(Math.random() * (imagesOnTheBoard.length - 1 + 1)) + 1;

        if($.inArray(imageToHighlight, imagesHighlighted) < 0) {
            imagesHighlighted.push(imageToHighlight);
            $('.standard-preview img:nth-child('+ imageToHighlight +')').addClass('highlight');

            setTimeout(function() {
                $('.standard-preview img:nth-child('+ imageToHighlight +')').removeClass('highlight');
            }, 5000);
        } else {
            highlightPicture();    
        }
    } else {
        imagesHighlighted = [];
        highlightPicture();
    }
}

 if(trigger) {

    trigger.onclick = function() {
        trigger.classList.add('hide');
        startCoundown(3);    
    }

    window.addEventListener("load", startCamera(constrains), false);
 }

if(container) {
    window.addEventListener("load", startPreview(), false);
}
