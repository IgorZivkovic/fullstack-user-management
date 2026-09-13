<?php

namespace App\Http\Requests;

class UpdateJobApplicationRequest extends JobApplicationRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->jobApplicationRules(creating: false);
    }
}
