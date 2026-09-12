<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ApiErrorResponse
{
    /**
     * @param  list<string>  $details
     * @param  array<string, list<string>>  $errors
     */
    public static function make(
        Request $request,
        int $statusCode,
        string $errorCode,
        string $message,
        array $details = [],
        array $errors = [],
    ): JsonResponse {
        $payload = [
            'statusCode' => $statusCode,
            'errorCode' => $errorCode,
            'timestamp' => now()->toISOString(),
            'path' => '/'.$request->path(),
            'message' => $message,
        ];

        if ($details !== []) {
            $payload['details'] = $details;
        }

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $statusCode);
    }
}
