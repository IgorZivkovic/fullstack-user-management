<?php

namespace App\OpenApi;

use Dedoc\Scramble\Contracts\DocumentTransformer;
use Dedoc\Scramble\OpenApiContext;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Reference;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\SecurityRequirement;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Dedoc\Scramble\Support\Generator\Tag;
use Dedoc\Scramble\Support\Generator\Types\ArrayType;
use Dedoc\Scramble\Support\Generator\Types\IntegerType;
use Dedoc\Scramble\Support\Generator\Types\ObjectType;
use Dedoc\Scramble\Support\Generator\Types\StringType;

final class UserManagementApiDocumentation implements DocumentTransformer
{
    private const SESSION_SCHEME = 'sanctumSession';

    private const XSRF_COOKIE_SCHEME = 'xsrfCookie';

    private const CSRF_HEADER_SCHEME = 'csrfHeader';

    public function handle(OpenApi $document, OpenApiContext $context): void
    {
        $this->addTags($document);
        $this->addSecuritySchemes($document);
        $errorSchema = $this->addErrorSchema($document);

        foreach ($document->paths as $path) {
            foreach ($path->operations as $operation) {
                $this->documentOperation($path->path, $operation, $errorSchema);
            }
        }
    }

    private function addTags(OpenApi $document): void
    {
        $document->tags = [
            new Tag('Health', 'Service availability.'),
            new Tag('Authentication', 'Sanctum CSRF, login, session and logout endpoints.'),
            new Tag('Users', 'Authenticated user directory operations with role-based writes.'),
        ];
    }

    private function addSecuritySchemes(OpenApi $document): void
    {
        $sessionCookie = (string) config('session.cookie');

        $document->components
            ->addSecurityScheme(
                self::SESSION_SCHEME,
                SecurityScheme::apiKey('cookie', $sessionCookie)
                    ->as(self::SESSION_SCHEME)
                    ->setDescription('HttpOnly Laravel session cookie issued after a successful login.'),
            )
            ->addSecurityScheme(
                self::XSRF_COOKIE_SCHEME,
                SecurityScheme::apiKey('cookie', 'XSRF-TOKEN')
                    ->as(self::XSRF_COOKIE_SCHEME)
                    ->setDescription('Readable CSRF cookie issued by GET /sanctum/csrf-cookie.'),
            )
            ->addSecurityScheme(
                self::CSRF_HEADER_SCHEME,
                SecurityScheme::apiKey('header', 'X-XSRF-TOKEN')
                    ->as(self::CSRF_HEADER_SCHEME)
                    ->setDescription('Decoded XSRF-TOKEN cookie value required for state-changing requests.'),
            );
    }

    private function addErrorSchema(OpenApi $document): Reference
    {
        $details = (new ArrayType)
            ->setItems(new StringType);

        $error = (new ObjectType)
            ->addProperty('statusCode', new IntegerType)
            ->addProperty('errorCode', (new StringType)->examples(['VALIDATION_ERROR']))
            ->addProperty('timestamp', (new StringType)->format('date-time'))
            ->addProperty('path', (new StringType)->examples(['/api/v1/users']))
            ->addProperty('message', (new StringType)->examples(['Validation failed']))
            ->addProperty('details', $details)
            ->setRequired(['statusCode', 'errorCode', 'timestamp', 'path', 'message']);

        return $document->components->addSchema('ApiError', Schema::fromType($error));
    }

    private function documentOperation(string $path, Operation $operation, Reference $errorSchema): void
    {
        $operation->setTags([$this->tagFor($path)]);
        $operation->security = $this->securityFor($path, $operation->method);

        foreach ($this->errorStatusesFor($path, $operation->method) as $status) {
            if (! $this->hasResponse($operation, $status)) {
                $operation->addResponse(
                    Response::make($status)
                        ->setDescription($this->errorDescription($status))
                        ->setContent('application/json', $errorSchema),
                );
            }
        }
    }

    private function tagFor(string $path): string
    {
        return match (true) {
            $path === 'api/v1/health' => 'Health',
            $path === 'sanctum/csrf-cookie', str_starts_with($path, 'api/v1/auth/') => 'Authentication',
            default => 'Users',
        };
    }

    /**
     * @return list<SecurityRequirement>
     */
    private function securityFor(string $path, string $method): array
    {
        if ($path === 'api/v1/health' || $path === 'sanctum/csrf-cookie') {
            return [];
        }

        $schemes = [];

        if ($path !== 'api/v1/auth/login') {
            $schemes[self::SESSION_SCHEME] = [];
        }

        if (in_array(strtolower($method), ['post', 'put', 'patch', 'delete'], true)) {
            $schemes[self::XSRF_COOKIE_SCHEME] = [];
            $schemes[self::CSRF_HEADER_SCHEME] = [];
        }

        return [new SecurityRequirement($schemes)];
    }

    /**
     * @return list<int>
     */
    private function errorStatusesFor(string $path, string $method): array
    {
        if ($path === 'sanctum/csrf-cookie' || $path === 'api/v1/health') {
            return [];
        }

        if ($path === 'api/v1/auth/login') {
            return [401, 422, 429, 500];
        }

        $statuses = [401, 500];

        if (str_starts_with($path, 'api/v1/users')) {
            $statuses[] = 403;

            if ($path === 'api/v1/users' && in_array(strtolower($method), ['get', 'post'], true)) {
                $statuses[] = 422;
            }

            if ($path === 'api/v1/users/{user}') {
                $statuses[] = 404;

                if (in_array(strtolower($method), ['put', 'patch'], true)) {
                    $statuses[] = 422;
                }
            }
        }

        return array_values(array_unique($statuses));
    }

    private function hasResponse(Operation $operation, int $status): bool
    {
        foreach ($operation->responses ?? [] as $response) {
            if ($response instanceof Response && (int) $response->code === $status) {
                return true;
            }

            if ($response instanceof Reference && (int) $response->resolve()->code === $status) {
                return true;
            }
        }

        return false;
    }

    private function errorDescription(int $status): string
    {
        return match ($status) {
            401 => 'Unauthenticated or invalid credentials.',
            403 => 'Authenticated user does not have permission for this action.',
            404 => 'Requested user was not found.',
            422 => 'Request validation failed.',
            429 => 'Too many login attempts.',
            default => 'Unexpected server error.',
        };
    }
}
