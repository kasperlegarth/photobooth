<?php
    define('UPLOAD_DIR', $_SERVER['DOCUMENT_ROOT'] . '/assets/pictures/');
    $images = glob(UPLOAD_DIR . '*.jpg');


    $response = json_encode($images);

    echo $response;
?>