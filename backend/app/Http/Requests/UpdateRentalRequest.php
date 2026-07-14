<?php

namespace App\Http\Requests;

use Illuminate\Database\Query\Builder;
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
            'vehicle_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('vehicles', 'id')->where(
                    fn (Builder $query) => $query->where('status', 'active'),
                ),
            ],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date', 'after:start_date'],
            'status' => ['sometimes', 'required', Rule::in(['pending', 'active', 'completed', 'cancelled'])],
            'payment_status' => ['sometimes', 'required', Rule::in(['paid', 'unpaid'])],
            'total_price' => ['sometimes', 'required', 'numeric', 'min:0', 'decimal:0,2'],
            'renter' => ['sometimes', 'required', 'array'],
            'renter.first_name' => ['nullable'],
            'renter.last_name' => ['nullable'],
            'renter.phone' => ['nullable'],
            'renter.email' => ['nullable'],
        ];
    }
}
