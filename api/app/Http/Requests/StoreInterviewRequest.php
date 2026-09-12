<?php

namespace App\Http\Requests;

class StoreInterviewRequest extends InterviewRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->interviewRules(creating: true);
    }
}
