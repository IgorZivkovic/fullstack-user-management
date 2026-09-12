<?php

namespace Database\Factories;

use App\Enums\Gender;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstNames = [
            'Alex', 'Maya', 'Daniel', 'Sofia', 'Leo', 'Nora', 'Owen', 'Lena', 'Ethan',
            'Ivy', 'Mateo', 'Zara', 'Noah', 'Mila', 'Lucas', 'Chloe', 'Eli', 'Ava',
            'Gabriel', 'Aria',
        ];
        $lastNames = [
            'Martin', 'Ivanov', 'Khan', 'Garcia', 'Smith', 'Novak', 'Petrova', 'Kim',
            'Rossi', 'Walker', 'Santos', 'Wang', 'Silva', 'Hansen', 'Brown', 'Lee',
            'Muller', 'Nowak', 'Nguyen', 'Patel',
        ];
        $countries = [
            'United States', 'Canada', 'Germany', 'France', 'Spain', 'Italy', 'Brazil',
            'Mexico', 'United Kingdom', 'Norway', 'Sweden', 'Poland', 'Ukraine',
            'Japan', 'South Korea', 'Australia', 'India', 'Netherlands', 'Portugal',
            'South Africa',
        ];

        return [
            'name' => fake()->randomElement($firstNames).' '.fake()->randomElement($lastNames),
            'birthday' => fake()->dateTimeBetween('1975-01-01', '2004-12-31')->format('Y-m-d'),
            'gender' => fake()->randomElement(Gender::cases()),
            'country' => fake()->randomElement($countries),
        ];
    }
}
