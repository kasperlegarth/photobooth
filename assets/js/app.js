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
        countdown = document.getElementById('countdown');

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
    sensor.width = preview.videoWidth;
    sensor.height = preview.videoHeight;
    sensor.getContext('2d').drawImage(preview, 0, 0);
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

trigger.onclick = function() {
    trigger.classList.add('hide');
    startCoundown(3);    
}

window.addEventListener("load", startCamera(constrains), false);