<?php

namespace Database\Factories;

use App\Enums\JobApplicationStatus;
use App\Enums\WorkMode;
use App\Models\Company;
use App\Models\JobApplication;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobApplication>
 */
class JobApplicationFactory extends Factory
{
    public function definition(): array
    {
        $salaryMin = fake()->boolean(70) ? fake()->numberBetween(40_000, 100_000) : null;

        return [
            'company_id' => Company::factory(),
            'position' => fake()->jobTitle(),
            'status' => fake()->randomElement(JobApplicationStatus::cases()),
            'work_mode' => fake()->randomElement(WorkMode::cases()),
            'employment_type' => fake()->optional()->randomElement([
                'full-time',
                'part-time',
                'contract',
                'internship',
            ]),
            'source_url' => fake()->optional()->url(),
            'applied_at' => fake()->optional()->dateTimeBetween('-3 months', 'now'),
            'next_action_at' => fake()->optional()->dateTimeBetween('now', '+1 month'),
            'salary_min' => $salaryMin,
            'salary_max' => $salaryMin === null ? null : $salaryMin + fake()->numberBetween(5_000, 25_000),
            'currency' => $salaryMin === null ? null : fake()->randomElement(['EUR', 'USD', 'GBP']),
            'notes' => fake()->optional()->paragraph(),
        ];
    }
}
