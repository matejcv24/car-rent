<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'registration_number' => ['required', 'string', 'max:50'],
            'start_date' => ['required', 'date'],
            'expiry_date' => ['required', 'date', 'after:start_date'],
        ];
    }
}
