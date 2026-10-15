<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe a rota às telas (módulos) liberadas para o usuário.
 *
 * Uso: ->middleware('tela:produtos,vendas') — basta ter acesso a uma delas.
 */
class EnsureTelaAccess
{
    public function handle(Request $request, Closure $next, string ...$slugs): Response
    {
        $user = $request->user('api');

        $permitidas = $user ? $user->allowedTelaSlugs() : [];

        if (!array_intersect($slugs, $permitidas)) {
            return response()->json([
                'message' => 'Você não tem permissão para acessar este recurso.',
            ], 403);
        }

        return $next($request);
    }
}
