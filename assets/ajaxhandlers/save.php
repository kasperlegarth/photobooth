<?php
    define('UPLOAD_DIR', $_SERVER['DOCUMENT_ROOT'] . '/assets/pictures/');
    $pictureTime = date('d-M-H-i-s', time());

    $img = $_POST['image'];
    $img = str_replace('data:image/png;base64,','', $img);
    $img = str_replace(' ', '+', $img);  
    $data = base64_decode($img);
    $file = UPLOAD_DIR . 'Sommerfest-' . $pictureTime . '.jpg';
    $upload = file_put_contents($file, $data);
?>