<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\JobApplicationController;
use App\Http\Controllers\UserController;
use App\Models\Company;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    /**
     * Check API health.
     *
     * Returns the current service status and server timestamp.
     *
     * @response array{status: 'ok', timestamp: string}
     */
    Route::get('/health', static fn (): JsonResponse => response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]))->name('health');

    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:login')
            ->name('login');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('/me', [AuthController::class, 'me'])->name('me');
        });
    });

    Route::apiResource('users', UserController::class)
        ->middleware('auth:sanctum')
        ->middlewareFor('index', Authorize::using('viewAny', User::class))
        ->middlewareFor('show', Authorize::using('view', 'user'))
        ->middlewareFor('store', Authorize::using('create', User::class))
        ->middlewareFor('update', Authorize::using('update', 'user'))
        ->middlewareFor('destroy', Authorize::using('delete', 'user'));

    Route::apiResource('companies', CompanyController::class)
        ->middleware('auth:sanctum')
        ->middlewareFor('index', Authorize::using('viewAny', Company::class))
        ->middlewareFor('show', Authorize::using('view', 'company'))
        ->middlewareFor('store', Authorize::using('create', Company::class))
        ->middlewareFor('update', Authorize::using('update', 'company'))
        ->middlewareFor('destroy', Authorize::using('delete', 'company'));

    Route::apiResource('job-applications', JobApplicationController::class)
        ->only(['index', 'show'])
        ->middleware('auth:sanctum')
        ->middlewareFor('index', Authorize::using('viewAny', JobApplication::class))
        ->middlewareFor('show', Authorize::using('view', 'job_application'));
});
