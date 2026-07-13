<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'license_plate' => ['required', 'string', 'max:20', 'unique:vehicles,license_plate'],
            'model' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::in(['car', 'van'])],
            'status' => ['sometimes', Rule::in(['active', 'maintenance', 'retired'])],
            'registration' => ['sometimes', 'array'],
            'registration.registration_number' => ['required_with:registration', 'string', 'max:50'],
            'registration.start_date' => ['required_with:registration', 'date'],
            'registration.expiry_date' => ['required_with:registration', 'date', 'after:registration.start_date'],
            'service' => ['sometimes', 'array'],
            'service.service_date' => ['required_with:service', 'date'],
            'service.current_mileage' => ['required_with:service', 'integer', 'min:0'],
            'service.next_service_date' => ['required_with:service', 'date', 'after:service.service_date'],
            'service.notes' => ['nullable', 'string'],
        ];
    }
}
