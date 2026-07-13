<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'required', Rule::in(['pending', 'active', 'completed', 'cancelled'])],
            'payment_status' => ['sometimes', 'required', Rule::in(['paid', 'unpaid'])],
        ];
    }
}
