<?php

namespace Tests\Feature;

use App\Enums\Gender;
use App\Enums\Role;
use App\Models\AuthUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DomainModelsTest extends TestCase
{
    public function test_user_casts_existing_domain_values(): void
    {
        $user = new User([
            'name' => 'Test User',
            'birthday' => '1990-05-17',
            'gender' => Gender::Other,
            'country' => 'Serbia',
        ]);

        $this->assertSame('1990-05-17', $user->birthday->format('Y-m-d'));
        $this->assertSame(Gender::Other, $user->gender);
        $this->assertFalse($user->usesTimestamps());
    }

    public function test_auth_user_casts_role_hashes_and_hides_password(): void
    {
        $authUser = new AuthUser([
            'email' => 'admin@example.com',
            'password' => 'secret-password',
            'role' => Role::Admin,
        ]);

        $this->assertSame(Role::Admin, $authUser->role);
        $this->assertTrue(Hash::check('secret-password', $authUser->password));
        $this->assertArrayNotHasKey('password', $authUser->toArray());
        $this->assertFalse($authUser->usesTimestamps());
        $this->assertSame(AuthUser::class, config('auth.providers.users.model'));
    }

    public function test_enums_preserve_the_existing_api_values(): void
    {
        $this->assertSame(['male', 'female', 'other'], array_column(Gender::cases(), 'value'));
        $this->assertSame(['admin', 'user'], array_column(Role::cases(), 'value'));
    }
}
