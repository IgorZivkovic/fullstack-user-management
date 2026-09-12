<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListJobApplicationsRequest;
use App\Http\Requests\StoreJobApplicationRequest;
use App\Http\Requests\UpdateJobApplicationRequest;
use App\Http\Resources\JobApplicationResource;
use App\Models\AuthUser;
use App\Models\JobApplication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class JobApplicationController extends Controller
{
    public function index(ListJobApplicationsRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 15);
        $search = trim($filters['search'] ?? '');
        $status = $filters['status'] ?? null;
        $workMode = $filters['work_mode'] ?? null;
        $companyId = $filters['company_id'] ?? null;
        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';

        /** @var AuthUser $authUser */
        $authUser = $request->user();

        $applications = JobApplication::query()
            ->with('company:id,name')
            ->ownedBy($authUser)
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->whereLike('position', "%{$search}%")
                        ->orWhereHas(
                            'company',
                            fn (Builder $companyQuery) => $companyQuery->whereLike('name', "%{$search}%"),
                        );
                });
            })
            ->when($status !== null, fn (Builder $query) => $query->where('status', $status))
            ->when($workMode !== null, fn (Builder $query) => $query->where('work_mode', $workMode))
            ->when($companyId !== null, fn (Builder $query) => $query->where('company_id', $companyId))
            ->orderBy($sort, $direction)
            ->orderBy('id', $direction)
            ->paginate($perPage)
            ->withQueryString();

        return JobApplicationResource::collection($applications);
    }

    public function show(JobApplication $jobApplication): JobApplicationResource
    {
        return new JobApplicationResource($jobApplication->load([
            'company:id,name',
            'interviews' => fn ($query) => $query
                ->orderBy('scheduled_at')
                ->orderBy('id'),
        ]));
    }

    public function store(StoreJobApplicationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $companyId = $data['company_id'];
        unset($data['company_id']);

        /** @var AuthUser $authUser */
        $authUser = $request->user();
        $company = $authUser->companies()->findOrFail($companyId);
        $application = $company->jobApplications()->create($data);

        return (new JobApplicationResource($application->load('company:id,name')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(
        UpdateJobApplicationRequest $request,
        JobApplication $jobApplication,
    ): JobApplicationResource {
        $data = $request->validated();

        if (array_key_exists('company_id', $data)) {
            /** @var AuthUser $authUser */
            $authUser = $request->user();
            $company = $authUser->companies()->findOrFail($data['company_id']);
            $jobApplication->company()->associate($company);
            unset($data['company_id']);
        }

        $jobApplication->fill($data)->save();

        return new JobApplicationResource(
            $jobApplication->refresh()->load('company:id,name'),
        );
    }

    public function destroy(JobApplication $jobApplication): JsonResponse
    {
        $jobApplication->delete();

        return response()->json(['deleted' => true]);
    }
}
