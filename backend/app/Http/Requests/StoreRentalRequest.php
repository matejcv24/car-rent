<?php

namespace App\Http\Requests;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => [
                'required',
                'integer',
                Rule::exists('vehicles', 'id')->where(
                    fn (Builder $query) => $query->where('status', 'active'),
                ),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'completed', 'cancelled'])],
            'payment_status' => ['sometimes', Rule::in(['paid', 'unpaid'])],
            'total_price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'renter' => ['required', 'array'],
            'renter.first_name' => ['nullable'],
            'renter.last_name' => ['nullable'],
            'renter.phone' => ['nullable'],
            'renter.email' => ['nullable'],
        ];
    }
}
