<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListJobApplicationsRequest;
use App\Http\Resources\JobApplicationResource;
use App\Models\AuthUser;
use App\Models\JobApplication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
        return new JobApplicationResource($jobApplication->load('company:id,name'));
    }
}
