<?php

namespace App\Http\Requests;

use App\Enums\JobApplicationStatus;
use App\Enums\WorkMode;
use App\Models\JobApplication;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

abstract class JobApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    protected function jobApplicationRules(bool $creating): array
    {
        $required = $creating ? ['required'] : ['sometimes', 'required'];
        $optional = $creating ? [] : ['sometimes'];

        return [
            'company_id' => [
                ...$required,
                'integer',
                Rule::exists('companies', 'id')->where(
                    fn (Builder $query) => $query->where(
                        'auth_user_id',
                        $this->user()->getAuthIdentifier(),
                    ),
                ),
            ],
            'position' => [...$required, 'string', 'max:160'],
            'status' => [...$required, Rule::enum(JobApplicationStatus::class)],
            'work_mode' => [...$required, Rule::enum(WorkMode::class)],
            'employment_type' => [...$optional, 'nullable', 'string', 'max:80'],
            'source_url' => [...$optional, 'nullable', 'url:http,https', 'max:2048'],
            'applied_at' => [...$optional, 'nullable', 'date_format:Y-m-d'],
            'next_action_at' => [...$optional, 'nullable', 'date'],
            'salary_min' => [...$optional, 'nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
            'salary_max' => [...$optional, 'nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
            'currency' => [...$optional, 'nullable', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
            'notes' => [...$optional, 'nullable', 'string', 'max:10000'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $application = $this->route('job_application');
            $existing = $application instanceof JobApplication ? $application : null;

            $salaryMin = $this->exists('salary_min')
                ? $this->input('salary_min')
                : $existing?->salary_min;
            $salaryMax = $this->exists('salary_max')
                ? $this->input('salary_max')
                : $existing?->salary_max;
            $currency = $this->exists('currency')
                ? $this->input('currency')
                : $existing?->currency;

            if (is_numeric($salaryMin) && is_numeric($salaryMax) && (float) $salaryMax < (float) $salaryMin) {
                $validator->errors()->add(
                    'salary_max',
                    'The salary max field must be greater than or equal to salary min.',
                );
            }

            if (($salaryMin !== null || $salaryMax !== null) && blank($currency)) {
                $validator->errors()->add(
                    'currency',
                    'The currency field is required when a salary value is provided.',
                );
            }
        }];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('currency'))) {
            $this->merge(['currency' => strtoupper(trim($this->input('currency')))]);
        }
    }
}
