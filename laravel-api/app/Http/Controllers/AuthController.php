<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\AuthUserResource;
use App\Http\Responses\ApiErrorResponse;
use App\Models\AuthUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Log in.
     *
     * Validates the demo account credentials and starts a stateful Sanctum session.
     */
    public function login(LoginRequest $request): AuthUserResource|JsonResponse
    {
        if (! Auth::guard('web')->attempt($request->validated())) {
            return ApiErrorResponse::make(
                $request,
                Response::HTTP_UNAUTHORIZED,
                'UNAUTHORIZED',
                'Invalid credentials',
            );
        }

        $request->session()->regenerate();

        /** @var AuthUser $user */
        $user = Auth::guard('web')->user();

        return new AuthUserResource($user);
    }

    /**
     * Log out.
     *
     * Ends the current session and rotates its CSRF token.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['loggedOut' => true]);
    }

    /**
     * Get the authenticated account.
     */
    public function me(Request $request): AuthUserResource
    {
        /** @var AuthUser $user */
        $user = $request->user();

        return new AuthUserResource($user);
    }
}
