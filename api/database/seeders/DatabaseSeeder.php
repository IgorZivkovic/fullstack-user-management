<?php

namespace Database\Seeders;

use App\Models\AuthUser;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        fake()->seed(42);

        User::factory()->count(60)->create();

        AuthUser::factory()->admin()->create([
            'email' => 'admin@example.com',
            'password' => 'admin12345',
        ]);

        AuthUser::factory()->create([
            'email' => 'viewer@example.com',
            'password' => 'viewer12345',
        ]);
    }
}
