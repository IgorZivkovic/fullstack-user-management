<?php

namespace App\Policies;

use App\Models\AuthUser;
use App\Models\Interview;
use Illuminate\Auth\Access\Response;

class InterviewPolicy
{
    public function viewAny(AuthUser $authUser): bool
    {
        return true;
    }

    public function view(AuthUser $authUser, Interview $interview): Response
    {
        return $this->ownerAccess($authUser, $interview);
    }

    public function create(AuthUser $authUser): bool
    {
        return true;
    }

    public function update(AuthUser $authUser, Interview $interview): Response
    {
        return $this->ownerAccess($authUser, $interview);
    }

    public function delete(AuthUser $authUser, Interview $interview): Response
    {
        return $this->ownerAccess($authUser, $interview);
    }

    private function ownerAccess(AuthUser $authUser, Interview $interview): Response
    {
        $isOwner = $interview->jobApplication()
            ->whereHas('company', fn ($query) => $query->where('auth_user_id', $authUser->getKey()))
            ->exists();

        return $isOwner ? Response::allow() : Response::denyAsNotFound();
    }
}
