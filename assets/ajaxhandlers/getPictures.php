<?php
    $response = [
        'status' => 'error',
        'data' => ''
    ];

    define('UPLOAD_DIR', $_SERVER['DOCUMENT_ROOT'] . '/assets/pictures/');
    $images = glob(UPLOAD_DIR . '*.jpg');
    $response['status'] = 'ok';
    $response['data'] = json_encode($images);

    echo json_encode($response);
?>