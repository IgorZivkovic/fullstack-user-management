<?php

namespace Tests\Feature;

use App\Models\AuthUser;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class JobTrackerAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_manage_their_job_tracker_data(): void
    {
        $owner = AuthUser::factory()->create();
        [$company, $application, $interview] = $this->createTrackerGraph($owner);
        $gate = Gate::forUser($owner);

        $this->assertTrue($gate->allows('viewAny', Company::class));
        $this->assertTrue($gate->allows('create', Company::class));
        $this->assertTrue($gate->allows('viewAny', JobApplication::class));
        $this->assertTrue($gate->allows('create', JobApplication::class));
        $this->assertTrue($gate->allows('viewAny', Interview::class));
        $this->assertTrue($gate->allows('create', Interview::class));

        foreach ([$company, $application, $interview] as $resource) {
            $this->assertTrue($gate->allows('view', $resource));
            $this->assertTrue($gate->allows('update', $resource));
            $this->assertTrue($gate->allows('delete', $resource));
        }
    }

    public function test_other_users_and_admin_cannot_access_private_job_tracker_data(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        $admin = AuthUser::factory()->admin()->create();
        $resources = $this->createTrackerGraph($owner);

        foreach ([$otherUser, $admin] as $actor) {
            foreach ($resources as $resource) {
                foreach (['view', 'update', 'delete'] as $ability) {
                    $response = Gate::forUser($actor)->inspect($ability, $resource);

                    $this->assertTrue($response->denied());
                    $this->assertSame(404, $response->status());
                }
            }
        }
    }

    public function test_owner_scopes_hide_records_from_other_accounts(): void
    {
        $owner = AuthUser::factory()->create();
        $otherUser = AuthUser::factory()->create();
        [$company, $application, $interview] = $this->createTrackerGraph($owner);
        [$otherCompany, $otherApplication, $otherInterview] = $this->createTrackerGraph($otherUser);

        $this->assertSame([$company->id], Company::ownedBy($owner)->pluck('id')->all());
        $this->assertSame([$application->id], JobApplication::ownedBy($owner)->pluck('id')->all());
        $this->assertSame([$interview->id], Interview::ownedBy($owner)->pluck('id')->all());

        $this->assertFalse(Company::ownedBy($owner)->whereKey($otherCompany->getKey())->exists());
        $this->assertFalse(JobApplication::ownedBy($owner)->whereKey($otherApplication->getKey())->exists());
        $this->assertFalse(Interview::ownedBy($owner)->whereKey($otherInterview->getKey())->exists());
    }

    public function test_ownership_foreign_keys_cannot_be_mass_assigned(): void
    {
        $company = new Company(['auth_user_id' => 999, 'name' => 'Hidden Owner']);
        $application = new JobApplication([
            'company_id' => 999,
            'position' => 'Developer',
            'status' => 'saved',
            'work_mode' => 'remote',
        ]);
        $interview = new Interview([
            'job_application_id' => 999,
            'type' => 'screening',
            'scheduled_at' => '2026-09-20 10:00:00',
        ]);

        $this->assertNull($company->auth_user_id);
        $this->assertNull($application->company_id);
        $this->assertNull($interview->job_application_id);
    }

    public function test_existing_user_management_permissions_are_unchanged(): void
    {
        $viewer = AuthUser::factory()->create();
        $admin = AuthUser::factory()->admin()->create();
        $user = User::factory()->create();

        $this->assertTrue(Gate::forUser($viewer)->allows('viewAny', User::class));
        $this->assertTrue(Gate::forUser($viewer)->allows('view', $user));
        $this->assertFalse(Gate::forUser($viewer)->allows('create', User::class));
        $this->assertFalse(Gate::forUser($viewer)->allows('update', $user));
        $this->assertFalse(Gate::forUser($viewer)->allows('delete', $user));

        $this->assertTrue(Gate::forUser($admin)->allows('viewAny', User::class));
        $this->assertTrue(Gate::forUser($admin)->allows('view', $user));
        $this->assertTrue(Gate::forUser($admin)->allows('create', User::class));
        $this->assertTrue(Gate::forUser($admin)->allows('update', $user));
        $this->assertTrue(Gate::forUser($admin)->allows('delete', $user));
    }

    /**
     * @return array{Company, JobApplication, Interview}
     */
    private function createTrackerGraph(AuthUser $owner): array
    {
        $company = Company::factory()->for($owner)->create();
        $application = JobApplication::factory()->for($company)->create();
        $interview = Interview::factory()->for($application)->create();

        return [$company, $application, $interview];
    }
}
