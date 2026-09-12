<?php

namespace App\Policies;

use App\Models\AuthUser;
use App\Models\Company;
use Illuminate\Auth\Access\Response;

class CompanyPolicy
{
    public function viewAny(AuthUser $authUser): bool
    {
        return true;
    }

    public function view(AuthUser $authUser, Company $company): Response
    {
        return $this->ownerAccess($authUser, $company);
    }

    public function create(AuthUser $authUser): bool
    {
        return true;
    }

    public function update(AuthUser $authUser, Company $company): Response
    {
        return $this->ownerAccess($authUser, $company);
    }

    public function delete(AuthUser $authUser, Company $company): Response
    {
        return $this->ownerAccess($authUser, $company);
    }

    private function ownerAccess(AuthUser $authUser, Company $company): Response
    {
        return (int) $company->auth_user_id === (int) $authUser->getKey()
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
