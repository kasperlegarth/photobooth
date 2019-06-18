<?php
    define('UPLOAD_DIR', $_SERVER['DOCUMENT_ROOT'] . '/assets/pictures/');
    $pictureTime = date('j-M-H-i-s', time());

    $result = [
        'status' => 'error',
        'data' => '',
    ];

    $img = $_POST['image'];
    $img = str_replace('data:image/png;base64,','', $img);
    $img = str_replace(' ', '+', $img);  
    $data = base64_decode($img);
    $file = UPLOAD_DIR . 'Sommerfest-' . $pictureTime . '.jpg';
    
    if($upload = file_put_contents($file, $data)) {
        $result['status'] = 'ok';
        $result['data'] = $file;
    }

    echo json_encode($result);
?>