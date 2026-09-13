<?php

namespace App\Http\Controllers;

use App\Enums\JobApplicationStatus;
use App\Http\Resources\JobTrackerDashboardResource;
use App\Models\AuthUser;
use App\Models\Interview;
use App\Models\JobApplication;
use Illuminate\Http\Request;

class JobTrackerDashboardController extends Controller
{
    private const SUMMARY_LIMIT = 5;

    /**
     * Get the Job Tracker dashboard.
     *
     * Returns account-scoped status totals, the five most recent applications and the next five pending interviews.
     */
    public function __invoke(Request $request): JobTrackerDashboardResource
    {
        /** @var AuthUser $authUser */
        $authUser = $request->user();

        $storedCounts = JobApplication::query()
            ->ownedBy($authUser)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $applicationsByStatus = collect(JobApplicationStatus::cases())
            ->mapWithKeys(fn (JobApplicationStatus $status) => [
                $status->value => (int) $storedCounts->get($status->value, 0),
            ])
            ->all();

        $recentApplications = JobApplication::query()
            ->with('company:id,name')
            ->ownedBy($authUser)
            ->latest('created_at')
            ->latest('id')
            ->limit(self::SUMMARY_LIMIT)
            ->get();

        $upcomingInterviews = Interview::query()
            ->with([
                'jobApplication:id,company_id,position',
                'jobApplication.company:id,name',
            ])
            ->ownedBy($authUser)
            ->whereNull('outcome')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->limit(self::SUMMARY_LIMIT)
            ->get();

        return new JobTrackerDashboardResource([
            'total_applications' => array_sum($applicationsByStatus),
            'applications_by_status' => $applicationsByStatus,
            'recent_applications' => $recentApplications,
            'upcoming_interviews' => $upcomingInterviews,
        ]);
    }
}
