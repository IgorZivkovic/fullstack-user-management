<?php

namespace App\Policies;

use App\Models\AuthUser;
use App\Models\JobApplication;
use Illuminate\Auth\Access\Response;

class JobApplicationPolicy
{
    public function viewAny(AuthUser $authUser): bool
    {
        return true;
    }

    public function view(AuthUser $authUser, JobApplication $jobApplication): Response
    {
        return $this->ownerAccess($authUser, $jobApplication);
    }

    public function create(AuthUser $authUser): bool
    {
        return true;
    }

    public function update(AuthUser $authUser, JobApplication $jobApplication): Response
    {
        return $this->ownerAccess($authUser, $jobApplication);
    }

    public function delete(AuthUser $authUser, JobApplication $jobApplication): Response
    {
        return $this->ownerAccess($authUser, $jobApplication);
    }

    private function ownerAccess(AuthUser $authUser, JobApplication $jobApplication): Response
    {
        $isOwner = $jobApplication->company()
            ->where('auth_user_id', $authUser->getKey())
            ->exists();

        return $isOwner ? Response::allow() : Response::denyAsNotFound();
    }
}
