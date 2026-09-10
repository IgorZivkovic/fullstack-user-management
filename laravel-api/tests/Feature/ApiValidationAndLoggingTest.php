<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class ApiValidationAndLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_validation_errors_use_the_api_error_envelope(): void
    {
        $response = $this->postJson('/api/v1/users', [
            'name' => '',
            'birthday' => '2024-02-31',
            'gender' => 'unknown',
            'country' => str_repeat('a', 121),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('statusCode', 422)
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonPath('path', '/api/v1/users')
            ->assertJsonPath('message', 'Validation failed')
            ->assertJsonCount(4, 'details')
            ->assertJsonStructure(['timestamp', 'details']);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_update_and_list_parameters_are_validated(): void
    {
        $user = User::factory()->create();

        $this->putJson("/api/v1/users/{$user->id}", [
            'birthday' => 'not-a-date',
            'gender' => null,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonCount(2, 'details');

        $this->getJson('/api/v1/users?page=0&per_page=101&gender=unknown')
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonCount(3, 'details');
    }

    public function test_malformed_json_uses_the_bad_request_envelope(): void
    {
        $response = $this->call(
            'POST',
            '/api/v1/users',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
            ],
            '{"name":',
        );

        $response
            ->assertBadRequest()
            ->assertJsonPath('statusCode', 400)
            ->assertJsonPath('errorCode', 'BAD_REQUEST')
            ->assertJsonPath('path', '/api/v1/users')
            ->assertJsonPath('message', 'Malformed JSON request body')
            ->assertJsonMissingPath('details')
            ->assertJsonStructure(['timestamp']);
    }

    public function test_missing_users_use_the_existing_user_not_found_error(): void
    {
        $this->getJson('/api/v1/users/999999')
            ->assertNotFound()
            ->assertJsonPath('statusCode', 404)
            ->assertJsonPath('errorCode', 'USER_NOT_FOUND')
            ->assertJsonPath('path', '/api/v1/users/999999')
            ->assertJsonPath('message', 'User 999999 not found');
    }

    public function test_request_logs_do_not_include_the_body_query_or_password(): void
    {
        Log::spy();
        $secret = 'never-write-this-password';

        $this->postJson('/api/v1/users?password='.$secret, [
            'name' => 'Logged User',
            'birthday' => '1990-01-15',
            'gender' => 'other',
            'country' => 'Serbia',
            'password' => $secret,
        ])->assertCreated();

        Log::shouldHaveReceived('info')
            ->once()
            ->with(
                'HTTP request completed',
                Mockery::on(function (array $context) use ($secret): bool {
                    $serialized = json_encode($context, JSON_THROW_ON_ERROR);

                    return $context['method'] === 'POST'
                        && $context['path'] === '/api/v1/users'
                        && $context['status'] === 201
                        && ! str_contains($serialized, 'password')
                        && ! str_contains($serialized, $secret);
                }),
            );
    }
}
