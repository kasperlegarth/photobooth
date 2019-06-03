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
        container = document.getElementById('preview-container');

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
    sensor.width = 950;
    sensor.height = 1265;
    sensor.getContext('2d').drawImage(preview, 0, 0, 950, 1265);
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
            $(container).append('<img src="'+ neededImagePath +'">');
        })
    });
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
