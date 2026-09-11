<?php

namespace Tests\Feature;

use App\Enums\Gender;
use App\Models\AuthUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadUsersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(AuthUser::factory()->create());
    }

    public function test_users_are_paginated_in_id_order_with_laravel_metadata(): void
    {
        $users = User::factory()->count(12)->create();

        $response = $this->getJson('/api/v1/users?page=2&per_page=5');

        $response
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.total', 12)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'birthday', 'gender', 'country'],
                ],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'links',
                    'path',
                    'per_page',
                    'to',
                    'total',
                ],
            ]);

        $this->assertSame(
            $users->slice(5, 5)->pluck('id')->all(),
            $response->json('data.*.id'),
        );
    }

    public function test_users_can_be_searched_by_name_or_country_and_filtered_by_gender(): void
    {
        $matchingByName = User::factory()->create([
            'name' => 'Maya Searchable',
            'gender' => Gender::Female,
            'country' => 'Canada',
        ]);
        $matchingByCountry = User::factory()->create([
            'name' => 'Daniel Martin',
            'gender' => Gender::Female,
            'country' => 'Maya Islands',
        ]);
        User::factory()->create([
            'name' => 'Maya Excluded',
            'gender' => Gender::Male,
            'country' => 'Canada',
        ]);
        User::factory()->create([
            'name' => 'Unrelated User',
            'gender' => Gender::Female,
            'country' => 'Serbia',
        ]);

        $response = $this->getJson('/api/v1/users?search=maya&gender=female');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->assertSame(
            [$matchingByName->id, $matchingByCountry->id],
            $response->json('data.*.id'),
        );
    }

    public function test_an_empty_search_result_keeps_the_paginated_response_shape(): void
    {
        User::factory()->count(3)->create();

        $this->getJson('/api/v1/users?search=does-not-exist')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.total', 0);
    }

    public function test_a_user_can_be_retrieved_by_id(): void
    {
        $user = User::factory()->create([
            'name' => 'Noah Rossi',
            'birthday' => '2000-09-05',
            'gender' => Gender::Other,
            'country' => 'Italy',
        ]);

        $this->getJson("/api/v1/users/{$user->id}")
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'id' => $user->id,
                    'name' => 'Noah Rossi',
                    'birthday' => '2000-09-05',
                    'gender' => 'other',
                    'country' => 'Italy',
                ],
            ]);
    }

    public function test_a_missing_user_returns_not_found(): void
    {
        $this->getJson('/api/v1/users/999999')->assertNotFound();
    }
}
