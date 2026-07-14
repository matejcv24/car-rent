<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RentalController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:authentication');
        Route::post('/accept', [AuthController::class, 'accept'])->middleware('throttle:authentication');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/invite', [AuthController::class, 'invite'])
                ->middleware('throttle:authentication');
        });
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/vehicles', [VehicleController::class, 'index']);
        Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show']);
        Route::get('/vehicles/{vehicle}/history', [VehicleController::class, 'history']);
        Route::get('/rentals', [RentalController::class, 'index']);
        Route::get('/rentals/upcoming', [RentalController::class, 'upcoming']);
        Route::get('/rentals/{rental}', [RentalController::class, 'show']);
        Route::get('/dashboard/calendar', [DashboardController::class, 'calendar']);
        Route::get('/dashboard/alerts', [DashboardController::class, 'alerts']);
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

        Route::middleware('throttle:api-write')->group(function (): void {
            Route::post('/vehicles', [VehicleController::class, 'store']);
            Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update']);
            Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy']);
            Route::post('/vehicles/{vehicle}/registrations', [VehicleController::class, 'storeRegistration']);
            Route::post('/vehicles/{vehicle}/services', [VehicleController::class, 'storeService']);
            Route::post('/rentals', [RentalController::class, 'store']);
            Route::put('/rentals/{rental}', [RentalController::class, 'update']);
            Route::delete('/rentals/{rental}', [RentalController::class, 'destroy']);
        });
    });
});
