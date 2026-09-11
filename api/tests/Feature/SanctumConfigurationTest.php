<?php

namespace Tests\Feature;

use Tests\TestCase;

class SanctumConfigurationTest extends TestCase
{
    public function test_the_csrf_endpoint_issues_spa_cookies(): void
    {
        $response = $this
            ->withHeaders([
                'Accept' => 'application/json',
                'Origin' => 'http://localhost:4200',
                'Referer' => 'http://localhost:4200/',
            ])
            ->get('/sanctum/csrf-cookie');

        $response
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:4200')
            ->assertHeader('Access-Control-Allow-Credentials', 'true')
            ->assertCookie('XSRF-TOKEN')
            ->assertCookie(config('session.cookie'));

        $cookies = collect($response->headers->getCookies())->keyBy->getName();

        $this->assertFalse($cookies->get('XSRF-TOKEN')->isHttpOnly());
        $this->assertTrue($cookies->get(config('session.cookie'))->isHttpOnly());
        $this->assertSame('lax', $cookies->get('XSRF-TOKEN')->getSameSite());
    }

    public function test_the_frontend_origins_are_configured_as_stateful(): void
    {
        $this->assertContains('localhost:4200', config('sanctum.stateful'));
        $this->assertContains('127.0.0.1:4200', config('sanctum.stateful'));
    }

    public function test_credentialed_cors_allows_the_csrf_header(): void
    {
        $this
            ->withHeaders([
                'Origin' => 'http://localhost:4200',
                'Access-Control-Request-Method' => 'POST',
                'Access-Control-Request-Headers' => 'content-type,x-xsrf-token',
            ])
            ->options('/api/v1/users')
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:4200')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }
}
