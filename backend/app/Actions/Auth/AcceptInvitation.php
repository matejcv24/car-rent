<?php

namespace App\Actions\Auth;

use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AcceptInvitation
{
    public function handle(string $rawToken, string $password): User
    {
        return DB::transaction(function () use ($rawToken, $password): User {
            $invitation = UserInvitation::query()
                ->where('token', hash('sha256', $rawToken))
                ->lockForUpdate()
                ->first();

            if (! $invitation || $invitation->expires_at->isPast()) {
                throw ValidationException::withMessages([
                    'token' => ['This invitation is invalid or has expired.'],
                ]);
            }

            $user = User::create([
                'email' => $invitation->email,
                'password' => $password,
            ]);

            $invitation->delete();

            return $user;
        });
    }
}
