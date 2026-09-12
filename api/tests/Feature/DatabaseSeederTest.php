<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\AuthUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    public function test_database_seeder_creates_demo_users_and_auth_accounts(): void
    {
        $this->artisan('migrate:fresh --seed')->assertSuccessful();

        $this->assertDatabaseCount('users', 60);
        $this->assertDatabaseCount('auth_users', 2);

        $admin = AuthUser::query()->where('email', 'admin@example.com')->firstOrFail();
        $viewer = AuthUser::query()->where('email', 'viewer@example.com')->firstOrFail();

        $this->assertSame(Role::Admin, $admin->role);
        $this->assertSame(Role::User, $viewer->role);
        $this->assertTrue(Hash::check('admin12345', $admin->password));
        $this->assertTrue(Hash::check('viewer12345', $viewer->password));
    }

    public function test_demo_users_are_repeatable_after_a_fresh_migration(): void
    {
        $this->artisan('migrate:fresh --seed')->assertSuccessful();
        $firstRun = $this->demoUsers();

        $this->artisan('migrate:fresh --seed')->assertSuccessful();

        $this->assertSame($firstRun, $this->demoUsers());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function demoUsers(): array
    {
        return DB::table('users')
            ->orderBy('id')
            ->get()
            ->map(fn (object $user) => (array) $user)
            ->all();
    }
}
