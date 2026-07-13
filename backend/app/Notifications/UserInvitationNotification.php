<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url'), '/')
            .'/accept-invitation?token='.urlencode($this->token);

        return (new MailMessage)
            ->subject('Your FleetTrack invitation')
            ->line('You have been invited to FleetTrack.')
            ->action('Set up your account', $url)
            ->line('This invitation expires in 24 hours.');
    }
}
