<?php

namespace Database\Factories;

use App\Enums\InterviewOutcome;
use App\Enums\InterviewType;
use App\Models\Interview;
use App\Models\JobApplication;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Interview>
 */
class InterviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'job_application_id' => JobApplication::factory(),
            'type' => fake()->randomElement(InterviewType::cases()),
            'scheduled_at' => fake()->dateTimeBetween('-1 month', '+1 month'),
            'contact_name' => fake()->optional()->name(),
            'contact_email' => fake()->optional()->safeEmail(),
            'location_or_link' => fake()->optional()->randomElement([fake()->url(), fake()->city()]),
            'notes' => fake()->optional()->sentence(),
            'outcome' => fake()->boolean(60) ? fake()->randomElement(InterviewOutcome::cases()) : null,
        ];
    }
}
