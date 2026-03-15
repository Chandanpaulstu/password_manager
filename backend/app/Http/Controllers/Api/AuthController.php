<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'email'         => 'required|email|unique:users',
            'password'      => 'required|min:12|confirmed',
            'password_hint' => 'nullable|string|max:200',
        ]);

        $user = User::create([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password'      => $data['password'], // auto-hashed via cast
            'password_hint' => $data['password_hint'] ?? null,
            'kdf_salt'      => bin2hex(random_bytes(32)), // 64-char hex salt
        ]);

        return response()->json([
            'message' => 'Account created successfully.'
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $data['email'])->first();

        // Account lockout check
        if ($user && $user->locked_until && Carbon::now()->lt($user->locked_until)) {
            return response()->json([
                'message' => 'Account locked. Try again after ' . $user->locked_until->diffForHumans()
            ], 429);
        }

        if (!$user || !Hash::check($data['password'], $user->password)) {
            if ($user) {
                $user->increment('failed_attempts');
                if ($user->failed_attempts >= 5) {
                    $user->update(['locked_until' => Carbon::now()->addMinutes(15)]);
                }
            }
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.']
            ]);
        }

        // Reset on success
        $user->update([
            'failed_attempts' => 0,
            'locked_until'    => null,
            'last_login_at'   => Carbon::now(),
        ]);

        $token = $user->createToken('vault-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->only('id','name','email','last_login_at'));
    }

    public function kdfSalt(Request $request)
    {
        // Frontend needs this to derive AES key via PBKDF2
        return response()->json([
            'kdf_salt' => $request->user()->kdf_salt
        ]);
    }
}
