<?php

namespace Tests\Feature;

use App\Enums\Gender;
use App\Models\AuthUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleBasedUserPermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_user_endpoints(): void
    {
        $user = User::factory()->create();

        $this->getJson('/api/v1/users')
            ->assertUnauthorized()
            ->assertJsonPath('errorCode', 'UNAUTHORIZED');

        $this->getJson("/api/v1/users/{$user->id}")
            ->assertUnauthorized()
            ->assertJsonPath('errorCode', 'UNAUTHORIZED');

        $this->postJson('/api/v1/users', $this->validUserPayload())
            ->assertUnauthorized()
            ->assertJsonPath('errorCode', 'UNAUTHORIZED');

        $this->putJson("/api/v1/users/{$user->id}", ['name' => 'Blocked Update'])
            ->assertUnauthorized()
            ->assertJsonPath('errorCode', 'UNAUTHORIZED');

        $this->deleteJson("/api/v1/users/{$user->id}")
            ->assertUnauthorized()
            ->assertJsonPath('errorCode', 'UNAUTHORIZED');
    }

    public function test_viewers_can_list_and_read_users(): void
    {
        $viewer = AuthUser::factory()->create();
        $user = User::factory()->create();

        $this->actingAs($viewer);

        $this->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson("/api/v1/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }

    public function test_viewers_cannot_create_update_or_delete_users(): void
    {
        $viewer = AuthUser::factory()->create();
        $user = User::factory()->create([
            'name' => 'Unchanged User',
        ]);

        $this->actingAs($viewer);

        $this->postJson('/api/v1/users', $this->validUserPayload())
            ->assertForbidden()
            ->assertJsonPath('errorCode', 'FORBIDDEN');

        $this->putJson("/api/v1/users/{$user->id}", ['name' => 'Blocked Update'])
            ->assertForbidden()
            ->assertJsonPath('errorCode', 'FORBIDDEN');

        $this->deleteJson("/api/v1/users/{$user->id}")
            ->assertForbidden()
            ->assertJsonPath('errorCode', 'FORBIDDEN');

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Unchanged User',
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function validUserPayload(): array
    {
        return [
            'name' => 'New User',
            'birthday' => '1995-04-18',
            'gender' => Gender::Other->value,
            'country' => 'Serbia',
        ];
    }
}
