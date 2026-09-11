<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class LogHttpRequest
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);

        try {
            $response = $next($request);
        } catch (Throwable $exception) {
            $this->writeLog(
                $request,
                $this->exceptionStatus($exception),
                $startedAt,
            );

            throw $exception;
        }

        $this->writeLog(
            $request,
            $response->getStatusCode(),
            $startedAt,
            strlen((string) $response->getContent()),
        );

        return $response;
    }

    private function exceptionStatus(Throwable $exception): int
    {
        return match (true) {
            $exception instanceof ValidationException => $exception->status,
            $exception instanceof ModelNotFoundException => Response::HTTP_NOT_FOUND,
            $exception instanceof AuthenticationException => Response::HTTP_UNAUTHORIZED,
            $exception instanceof AuthorizationException => Response::HTTP_FORBIDDEN,
            $exception instanceof HttpExceptionInterface => $exception->getStatusCode(),
            default => Response::HTTP_INTERNAL_SERVER_ERROR,
        };
    }

    private function writeLog(
        Request $request,
        int $statusCode,
        int $startedAt,
        ?int $responseSize = null,
    ): void {
        Log::info('HTTP request completed', [
            'method' => $request->method(),
            'path' => '/'.$request->path(),
            'status' => $statusCode,
            'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            'response_size' => $responseSize,
        ]);
    }
}
