<?php

namespace Tests\Feature;

use App\Models\AuthUser;
use App\Models\Company;
use App\Models\JobApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_company_endpoints(): void
    {
        $company = Company::factory()->create();

        $this->getJson('/api/v1/companies')->assertUnauthorized();
        $this->getJson("/api/v1/companies/{$company->id}")->assertUnauthorized();
        $this->postJson('/api/v1/companies', $this->validPayload())->assertUnauthorized();
        $this->putJson("/api/v1/companies/{$company->id}", ['name' => 'Blocked'])->assertUnauthorized();
        $this->deleteJson("/api/v1/companies/{$company->id}")->assertUnauthorized();
    }

    public function test_companies_are_searched_paginated_and_limited_to_the_owner(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();

        Company::factory()->for($owner)->create(['name' => 'Acme', 'location' => 'Lisbon']);
        Company::factory()->for($owner)->create(['name' => 'Berlin Works', 'location' => 'London']);
        Company::factory()->for($owner)->create(['name' => 'Northstar', 'location' => 'Berlin']);
        Company::factory()->for($otherUser)->create(['name' => 'Private Berlin', 'location' => 'Berlin']);

        $this->actingAs($owner)
            ->getJson('/api/v1/companies?search=berlin&per_page=1&page=2')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Northstar')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.total', 2)
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_company_is_created_for_the_authenticated_account(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        $payload = [
            ...$this->validPayload(),
            'auth_user_id' => $otherUser->id,
        ];

        $response = $this->actingAs($owner)->postJson('/api/v1/companies', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Acme')
            ->assertJsonPath('data.website', 'https://acme.example.com')
            ->assertJsonPath('data.location', 'Belgrade')
            ->assertJsonMissingPath('data.auth_user_id')
            ->assertJsonStructure(['data' => ['id', 'notes', 'created_at', 'updated_at']]);

        $this->assertDatabaseHas('companies', [
            'id' => $response->json('data.id'),
            'auth_user_id' => $owner->id,
            'name' => 'Acme',
        ]);
    }

    public function test_owner_can_view_and_update_a_company(): void
    {
        $owner = AuthUser::factory()->create();
        $company = Company::factory()->for($owner)->create([
            'name' => 'Original Company',
            'location' => 'Berlin',
            'notes' => 'Original notes',
        ]);

        $this->actingAs($owner)
            ->getJson("/api/v1/companies/{$company->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Original Company');

        $this->putJson("/api/v1/companies/{$company->id}", [
            'name' => 'Updated Company',
            'location' => null,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Company')
            ->assertJsonPath('data.location', null)
            ->assertJsonPath('data.notes', 'Original notes');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'auth_user_id' => $owner->id,
            'name' => 'Updated Company',
            'location' => null,
            'notes' => 'Original notes',
        ]);
    }

    public function test_company_names_are_unique_only_within_the_same_account(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        Company::factory()->for($otherUser)->create(['name' => 'Acme']);

        $this->actingAs($owner)
            ->postJson('/api/v1/companies', $this->validPayload())
            ->assertCreated();

        $this->postJson('/api/v1/companies', $this->validPayload())
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonCount(1, 'details');

        $this->assertDatabaseCount('companies', 2);
    }

    public function test_company_payload_and_list_parameters_are_validated(): void
    {
        $owner = AuthUser::factory()->create();
        $this->actingAs($owner);

        $this->postJson('/api/v1/companies', [
            'name' => '',
            'website' => 'not-a-url',
            'location' => str_repeat('a', 161),
            'notes' => str_repeat('a', 5001),
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonCount(4, 'details');

        $this->getJson('/api/v1/companies?page=0&per_page=101&search='.str_repeat('a', 161))
            ->assertUnprocessable()
            ->assertJsonPath('errorCode', 'VALIDATION_ERROR')
            ->assertJsonCount(3, 'details');
    }

    public function test_other_accounts_company_is_hidden(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        $company = Company::factory()->for($otherUser)->create(['name' => 'Private Company']);

        $this->actingAs($owner);

        $this->getJson("/api/v1/companies/{$company->id}")
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');
        $this->putJson("/api/v1/companies/{$company->id}", ['name' => 'Blocked'])
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');
        $this->deleteJson("/api/v1/companies/{$company->id}")
            ->assertNotFound()
            ->assertJsonPath('errorCode', 'NOT_FOUND');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'auth_user_id' => $otherUser->id,
            'name' => 'Private Company',
        ]);
    }

    public function test_empty_company_can_be_deleted(): void
    {
        $owner = AuthUser::factory()->create();
        $company = Company::factory()->for($owner)->create();

        $this->actingAs($owner)
            ->deleteJson("/api/v1/companies/{$company->id}")
            ->assertOk()
            ->assertExactJson(['deleted' => true]);

        $this->assertDatabaseMissing('companies', ['id' => $company->id]);
    }

    public function test_company_with_applications_returns_a_conflict_when_deleted(): void
    {
        $owner = AuthUser::factory()->create();
        $company = Company::factory()->for($owner)->create();
        JobApplication::factory()->for($company)->create();

        $this->actingAs($owner)
            ->deleteJson("/api/v1/companies/{$company->id}")
            ->assertConflict()
            ->assertJsonPath('statusCode', 409)
            ->assertJsonPath('errorCode', 'COMPANY_HAS_APPLICATIONS')
            ->assertJsonPath('message', 'Company cannot be deleted while it has job applications');

        $this->assertDatabaseHas('companies', ['id' => $company->id]);
    }

    /**
     * @return array<string, string>
     */
    private function validPayload(): array
    {
        return [
            'name' => 'Acme',
            'website' => 'https://acme.example.com',
            'location' => 'Belgrade',
            'notes' => 'Product company',
        ];
    }
}
