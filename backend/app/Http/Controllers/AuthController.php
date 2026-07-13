<?php

namespace App\Http\Controllers;

use App\Actions\Auth\AcceptInvitation;
use App\Actions\Auth\InviteUser;
use App\Http\Requests\AcceptInvitationRequest;
use App\Http\Requests\InviteUserRequest;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $expiresAt = now()->addMinutes(config('sanctum.expiration'));
        $token = $user->createToken('fleettrack-api', ['*'], $expiresAt);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ]);
    }

    public function invite(InviteUserRequest $request, InviteUser $action): JsonResponse
    {
        $invitation = $action->handle($request->validated('email'));

        return response()->json([
            'success' => true,
            'message' => 'Invitation sent successfully.',
            'data' => [
                'email' => $invitation->email,
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
        ], 201);
    }

    public function accept(AcceptInvitationRequest $request, AcceptInvitation $action): JsonResponse
    {
        $user = $action->handle(
            $request->validated('token'),
            $request->validated('password'),
        );
        $expiresAt = now()->addMinutes(config('sanctum.expiration'));
        $token = $user->createToken('fleettrack-api', ['*'], $expiresAt);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['user' => $request->user()],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
