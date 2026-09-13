<?php

namespace Tests\Feature;

use App\Models\AuthUser;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobApplication;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobTrackerDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_the_dashboard(): void
    {
        $this->getJson('/api/v1/dashboard')->assertUnauthorized();
    }

    public function test_dashboard_returns_owned_counts_and_five_most_recent_applications(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        $company = Company::factory()->for($owner)->create(['name' => 'Owner Company']);
        $otherCompany = Company::factory()->for($otherUser)->create();
        $applications = collect();
        $statuses = ['saved', 'applied', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'];

        foreach ($statuses as $index => $status) {
            $applications->push(JobApplication::factory()->for($company)->create([
                'position' => "Position {$index}",
                'status' => $status,
                'created_at' => CarbonImmutable::parse('2026-09-01')->addDays($index),
            ]));
        }

        JobApplication::factory()->count(3)->for($otherCompany)->create(['status' => 'applied']);

        $response = $this->actingAs($owner)->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('data.total_applications', 7)
            ->assertJsonPath('data.applications_by_status.saved', 1)
            ->assertJsonPath('data.applications_by_status.applied', 2)
            ->assertJsonPath('data.applications_by_status.interview', 1)
            ->assertJsonPath('data.applications_by_status.offer', 1)
            ->assertJsonPath('data.applications_by_status.rejected', 1)
            ->assertJsonPath('data.applications_by_status.withdrawn', 1)
            ->assertJsonCount(5, 'data.recent_applications')
            ->assertJsonPath('data.recent_applications.0.id', $applications->last()->id)
            ->assertJsonPath('data.recent_applications.0.company.name', 'Owner Company');

        $this->assertEquals(
            $applications->reverse()->take(5)->pluck('id')->all(),
            $response->json('data.recent_applications.*.id'),
        );
    }

    public function test_dashboard_returns_only_owned_pending_upcoming_interviews(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-12 12:00:00'));

        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        $company = Company::factory()->for($owner)->create(['name' => 'Owner Company']);
        $application = JobApplication::factory()->for($company)->create([
            'position' => 'Laravel Developer',
        ]);
        $otherApplication = JobApplication::factory()
            ->for(Company::factory()->for($otherUser))
            ->create();
        $upcoming = collect();

        foreach (range(1, 6) as $day) {
            $upcoming->push(Interview::factory()->for($application)->create([
                'scheduled_at' => now()->addDays($day),
                'outcome' => null,
            ]));
        }

        Interview::factory()->for($application)->create([
            'scheduled_at' => now()->subDay(),
            'outcome' => null,
        ]);
        Interview::factory()->for($application)->create([
            'scheduled_at' => now()->addHour(),
            'outcome' => 'cancelled',
        ]);
        Interview::factory()->for($otherApplication)->create([
            'scheduled_at' => now()->addMinutes(30),
            'outcome' => null,
        ]);

        $response = $this->actingAs($owner)->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonCount(5, 'data.upcoming_interviews')
            ->assertJsonPath('data.upcoming_interviews.0.id', $upcoming->first()->id)
            ->assertJsonPath(
                'data.upcoming_interviews.0.job_application.position',
                'Laravel Developer',
            )
            ->assertJsonPath(
                'data.upcoming_interviews.0.job_application.company.name',
                'Owner Company',
            );

        $this->assertEquals(
            $upcoming->take(5)->pluck('id')->all(),
            $response->json('data.upcoming_interviews.*.id'),
        );
    }

    public function test_empty_dashboard_keeps_a_stable_summary_shape(): void
    {
        $owner = AuthUser::factory()->create();

        $this->actingAs($owner)
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total_applications', 0)
            ->assertJsonPath('data.applications_by_status', [
                'saved' => 0,
                'applied' => 0,
                'interview' => 0,
                'offer' => 0,
                'rejected' => 0,
                'withdrawn' => 0,
            ])
            ->assertJsonCount(0, 'data.recent_applications')
            ->assertJsonCount(0, 'data.upcoming_interviews');
    }
}
