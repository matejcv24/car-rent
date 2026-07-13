<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserInvitation;
use App\Notifications\UserInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthenticationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_log_in_and_access_the_authenticated_profile(): void
    {
        $user = User::factory()->create([
            'password' => 'secret-password',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret-password',
            'remember_me' => true,
        ]);

        $login->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonStructure(['data' => ['token', 'expires_at']]);

        $this->withToken($login->json('data.token'))
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', $user->email);
    }

    public function test_invalid_login_uses_the_standard_validation_envelope(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'correct-password',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable()
            ->assertExactJson([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => [
                    'email' => ['The provided credentials are incorrect.'],
                ],
            ]);
    }

    public function test_only_an_admin_can_send_an_invitation(): void
    {
        Notification::fake();

        $member = User::factory()->create();
        $this->actingAs($member, 'sanctum')
            ->postJson('/api/v1/auth/invite', ['email' => 'invitee@example.com'])
            ->assertForbidden();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/auth/invite', ['email' => 'invitee@example.com'])
            ->assertCreated()
            ->assertJsonPath('data.email', 'invitee@example.com');

        $invitation = UserInvitation::where('email', 'invitee@example.com')->firstOrFail();
        $this->assertSame(64, strlen($invitation->getRawOriginal('token')));
        Notification::assertSentOnDemand(UserInvitationNotification::class);
    }

    public function test_invited_user_can_accept_the_invitation_once(): void
    {
        $rawToken = str_repeat('a', 64);
        UserInvitation::create([
            'email' => 'invitee@example.com',
            'token' => hash('sha256', $rawToken),
            'expires_at' => now()->addHour(),
        ]);

        $response = $this->postJson('/api/v1/auth/accept', [
            'token' => $rawToken,
            'password' => 'new-password',
            'password_conf' => 'new-password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'invitee@example.com')
            ->assertJsonStructure(['data' => ['token']]);

        $user = User::where('email', 'invitee@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('new-password', $user->password));
        $this->assertDatabaseMissing('user_invitations', ['email' => 'invitee@example.com']);

        $this->postJson('/api/v1/auth/accept', [
            'token' => $rawToken,
            'password' => 'new-password',
            'password_conf' => 'new-password',
        ])->assertUnprocessable();
    }
}
