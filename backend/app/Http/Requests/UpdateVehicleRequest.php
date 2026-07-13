<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'license_plate' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('vehicles', 'license_plate')->ignore($this->route('vehicle')),
            ],
            'model' => ['sometimes', 'required', 'string', 'max:100'],
            'type' => ['sometimes', 'required', Rule::in(['car', 'van'])],
            'status' => ['sometimes', 'required', Rule::in(['active', 'maintenance', 'retired'])],
        ];
    }
}
