<?php

namespace Database\Factories;

use App\Models\AuthUser;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'auth_user_id' => AuthUser::factory(),
            'name' => fake()->unique()->company(),
            'website' => fake()->optional()->url(),
            'location' => fake()->optional()->city(),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
