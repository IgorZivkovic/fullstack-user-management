<?php

namespace App\Http\Requests;

class StoreJobApplicationRequest extends JobApplicationRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->jobApplicationRules(creating: true);
    }
}
