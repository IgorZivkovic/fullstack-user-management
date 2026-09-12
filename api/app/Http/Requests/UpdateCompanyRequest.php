<?php

namespace App\Http\Requests;

use App\Models\Company;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $company = $this->route('company');
        $uniqueName = Rule::unique('companies', 'name')->where(
            fn (Builder $query) => $query->where('auth_user_id', $this->user()->getAuthIdentifier()),
        );

        if ($company instanceof Company) {
            $uniqueName->ignore($company->getKey());
        }

        return [
            'name' => ['sometimes', 'required', 'string', 'max:160', $uniqueName],
            'website' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'location' => ['sometimes', 'nullable', 'string', 'max:160'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
