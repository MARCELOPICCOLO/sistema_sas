<?php

namespace App\Http\Middleware;

use App\Services\CurrentCompany;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Garante que o usuário autenticado está ativo e vinculado
 * a uma empresa ativa antes de acessar dados da empresa.
 */
class EnsureCompanyAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('api');

        if (!$user || !$user->active) {
            return response()->json([
                'message' => 'Usuário inativo.',
            ], 403);
        }

        if (!CurrentCompany::id()) {
            return response()->json([
                'message' => 'Usuário não está vinculado a uma empresa ativa.',
            ], 403);
        }

        return $next($request);
    }
}
