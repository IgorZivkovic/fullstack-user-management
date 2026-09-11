<?php

namespace App\Http\Requests;

use App\Enums\Gender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'birthday' => ['required', 'date_format:Y-m-d'],
            'gender' => ['required', Rule::enum(Gender::class)],
            'country' => ['required', 'string', 'max:120'],
        ];
    }
}
