<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\AuthUser;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuthUser>
 */
class AuthUserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
            'role' => Role::User,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => Role::Admin]);
    }
}
