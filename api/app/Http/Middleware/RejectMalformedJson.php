<?php

namespace App\Http\Middleware;

use App\Http\Responses\ApiErrorResponse;
use Closure;
use Illuminate\Http\Request;
use JsonException;
use Symfony\Component\HttpFoundation\Response;

class RejectMalformedJson
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $content = trim($request->getContent());
        $acceptsBody = in_array($request->method(), ['POST', 'PUT', 'PATCH'], true);

        if (! $acceptsBody || ! $request->isJson() || $content === '') {
            return $next($request);
        }

        try {
            $payload = json_decode($content, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return $this->badRequest($request);
        }

        if (! is_object($payload)) {
            return $this->badRequest($request);
        }

        return $next($request);
    }

    private function badRequest(Request $request): Response
    {
        return ApiErrorResponse::make(
            $request,
            Response::HTTP_BAD_REQUEST,
            'BAD_REQUEST',
            'Malformed JSON request body',
        );
    }
}
