<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe a rota a usuários master (administração da plataforma).
 */
class EnsureMaster
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('api');

        if (!$user || !$user->active || !$user->is_master) {
            return response()->json([
                'message' => 'Você não tem permissão para acessar este recurso.',
            ], 403);
        }

        return $next($request);
    }
}
