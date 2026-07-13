<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_date' => ['required', 'date'],
            'current_mileage' => ['required', 'integer', 'min:0'],
            'next_service_date' => ['required', 'date', 'after:service_date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
