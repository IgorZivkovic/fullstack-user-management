<?php

namespace Tests\Feature;

use App\Enums\Gender;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManageUsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_be_created(): void
    {
        $payload = [
            'name' => 'Mila Novak',
            'birthday' => '1994-06-12',
            'gender' => 'female',
            'country' => 'Serbia',
        ];

        $response = $this->postJson('/api/v1/users', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', $payload['name'])
            ->assertJsonPath('data.birthday', $payload['birthday'])
            ->assertJsonPath('data.gender', $payload['gender'])
            ->assertJsonPath('data.country', $payload['country']);

        $this->assertDatabaseHas('users', [
            'id' => $response->json('data.id'),
            ...$payload,
        ]);
    }

    public function test_a_user_can_be_updated_without_replacing_omitted_fields(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'birthday' => '1988-03-20',
            'gender' => Gender::Male,
            'country' => 'Canada',
        ]);

        $response = $this->putJson("/api/v1/users/{$user->id}", [
            'name' => 'Updated Name',
            'gender' => 'other',
        ]);

        $response
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'id' => $user->id,
                    'name' => 'Updated Name',
                    'birthday' => '1988-03-20',
                    'gender' => 'other',
                    'country' => 'Canada',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'birthday' => '1988-03-20',
            'gender' => 'other',
            'country' => 'Canada',
        ]);
    }

    public function test_a_user_can_be_deleted(): void
    {
        $user = User::factory()->create();

        $this->deleteJson("/api/v1/users/{$user->id}")
            ->assertOk()
            ->assertExactJson(['deleted' => true]);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_updating_a_missing_user_returns_not_found(): void
    {
        $this->putJson('/api/v1/users/999999', ['name' => 'Missing User'])
            ->assertNotFound();
    }

    public function test_deleting_a_missing_user_returns_not_found(): void
    {
        $this->deleteJson('/api/v1/users/999999')
            ->assertNotFound();
    }
}
