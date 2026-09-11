<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    public function test_migrations_create_the_application_schema(): void
    {
        $this->artisan('migrate:fresh')->assertSuccessful();

        $this->assertTrue(Schema::hasColumns('users', [
            'id',
            'name',
            'birthday',
            'gender',
            'country',
        ]));
        $this->assertFalse(Schema::hasColumn('users', 'email'));

        $this->assertTrue(Schema::hasColumns('auth_users', [
            'id',
            'email',
            'password',
            'role',
        ]));

        $this->assertTrue(Schema::hasColumns('sessions', [
            'id',
            'user_id',
            'ip_address',
            'user_agent',
            'payload',
            'last_activity',
        ]));

        $this->assertTrue(Schema::hasTable('cache'));
        $this->assertTrue(Schema::hasTable('cache_locks'));
        $this->assertFalse(Schema::hasTable('jobs'));
    }

    public function test_auth_user_email_must_be_unique(): void
    {
        $this->artisan('migrate:fresh')->assertSuccessful();

        DB::table('auth_users')->insert([
            'email' => 'admin@example.com',
            'password' => 'hashed-password',
            'role' => 'admin',
        ]);

        $this->expectException(QueryException::class);

        DB::table('auth_users')->insert([
            'email' => 'admin@example.com',
            'password' => 'another-hash',
            'role' => 'user',
        ]);
    }

    public function test_migrations_can_be_rolled_back(): void
    {
        $this->artisan('migrate:fresh')->assertSuccessful();
        $this->artisan('migrate:rollback')->assertSuccessful();

        $this->assertFalse(Schema::hasTable('users'));
        $this->assertFalse(Schema::hasTable('auth_users'));
        $this->assertFalse(Schema::hasTable('sessions'));
        $this->assertFalse(Schema::hasTable('cache'));
    }
}
