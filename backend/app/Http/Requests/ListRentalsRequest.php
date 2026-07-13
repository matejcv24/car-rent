<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListRentalsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'limit' => ['sometimes', 'integer', 'between:1,100'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'completed', 'cancelled'])],
            'payment_status' => ['sometimes', Rule::in(['paid', 'unpaid'])],
            'vehicle_id' => ['sometimes', 'integer', 'exists:vehicles,id'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
            'search' => ['sometimes', 'string', 'max:100'],
        ];
    }
}
