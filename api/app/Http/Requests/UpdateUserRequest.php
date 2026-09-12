<?php

namespace App\Http\Requests;

use App\Enums\Gender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'birthday' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'gender' => ['sometimes', 'required', Rule::enum(Gender::class)],
            'country' => ['sometimes', 'required', 'string', 'max:120'],
        ];
    }
}
