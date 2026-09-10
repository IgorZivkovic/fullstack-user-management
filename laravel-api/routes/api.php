<?php

use App\Http\Controllers\UserController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('/health', static fn (): JsonResponse => response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]))->name('health');

    Route::apiResource('users', UserController::class);
});
