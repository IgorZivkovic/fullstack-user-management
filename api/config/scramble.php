<?php

return [
    'api_path' => [
        'include' => [
            'api/v1',
            'sanctum/csrf-cookie',
        ],
        'exclude' => 'api/v1/docs',
    ],

    'info' => [
        'version' => env('API_VERSION', 'v1'),
        'description' => <<<'MARKDOWN'
REST API for a full-stack job application tracker. It covers companies, job applications, interview scheduling and dashboard summaries. The original user management module remains available as an administrator showcase.

Job Tracker records are private to the authenticated account. Requests for another account's company, application or interview return `404 Not Found` instead of exposing whether that resource exists.

Authentication uses Laravel Sanctum's stateful SPA flow:

1. Request `GET /sanctum/csrf-cookie` with credentials enabled.
2. Submit `POST /api/v1/auth/login`; the browser stores the session cookie.
3. Keep credentials enabled for protected requests. Mutating requests also send the decoded `XSRF-TOKEN` cookie value in the `X-XSRF-TOKEN` header.

The documentation UI includes credentials and copies the CSRF cookie into the header automatically. Request the CSRF cookie before using **Try it** on login or another mutating endpoint.
MARKDOWN,
    ],

    'ui' => [
        'title' => 'Job Tracker API',
    ],

    'renderer' => 'scalar',

    'renderers' => [
        'scalar' => [
            'view' => 'scramble::scalar',
            'cdn' => 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
            'theme' => 'laravel',
            'darkMode' => false,
            'showDeveloperTools' => 'never',
            'credentials' => 'include',
        ],
    ],

    // This demo intentionally exposes its API reference without authentication.
    'middleware' => ['web'],

    // Sanctum uses cookies and CSRF protection, not bearer tokens.
    'security_strategy' => null,
];
