<?php

namespace App\Http\Requests;

class UpdateInterviewRequest extends InterviewRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->interviewRules(creating: false);
    }
}
