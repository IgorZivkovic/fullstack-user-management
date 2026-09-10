<?php

use App\Http\Middleware\LogHttpRequest;
use App\Http\Middleware\RejectMalformedJson;
use App\Http\Responses\ApiErrorResponse;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append([
            LogHttpRequest::class,
            RejectMalformedJson::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (ValidationException $exception, Request $request): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiErrorResponse::make(
                $request,
                $exception->status,
                'VALIDATION_ERROR',
                'Validation failed',
                collect($exception->errors())->flatten()->values()->all(),
            );
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiErrorResponse::make(
                $request,
                Response::HTTP_UNAUTHORIZED,
                'UNAUTHORIZED',
                'Unauthenticated',
            );
        });

        $exceptions->render(function (HttpExceptionInterface $exception, Request $request): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            $statusCode = $exception->getStatusCode();
            $previous = $exception->getPrevious();

            if (
                $exception instanceof NotFoundHttpException
                && $previous instanceof ModelNotFoundException
                && $previous->getModel() === User::class
            ) {
                $id = $previous->getIds()[0] ?? null;

                return ApiErrorResponse::make(
                    $request,
                    Response::HTTP_NOT_FOUND,
                    'USER_NOT_FOUND',
                    $id === null ? 'User not found' : "User {$id} not found",
                );
            }

            $errorCode = match ($statusCode) {
                Response::HTTP_BAD_REQUEST => 'BAD_REQUEST',
                Response::HTTP_UNAUTHORIZED => 'UNAUTHORIZED',
                Response::HTTP_FORBIDDEN => 'FORBIDDEN',
                Response::HTTP_NOT_FOUND => 'NOT_FOUND',
                Response::HTTP_CONFLICT => 'CONFLICT',
                Response::HTTP_UNPROCESSABLE_ENTITY => 'UNPROCESSABLE_ENTITY',
                Response::HTTP_TOO_MANY_REQUESTS => 'TOO_MANY_REQUESTS',
                default => 'UNKNOWN_ERROR',
            };

            return ApiErrorResponse::make(
                $request,
                $statusCode,
                $errorCode,
                Response::$statusTexts[$statusCode] ?? 'HTTP error',
            );
        });

        $exceptions->render(function (\Throwable $_exception, Request $request): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            return ApiErrorResponse::make(
                $request,
                Response::HTTP_INTERNAL_SERVER_ERROR,
                'INTERNAL_SERVER_ERROR',
                'Internal server error',
            );
        });
    })->create();
