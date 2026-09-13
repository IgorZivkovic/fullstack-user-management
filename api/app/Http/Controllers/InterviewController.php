<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInterviewRequest;
use App\Http\Requests\UpdateInterviewRequest;
use App\Http\Resources\InterviewResource;
use App\Models\Interview;
use App\Models\JobApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class InterviewController extends Controller
{
    /**
     * List interviews for an owned job application.
     *
     * Results are sorted chronologically by scheduled time.
     */
    public function index(JobApplication $jobApplication): AnonymousResourceCollection
    {
        $interviews = $jobApplication->interviews()
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->get();

        return InterviewResource::collection($interviews);
    }

    /**
     * Schedule an interview.
     *
     * The parent job application must belong to the authenticated account.
     */
    public function store(
        StoreInterviewRequest $request,
        JobApplication $jobApplication,
    ): JsonResponse {
        $interview = $jobApplication->interviews()->create($request->validated());

        return (new InterviewResource($interview))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Update an interview.
     *
     * The interview must belong to both the authenticated account and the application in the URL.
     */
    public function update(
        UpdateInterviewRequest $request,
        JobApplication $jobApplication,
        Interview $interview,
    ): InterviewResource {
        $interview->update($request->validated());

        return new InterviewResource($interview->refresh());
    }

    /**
     * Delete an interview.
     *
     * The interview must belong to the application in the URL.
     */
    public function destroy(
        JobApplication $jobApplication,
        Interview $interview,
    ): JsonResponse {
        $interview->delete();

        return response()->json(['deleted' => true]);
    }
}
