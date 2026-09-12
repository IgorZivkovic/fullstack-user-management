<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\AuthUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class SessionAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> */
    private array $browserCookies = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this
            ->withCredentials()
            ->withHeaders([
                'Origin' => 'http://localhost:4200',
                'Referer' => 'http://localhost:4200/',
            ]);
    }

    public function test_a_user_can_log_in_read_their_account_and_log_out(): void
    {
        $user = AuthUser::factory()->admin()->create([
            'email' => 'admin@example.com',
            'password' => 'admin12345',
        ]);

        $this->startBrowserSession();
        $oldSessionCookie = $this->browserCookies[config('session.cookie')];

        $login = $this->browserPost('/api/v1/auth/login', [
            'email' => ' ADMIN@EXAMPLE.COM ',
            'password' => 'admin12345',
        ]);

        $login
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'admin@example.com')
            ->assertJsonPath('data.role', Role::Admin->value)
            ->assertJsonMissingPath('data.password');

        $this->assertNotSame(
            $oldSessionCookie,
            $this->browserCookies[config('session.cookie')],
        );

        Auth::forgetGuards();

        $this->browserGet('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'admin@example.com')
            ->assertJsonPath('data.role', Role::Admin->value);

        $sessionCookieBeforeLogout = $this->browserCookies[config('session.cookie')];

        $this->browserPost('/api/v1/auth/logout')
            ->assertOk()
            ->assertExactJson(['loggedOut' => true]);

        $this->assertNotSame(
            $sessionCookieBeforeLogout,
            $this->browserCookies[config('session.cookie')],
        );

        Auth::forgetGuards();

        $this->browserGet('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('errorCode', 'UNAUTHORIZED');
    }

    public function test_invalid_credentials_return_a_generic_unauthorized_error(): void
    {
        AuthUser::factory()->create([
            'email' => 'viewer@example.com',
            'password' => 'viewer12345',
        ]);

        $this->startBrowserSession();

        $this->browserPost('/api/v1/auth/login', [
            'email' => 'viewer@example.com',
            'password' => 'wrong-password',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('statusCode', 401)
            ->assertJsonPath('errorCode', 'UNAUTHORIZED')
            ->assertJsonPath('message', 'Invalid credentials')
            ->assertJsonPath('path', '/api/v1/auth/login');
    }

    public function test_login_payload_is_validated(): void
    {
        $this->startBrowserSession();

        $this->browserPost('/api/v1/auth/login', [
            'email' => 'not-an-email',
            'password' => 'short',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonCount(2, 'details');
    }

    public function test_guests_cannot_read_an_account_or_log_out(): void
    {
        $this->browserGet('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('errorCode', 'UNAUTHORIZED');

        $this->startBrowserSession();

        $this->browserPost('/api/v1/auth/logout')
            ->assertUnauthorized()
            ->assertJsonPath('errorCode', 'UNAUTHORIZED');
    }

    public function test_login_is_limited_to_ten_attempts_per_minute_for_an_ip_address(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10']);
        $this->startBrowserSession();

        for ($attempt = 1; $attempt <= 10; $attempt++) {
            $this->browserPost('/api/v1/auth/login', [
                'email' => 'missing@example.com',
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $this->browserPost('/api/v1/auth/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong-password',
        ])
            ->assertTooManyRequests()
            ->assertJsonPath('errorCode', 'TOO_MANY_REQUESTS');
    }

    public function test_the_old_refresh_endpoint_is_not_available(): void
    {
        $this->postJson('/api/v1/auth/refresh', [], [], JSON_FORCE_OBJECT)
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');
    }

    private function startBrowserSession(): void
    {
        $response = $this->get('/sanctum/csrf-cookie');

        $response->assertNoContent();
        $this->rememberCookies($response);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function browserPost(string $uri, array $payload = []): TestResponse
    {
        $this->withUnencryptedCookies($this->browserCookies);

        if (isset($this->browserCookies['XSRF-TOKEN'])) {
            $this->withHeader('X-XSRF-TOKEN', $this->browserCookies['XSRF-TOKEN']);
        }

        $jsonOptions = $payload === [] ? JSON_FORCE_OBJECT : 0;

        return tap($this->postJson($uri, $payload, [], $jsonOptions), function (TestResponse $response): void {
            $this->rememberCookies($response);
        });
    }

    private function browserGet(string $uri): TestResponse
    {
        $this->withUnencryptedCookies($this->browserCookies);

        return tap($this->getJson($uri), function (TestResponse $response): void {
            $this->rememberCookies($response);
        });
    }

    private function rememberCookies(TestResponse $response): void
    {
        foreach ($response->headers->getCookies() as $cookie) {
            $this->browserCookies[$cookie->getName()] = $cookie->getValue();
        }
    }
}
