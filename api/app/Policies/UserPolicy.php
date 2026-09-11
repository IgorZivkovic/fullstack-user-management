<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\AuthUser;
use App\Models\User;

class UserPolicy
{
    public function viewAny(AuthUser $authUser): bool
    {
        return $this->canReadUsers($authUser);
    }

    public function view(AuthUser $authUser, User $user): bool
    {
        return $this->canReadUsers($authUser);
    }

    public function create(AuthUser $authUser): bool
    {
        return $this->canManageUsers($authUser);
    }

    public function update(AuthUser $authUser, User $user): bool
    {
        return $this->canManageUsers($authUser);
    }

    public function delete(AuthUser $authUser, User $user): bool
    {
        return $this->canManageUsers($authUser);
    }

    private function canReadUsers(AuthUser $authUser): bool
    {
        return in_array($authUser->role, [Role::Admin, Role::User], true);
    }

    private function canManageUsers(AuthUser $authUser): bool
    {
        return $authUser->role === Role::Admin;
    }
}
