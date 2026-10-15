<?php

namespace App\Http\Controllers;

use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Realiza o login e retorna um JWT.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string|max:255',
            'password' => 'required|string|max:255',
        ]);

        $guard = Auth::guard('api');

        if (!$token = $guard->attempt($credentials)) {
            return response()->json([
                'message' => 'Usuário ou senha inválidos.'
            ], 401);
        }

        $user = $guard->user();

        // Usuário desativado ou sem vínculo ativo com nenhuma empresa não entra.
        if (!$user->active || (!CurrentCompany::id() && !$user->is_master)) {
            $guard->logout();

            return response()->json([
                'message' => 'Usuário inativo ou sem empresa ativa. Contate o administrador.'
            ], 403);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Retorna o usuário autenticado, a empresa ativa e as telas liberadas.
     */
    public function me()
    {
        $user = Auth::guard('api')->user();

        $telas = $user->allowedTelas();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'username' => $user->username,
                'email' => $user->email,
                'contact' => $user->contact,
                'active' => $user->active,
                'is_master' => $user->is_master,
                'role' => CurrentCompany::role(),
            ],
            'company_id' => CurrentCompany::id(),
            'company' => CurrentCompany::company()?->only(['id', 'corporate_name', 'trade_name']),
            'tela_ids' => $telas->pluck('id')->values(),
            'telas' => $telas,
        ]);
    }

    /**
     * Renova o token.
     */
    public function refresh()
    {
        return $this->respondWithToken(
            Auth::guard('api')->refresh()
        );
    }

    /**
     * Efetua logout (invalida o token atual).
     */
    public function logout()
    {
        Auth::guard('api')->logout();

        return response()->json([
            'message' => 'Logout realizado com sucesso.'
        ]);
    }

    protected function respondWithToken(string $token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'expires_in'   => Auth::guard('api')->factory()->getTTL() * 60,
        ]);
    }
}
