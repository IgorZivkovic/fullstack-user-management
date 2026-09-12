<?php

namespace Tests\Feature;

use App\Models\AuthUser;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManageJobApplicationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_manage_job_applications(): void
    {
        $application = JobApplication::factory()->create();

        $this->postJson('/api/v1/job-applications', $this->validPayload($application->company))
            ->assertUnauthorized();
        $this->putJson("/api/v1/job-applications/{$application->id}", ['position' => 'Blocked'])
            ->assertUnauthorized();
        $this->deleteJson("/api/v1/job-applications/{$application->id}")
            ->assertUnauthorized();
    }

    public function test_application_is_created_for_an_owned_company(): void
    {
        $owner = AuthUser::factory()->create();
        $company = Company::factory()->for($owner)->create(['name' => 'Acme']);
        $payload = [
            ...$this->validPayload($company),
            'currency' => 'eur',
            'auth_user_id' => AuthUser::factory()->create()->id,
        ];

        $response = $this->actingAs($owner)->postJson('/api/v1/job-applications', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('data.company_id', $company->id)
            ->assertJsonPath('data.company.name', 'Acme')
            ->assertJsonPath('data.position', 'Laravel Developer')
            ->assertJsonPath('data.status', 'applied')
            ->assertJsonPath('data.work_mode', 'remote')
            ->assertJsonPath('data.salary_min', 60_000)
            ->assertJsonPath('data.salary_max', 75_000)
            ->assertJsonPath('data.currency', 'EUR')
            ->assertJsonMissingPath('data.auth_user_id');

        $this->assertDatabaseHas('job_applications', [
            'id' => $response->json('data.id'),
            'company_id' => $company->id,
            'position' => 'Laravel Developer',
            'currency' => 'EUR',
        ]);
    }

    public function test_owner_can_partially_update_and_move_an_application(): void
    {
        $owner = AuthUser::factory()->create();
        $firstCompany = Company::factory()->for($owner)->create();
        $secondCompany = Company::factory()->for($owner)->create(['name' => 'New Company']);
        $application = JobApplication::factory()->for($firstCompany)->create([
            'position' => 'Original Position',
            'status' => 'saved',
            'work_mode' => 'onsite',
            'notes' => 'Keep this note',
            'salary_min' => 50_000,
            'salary_max' => 70_000,
            'currency' => 'EUR',
        ]);

        $this->actingAs($owner)
            ->patchJson("/api/v1/job-applications/{$application->id}", [
                'company_id' => $secondCompany->id,
                'position' => 'Updated Position',
                'status' => 'interview',
                'work_mode' => 'hybrid',
                'salary_min' => 55_000,
            ])
            ->assertOk()
            ->assertJsonPath('data.company_id', $secondCompany->id)
            ->assertJsonPath('data.company.name', 'New Company')
            ->assertJsonPath('data.position', 'Updated Position')
            ->assertJsonPath('data.status', 'interview')
            ->assertJsonPath('data.salary_max', 70_000)
            ->assertJsonPath('data.notes', 'Keep this note');

        $this->assertDatabaseHas('job_applications', [
            'id' => $application->id,
            'company_id' => $secondCompany->id,
            'position' => 'Updated Position',
            'status' => 'interview',
        ]);
    }

    public function test_application_payload_is_validated(): void
    {
        $owner = AuthUser::factory()->create();
        $company = Company::factory()->for($owner)->create();

        $this->actingAs($owner)
            ->postJson('/api/v1/job-applications', [
                'company_id' => $company->id,
                'position' => '',
                'status' => 'unknown',
                'work_mode' => 'space',
                'employment_type' => str_repeat('a', 81),
                'source_url' => 'not-a-url',
                'applied_at' => '12/09/2026',
                'next_action_at' => 'not-a-date',
                'salary_min' => -1,
                'salary_max' => 10_000_000_000,
                'currency' => 'EURO',
                'notes' => str_repeat('a', 10001),
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonCount(12, 'details');
    }

    public function test_salary_range_and_currency_are_validated_against_the_resulting_record(): void
    {
        $owner = AuthUser::factory()->create();
        $company = Company::factory()->for($owner)->create();
        $application = JobApplication::factory()->for($company)->create([
            'salary_min' => 60_000,
            'salary_max' => 80_000,
            'currency' => 'EUR',
        ]);

        $this->actingAs($owner)
            ->patchJson("/api/v1/job-applications/{$application->id}", ['salary_min' => 90_000])
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR');

        $this->patchJson("/api/v1/job-applications/{$application->id}", ['currency' => null])
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR');

        $this->assertDatabaseHas('job_applications', [
            'id' => $application->id,
            'salary_min' => 60_000,
            'salary_max' => 80_000,
            'currency' => 'EUR',
        ]);
    }

    public function test_application_cannot_use_another_accounts_company(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        $ownedCompany = Company::factory()->for($owner)->create();
        $privateCompany = Company::factory()->for($otherUser)->create();
        $application = JobApplication::factory()->for($ownedCompany)->create();

        $this->actingAs($owner)
            ->postJson('/api/v1/job-applications', $this->validPayload($privateCompany))
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR');

        $this->patchJson("/api/v1/job-applications/{$application->id}", [
            'company_id' => $privateCompany->id,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR');

        $this->assertDatabaseHas('job_applications', [
            'id' => $application->id,
            'company_id' => $ownedCompany->id,
        ]);
    }

    public function test_other_accounts_application_is_hidden_for_updates_and_deletion(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        $application = JobApplication::factory()
            ->for(Company::factory()->for($otherUser))
            ->create(['position' => 'Private Position']);

        $this->actingAs($owner);

        $this->patchJson("/api/v1/job-applications/{$application->id}", ['position' => 'Blocked'])
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');
        $this->deleteJson("/api/v1/job-applications/{$application->id}")
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');

        $this->assertDatabaseHas('job_applications', [
            'id' => $application->id,
            'position' => 'Private Position',
        ]);
    }

    public function test_deleting_an_application_also_deletes_its_interviews(): void
    {
        $owner = AuthUser::factory()->create();
        $application = JobApplication::factory()
            ->for(Company::factory()->for($owner))
            ->create();
        $interview = Interview::factory()->for($application)->create();

        $this->actingAs($owner)
            ->deleteJson("/api/v1/job-applications/{$application->id}")
            ->assertOk()
            ->assertExactJson(['deleted' => true]);

        $this->assertDatabaseMissing('job_applications', ['id' => $application->id]);
        $this->assertDatabaseMissing('interviews', ['id' => $interview->id]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(Company $company): array
    {
        return [
            'company_id' => $company->id,
            'position' => 'Laravel Developer',
            'status' => 'applied',
            'work_mode' => 'remote',
            'employment_type' => 'full-time',
            'source_url' => 'https://acme.example.com/jobs/laravel-developer',
            'applied_at' => '2026-09-12',
            'next_action_at' => '2026-09-18T12:00:00+02:00',
            'salary_min' => 60_000,
            'salary_max' => 75_000,
            'currency' => 'EUR',
            'notes' => 'Application submitted.',
        ];
    }
}
