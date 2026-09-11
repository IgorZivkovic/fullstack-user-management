<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_it_returns_the_application_health_status(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonStructure(['status', 'timestamp']);

        $this->assertIsString($response->json('timestamp'));
    }

    public function test_it_allows_requests_from_the_configured_web_origin(): void
    {
        $response = $this
            ->withHeader('Origin', 'http://localhost:4200')
            ->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    }
}
