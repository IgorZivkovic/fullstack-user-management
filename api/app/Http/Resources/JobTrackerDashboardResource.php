<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobTrackerDashboardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'total_applications' => $this->resource['total_applications'],
            'applications_by_status' => $this->resource['applications_by_status'],
            'recent_applications' => JobApplicationResource::collection(
                $this->resource['recent_applications'],
            ),
            'upcoming_interviews' => InterviewResource::collection(
                $this->resource['upcoming_interviews'],
            ),
        ];
    }
}
