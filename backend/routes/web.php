<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $frontend = public_path('index.html');

    return file_exists($frontend)
        ? response()->file($frontend)
        : view('welcome');
});

Route::get('/{path}', function () {
    $frontend = public_path('index.html');

    return file_exists($frontend)
        ? response()->file($frontend)
        : view('welcome');
})->where('path', '^(?!api|up).*$');
