<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListCompaniesRequest;
use App\Http\Requests\StoreCompanyRequest;
use App\Http\Requests\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Http\Responses\ApiErrorResponse;
use App\Models\AuthUser;
use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class CompanyController extends Controller
{
    /**
     * List owned companies.
     *
     * Returns Laravel pagination metadata. Results can be searched by company name or location.
     */
    public function index(ListCompaniesRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 15);
        $search = trim($filters['search'] ?? '');

        /** @var AuthUser $authUser */
        $authUser = $request->user();

        $companies = Company::query()
            ->ownedBy($authUser)
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->whereLike('name', "%{$search}%")
                        ->orWhereLike('location', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return CompanyResource::collection($companies);
    }

    /**
     * Get an owned company.
     *
     * A company owned by another account is returned as not found.
     */
    public function show(Company $company): CompanyResource
    {
        return new CompanyResource($company);
    }

    /**
     * Create a company.
     *
     * The company is always assigned to the authenticated account.
     */
    public function store(StoreCompanyRequest $request): JsonResponse
    {
        /** @var AuthUser $authUser */
        $authUser = $request->user();
        $company = $authUser->companies()->create($request->validated());

        return (new CompanyResource($company))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Update an owned company.
     *
     * Only supplied fields are changed.
     */
    public function update(UpdateCompanyRequest $request, Company $company): CompanyResource
    {
        $company->update($request->validated());

        return new CompanyResource($company->refresh());
    }

    /**
     * Delete an owned company.
     *
     * A company with job applications cannot be deleted.
     */
    public function destroy(Request $request, Company $company): JsonResponse
    {
        if ($company->jobApplications()->exists()) {
            return ApiErrorResponse::make(
                $request,
                Response::HTTP_CONFLICT,
                'COMPANY_HAS_APPLICATIONS',
                'Company cannot be deleted while it has job applications',
            );
        }

        $company->delete();

        return response()->json(['deleted' => true]);
    }
}
