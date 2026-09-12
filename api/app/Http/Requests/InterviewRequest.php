<?php

namespace App\Http\Requests;

use App\Enums\InterviewOutcome;
use App\Enums\InterviewType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class InterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    protected function interviewRules(bool $creating): array
    {
        $required = $creating ? ['required'] : ['sometimes', 'required'];
        $optional = $creating ? [] : ['sometimes'];

        return [
            'type' => [...$required, Rule::enum(InterviewType::class)],
            'scheduled_at' => [...$required, 'date'],
            'contact_name' => [...$optional, 'nullable', 'string', 'max:160'],
            'contact_email' => [...$optional, 'nullable', 'email:rfc', 'max:160'],
            'location_or_link' => [...$optional, 'nullable', 'string', 'max:2048'],
            'notes' => [...$optional, 'nullable', 'string', 'max:10000'],
            'outcome' => [...$optional, 'nullable', Rule::enum(InterviewOutcome::class)],
        ];
    }
}
