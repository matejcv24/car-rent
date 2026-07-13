<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InviteUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_admin === true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'email',
                'max:100',
                Rule::unique('users', 'email'),
                Rule::unique('user_invitations', 'email'),
            ],
        ];
    }
}
