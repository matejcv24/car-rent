<?php

namespace App\Actions\Auth;

use App\Models\UserInvitation;
use App\Notifications\UserInvitationNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class InviteUser
{
    public function handle(string $email): UserInvitation
    {
        $rawToken = Str::random(64);

        $invitation = UserInvitation::create([
            'email' => $email,
            'token' => hash('sha256', $rawToken),
            'expires_at' => now()->addHours(24),
        ]);

        Notification::route('mail', $email)
            ->notify(new UserInvitationNotification($rawToken));

        return $invitation;
    }
}
