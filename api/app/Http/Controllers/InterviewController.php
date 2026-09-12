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
    public function index(JobApplication $jobApplication): AnonymousResourceCollection
    {
        $interviews = $jobApplication->interviews()
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->get();

        return InterviewResource::collection($interviews);
    }

    public function store(
        StoreInterviewRequest $request,
        JobApplication $jobApplication,
    ): JsonResponse {
        $interview = $jobApplication->interviews()->create($request->validated());

        return (new InterviewResource($interview))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(
        UpdateInterviewRequest $request,
        JobApplication $jobApplication,
        Interview $interview,
    ): InterviewResource {
        $interview->update($request->validated());

        return new InterviewResource($interview->refresh());
    }

    public function destroy(
        JobApplication $jobApplication,
        Interview $interview,
    ): JsonResponse {
        $interview->delete();

        return response()->json(['deleted' => true]);
    }
}
