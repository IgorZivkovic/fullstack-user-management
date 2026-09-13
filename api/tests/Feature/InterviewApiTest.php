<?php

namespace Tests\Feature;

use App\Models\AuthUser;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InterviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_interview_endpoints(): void
    {
        $application = JobApplication::factory()->create();
        $interview = Interview::factory()->for($application)->create();
        $baseUrl = "/api/v1/job-applications/{$application->id}/interviews";

        $this->getJson($baseUrl)->assertUnauthorized();
        $this->postJson($baseUrl, $this->validPayload())->assertUnauthorized();
        $this->patchJson("{$baseUrl}/{$interview->id}", ['type' => 'final'])->assertUnauthorized();
        $this->deleteJson("{$baseUrl}/{$interview->id}")->assertUnauthorized();
    }

    public function test_owner_can_list_interviews_in_chronological_order(): void
    {
        $owner = AuthUser::factory()->create();
        $application = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();
        $later = Interview::factory()->for($application)->create([
            'scheduled_at' => '2026-09-20 12:00:00',
        ]);
        $earlier = Interview::factory()->for($application)->create([
            'scheduled_at' => '2026-09-15 09:00:00',
        ]);

        $this->actingAs($owner)
            ->getJson("/api/v1/job-applications/{$application->id}/interviews")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $earlier->id)
            ->assertJsonPath('data.1.id', $later->id)
            ->assertJsonStructure(['data' => [[
                'id',
                'job_application_id',
                'type',
                'scheduled_at',
                'contact_name',
                'contact_email',
                'location_or_link',
                'notes',
                'outcome',
                'created_at',
                'updated_at',
            ]]]);
    }

    public function test_application_detail_includes_sorted_interviews(): void
    {
        $owner = AuthUser::factory()->create();
        $application = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();
        $later = Interview::factory()->for($application)->create([
            'scheduled_at' => '2026-10-01 12:00:00',
        ]);
        $earlier = Interview::factory()->for($application)->create([
            'scheduled_at' => '2026-09-20 12:00:00',
        ]);

        $this->actingAs($owner)
            ->getJson("/api/v1/job-applications/{$application->id}")
            ->assertOk()
            ->assertJsonPath('data.interviews.0.id', $earlier->id)
            ->assertJsonPath('data.interviews.1.id', $later->id);
    }

    public function test_owner_can_schedule_an_interview_for_an_application(): void
    {
        $owner = AuthUser::factory()->create();
        $application = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();
        $otherApplication = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();
        $payload = [
            ...$this->validPayload(),
            'job_application_id' => $otherApplication->id,
        ];

        $response = $this->actingAs($owner)
            ->postJson("/api/v1/job-applications/{$application->id}/interviews", $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('data.job_application_id', $application->id)
            ->assertJsonPath('data.type', 'technical')
            ->assertJsonPath('data.contact_email', 'recruiter@example.com')
            ->assertJsonPath('data.outcome', null);

        $this->assertDatabaseHas('interviews', [
            'id' => $response->json('data.id'),
            'job_application_id' => $application->id,
            'type' => 'technical',
            'contact_email' => 'recruiter@example.com',
        ]);
    }

    public function test_owner_can_partially_update_and_delete_an_interview(): void
    {
        $owner = AuthUser::factory()->create();
        $application = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();
        $interview = Interview::factory()->for($application)->create([
            'type' => 'screening',
            'contact_name' => 'Original Contact',
            'outcome' => null,
        ]);
        $baseUrl = "/api/v1/job-applications/{$application->id}/interviews/{$interview->id}";

        $this->actingAs($owner)
            ->patchJson($baseUrl, [
                'type' => 'final',
                'outcome' => 'passed',
            ])
            ->assertOk()
            ->assertJsonPath('data.type', 'final')
            ->assertJsonPath('data.outcome', 'passed')
            ->assertJsonPath('data.contact_name', 'Original Contact');

        $this->deleteJson($baseUrl)
            ->assertOk()
            ->assertExactJson(['deleted' => true]);

        $this->assertDatabaseMissing('interviews', ['id' => $interview->id]);
        $this->assertDatabaseHas('job_applications', ['id' => $application->id]);
    }

    public function test_interview_payload_is_validated(): void
    {
        $owner = AuthUser::factory()->create();
        $application = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/job-applications/{$application->id}/interviews", [
                'type' => 'informal',
                'scheduled_at' => 'not-a-date',
                'contact_name' => str_repeat('a', 161),
                'contact_email' => 'not-an-email',
                'location_or_link' => str_repeat('a', 2049),
                'notes' => str_repeat('a', 10001),
                'outcome' => 'maybe',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonCount(7, 'details');
    }

    public function test_other_accounts_application_and_interviews_are_hidden(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        $application = JobApplication::factory()
            ->for(Company::factory()->for($otherUser))
            ->create();
        $interview = Interview::factory()->for($application)->create();
        $baseUrl = "/api/v1/job-applications/{$application->id}/interviews";

        $this->actingAs($owner);

        $this->getJson($baseUrl)
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');
        $this->postJson($baseUrl, $this->validPayload())
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');
        $this->patchJson("{$baseUrl}/{$interview->id}", ['type' => 'final'])
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');
        $this->deleteJson("{$baseUrl}/{$interview->id}")
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');
    }

    public function test_interview_must_belong_to_the_application_in_the_url(): void
    {
        $owner = AuthUser::factory()->create();
        $firstApplication = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();
        $secondApplication = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();
        $interview = Interview::factory()->for($secondApplication)->create([
            'type' => 'screening',
        ]);
        $wrongUrl = "/api/v1/job-applications/{$firstApplication->id}/interviews/{$interview->id}";

        $this->actingAs($owner)
            ->patchJson($wrongUrl, ['type' => 'final'])
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');

        $this->deleteJson($wrongUrl)
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');

        $this->assertDatabaseHas('interviews', [
            'id' => $interview->id,
            'job_application_id' => $secondApplication->id,
            'type' => 'screening',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'type' => 'technical',
            'scheduled_at' => '2026-09-20T10:30:00+02:00',
            'contact_name' => 'Alex Recruiter',
            'contact_email' => 'recruiter@example.com',
            'location_or_link' => 'https://meet.example.com/interview',
            'notes' => 'Prepare architecture examples.',
            'outcome' => null,
        ];
    }
}
