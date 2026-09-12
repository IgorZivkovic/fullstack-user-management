<?php

namespace App\Http\Requests;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyRequest extends FormRequest
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
        return [
            'name' => [
                'required',
                'string',
                'max:160',
                Rule::unique('companies', 'name')->where(
                    fn (Builder $query) => $query->where('auth_user_id', $this->user()->getAuthIdentifier()),
                ),
            ],
            'website' => ['nullable', 'url:http,https', 'max:2048'],
            'location' => ['nullable', 'string', 'max:160'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
