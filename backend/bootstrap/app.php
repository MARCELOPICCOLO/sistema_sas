<?php

use App\Http\Middleware\EnsureCompanyAccess;
use App\Http\Middleware\EnsureMaster;
use App\Http\Middleware\EnsureTelaAccess;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(SecurityHeaders::class);

        $middleware->alias([
            'company' => EnsureCompanyAccess::class,
            'tela' => EnsureTelaAccess::class,
            'master' => EnsureMaster::class,
        ]);

        // API sem sessão: nunca redirecionar para uma rota de login inexistente.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json(['message' => 'Não autenticado.'], 401);
        });

        // Falha ao conectar no banco. No Windows a mensagem do driver vem em
        // Windows-1252 e quebraria o JSON ("Malformed UTF-8 characters").
        $exceptions->render(function (QueryException $e, Request $request) {
            if (! $e->getPrevious() instanceof PDOException || ! in_array($e->getPrevious()->getCode(), [2002, 1045, 1049], false)) {
                return null;
            }

            $detalhe = mb_check_encoding($e->getMessage(), 'UTF-8')
                ? $e->getMessage()
                : mb_convert_encoding($e->getMessage(), 'UTF-8', 'Windows-1252');

            return response()->json(array_filter([
                'message' => 'Não foi possível conectar ao banco de dados.',
                'detail' => config('app.debug') ? $detalhe : null,
            ]), 503);
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') && $e->getPrevious() instanceof ModelNotFoundException) {
                return response()->json(['message' => 'Registro não encontrado.'], 404);
            }
        });
    })->create();
