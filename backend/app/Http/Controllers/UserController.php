<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Lista os usuários da empresa atual,
     * exceto o usuário autenticado.
     */

    public function index()
    {
        $usuarioAutenticado = Auth::guard('api')->user();

        if (!$usuarioAutenticado) {
            return response()->json([
                'message' => 'Usuário não autenticado.'
            ], 401);
        }

        $partnerCompanyId = CurrentCompany::id();

        if (!$partnerCompanyId) {
            return response()->json([
                'message' => 'Usuário não está vinculado a uma empresa ativa.'
            ], 422);
        }

        $usuarios = User::where('users.id', '!=', $usuarioAutenticado->id)
            ->whereHas('partnerCompanies', function ($query) use ($partnerCompanyId) {
                $query->where('partner_companies.id', $partnerCompanyId);
            })
            ->with([
                'partnerCompanies' => function ($query) use ($partnerCompanyId) {
                    $query
                        ->where('partner_companies.id', $partnerCompanyId)
                        ->withPivot('role', 'active');
                },

                // Carrega as telas que o usuário possui
                'telas:id,nome,slug,descricao,ativo',
            ])
            ->orderBy('full_name', 'asc')
            ->get()
            ->map(function ($usuario) {

                $empresa = $usuario->partnerCompanies->first();

                return [
                    'id' => $usuario->id,
                    'full_name' => $usuario->full_name,
                    'username' => $usuario->username,
                    'email' => $usuario->email,
                    'contact' => $usuario->contact,
                    'active' => $empresa?->pivot?->active ?? false,
                    'role' => $empresa?->pivot?->role,
                    'created_at' => $usuario->created_at,

                    // IDs das telas que o usuário possui
                    'tela_ids' => $usuario->telas
                        ->pluck('id')
                        ->values()
                        ->toArray(),

                    // Dados completos das telas
                    'telas' => $usuario->telas
                        ->values()
                        ->toArray(),
                ];
            });

        return response()->json($usuarios);
    }



    /**
     * Cadastra um novo usuário.
     */
    public function store(Request $request)
    {
        $usuarioAutenticado = Auth::guard('api')->user();

        if (!$usuarioAutenticado) {
            return response()->json([
                'message' => 'Usuário não autenticado.'
            ], 401);
        }

        $partnerCompanyId = CurrentCompany::id();

        if (!$partnerCompanyId) {
            return response()->json([
                'message' => 'Usuário não está vinculado a uma empresa ativa.'
            ], 422);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'username'  => 'required|string|max:255|unique:users,username',
            'email'     => 'required|email|max:255|unique:users,email',
            'contact'   => 'nullable|string|max:20',
            'password'  => 'required|string|min:6',
            'role'      => 'required|in:ADMIN,USER',

            // IDs das telas que o usuário terá acesso
            'telas'     => 'nullable|array',
            'telas.*'   => 'integer|exists:telas,id',
        ]);

        try {
            $novoUsuario = DB::transaction(function () use (
                $validated,
                $partnerCompanyId
            ) {
                // Cria o usuário
                $novoUsuario = User::create([
                    'full_name' => $validated['full_name'],
                    'username'  => $validated['username'],
                    'email'     => $validated['email'],
                    'contact'   => $validated['contact'] ?? null,
                    'password'  => Hash::make($validated['password']),
                    'active'    => true,
                    'is_master' => false,
                ]);

                // Vincula o usuário à empresa
                $novoUsuario->partnerCompanies()->attach(
                    $partnerCompanyId,
                    [
                        'role'   => $validated['role'],
                        'active' => true,
                    ]
                );

                // Vincula as telas ao usuário
                if (!empty($validated['telas'])) {
                    $novoUsuario->telas()->sync($validated['telas']);
                }

                return $novoUsuario;
            });

            // Carrega as telas vinculadas para retornar ao frontend
            $novoUsuario->load('telas');

            return response()->json([
                'message' => 'Usuário cadastrado com sucesso.',
                'user' => $novoUsuario,
                'tela_ids' => $novoUsuario->telas->pluck('id')->values(),
            ], 201);
        } catch (\Throwable $e) {

            \Log::error('Erro ao cadastrar usuário.', [
                'message' => $e->getMessage(),
                'user_id' => $usuarioAutenticado->id ?? null,
                'partner_company_id' => $partnerCompanyId,
            ]);

            return response()->json([
                'message' => 'Não foi possível cadastrar o usuário.'
            ], 500);
        }
    }
    /**
     * Exibe um usuário da empresa atual.
     */
    public function show(int $id)
    {
        $usuarioAutenticado = Auth::guard('api')->user();

        if (!$usuarioAutenticado) {
            return response()->json([
                'message' => 'Usuário não autenticado.'
            ], 401);
        }

        $partnerCompanyId = CurrentCompany::id();

        if (!$partnerCompanyId) {
            return response()->json([
                'message' => 'Usuário não está vinculado a uma empresa ativa.'
            ], 422);
        }

        $usuario = User::where('id', $id)
            ->whereHas('partnerCompanies', function ($query) use ($partnerCompanyId) {
                $query->where('partner_companies.id', $partnerCompanyId);
            })
            ->with([
                'partnerCompanies' => function ($query) use ($partnerCompanyId) {
                    $query
                        ->where('partner_companies.id', $partnerCompanyId)
                        ->withPivot('role', 'active');
                }
            ])
            ->first();

        if (!$usuario) {
            return response()->json([
                'message' => 'Usuário não encontrado na empresa atual.'
            ], 404);
        }

        $empresa = $usuario->partnerCompanies->first();

        return response()->json([
            'id' => $usuario->id,
            'full_name' => $usuario->full_name,
            'username' => $usuario->username,
            'email' => $usuario->email,
            'contact' => $usuario->contact,
            'active' => $empresa?->pivot?->active ?? false,
            'role' => $empresa?->pivot?->role,
            'created_at' => $usuario->created_at,
        ]);
    }


    /**
     * Atualiza um usuário da empresa atual.
     */
    public function update(Request $request, int $id)
    {
        $usuarioAutenticado = Auth::guard('api')->user();

        if (!$usuarioAutenticado) {
            return response()->json([
                'message' => 'Usuário não autenticado.'
            ], 401);
        }

        $partnerCompanyId = CurrentCompany::id();

        if (!$partnerCompanyId) {
            return response()->json([
                'message' => 'Usuário não está vinculado a uma empresa ativa.'
            ], 422);
        }

        /*
     * Primeiro verificamos se o usuário pertence
     * à empresa atual.
     */
        $usuario = User::where('id', $id)
            ->whereHas('partnerCompanies', function ($query) use ($partnerCompanyId) {
                $query->where('partner_companies.id', $partnerCompanyId);
            })
            ->first();

        if (!$usuario) {
            return response()->json([
                'message' => 'Usuário não encontrado na empresa atual.'
            ], 404);
        }

        /*
     * Validação dos dados recebidos.
     *
     * O campo "telas" é um array contendo os IDs
     * das telas que o usuário deverá possuir.
     */
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',

            'username' => [
                'required',
                'string',
                'max:255',
                'unique:users,username,' . $usuario->id,
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email,' . $usuario->id,
            ],

            'contact' => 'nullable|string|max:20',

            'password' => 'nullable|string|min:6',

            'role' => 'required|in:ADMIN,USER',

            /*
         * Permissões de telas.
         *
         * Exemplo:
         *
         * "telas": [1, 2, 5, 8]
         */
            'telas' => 'nullable|array',

            'telas.*' => [
                'integer',
                'exists:telas,id',
            ],
        ]);

        try {

            $usuarioAtualizado = DB::transaction(function () use (
                $usuario,
                $validated,
                $partnerCompanyId
            ) {

                /*
             * =====================================================
             * 1. ATUALIZA DADOS DO USUÁRIO
             * =====================================================
             *
             * Campos pertencentes à tabela users.
             */
                $dadosUsuario = [
                    'full_name' => $validated['full_name'],
                    'username'  => $validated['username'],
                    'email'     => $validated['email'],
                    'contact'   => $validated['contact'] ?? null,
                ];

                /*
             * A senha somente é alterada se
             * uma nova senha for informada.
             */
                if (!empty($validated['password'])) {
                    $dadosUsuario['password'] = Hash::make(
                        $validated['password']
                    );
                }

                $usuario->update($dadosUsuario);


                /*
             * =====================================================
             * 2. ATUALIZA ROLE DA EMPRESA
             * =====================================================
             *
             * A role pertence ao relacionamento
             * partner_company_users.
             *
             * Atualizamos somente o vínculo
             * com a empresa atual.
             */
                $usuario->partnerCompanies()->updateExistingPivot(
                    $partnerCompanyId,
                    [
                        'role' => $validated['role'],
                    ]
                );


                /*
             * =====================================================
             * 3. ATUALIZA PERMISSÕES DAS TELAS
             * =====================================================
             *
             * O relacionamento User -> Tela utiliza a tabela:
             *
             * usuario_telas
             *
             * O sync() faz exatamente o que precisamos:
             *
             * - adiciona as novas telas;
             * - mantém as que continuam selecionadas;
             * - remove as que foram desligadas.
             *
             * Exemplo:
             *
             * Banco atualmente:
             * [1, 2, 3, 4]
             *
             * Frontend envia:
             * [1, 3, 5]
             *
             * Resultado:
             * [1, 3, 5]
             *
             * A tela 2 e 4 são removidas,
             * e a tela 5 é adicionada.
             */
                $telasIds = $validated['telas'] ?? [];

                $usuario->telas()->sync($telasIds);


                /*
             * =====================================================
             * 4. RECARREGA RELACIONAMENTOS
             * =====================================================
             *
             * Recarregamos:
             *
             * - empresa atual;
             * - telas do usuário.
             */
                $usuario->load([
                    'partnerCompanies' => function ($query) use ($partnerCompanyId) {
                        $query
                            ->where('partner_companies.id', $partnerCompanyId)
                            ->withPivot('role', 'active');
                    },

                    'telas:id,nome,slug,descricao,ativo',
                ]);

                return $usuario;
            });


            /*
         * Empresa atual do usuário.
         */
            $empresa = $usuarioAtualizado->partnerCompanies->first();


            /*
         * IDs das telas vinculadas ao usuário.
         */
            $telaIds = $usuarioAtualizado->telas
                ->pluck('id')
                ->values()
                ->toArray();


            /*
         * =====================================================
         * RESPOSTA
         * =====================================================
         */
            return response()->json([
                'message' => 'Usuário atualizado com sucesso.',

                'user' => [
                    'id' => $usuarioAtualizado->id,
                    'full_name' => $usuarioAtualizado->full_name,
                    'username' => $usuarioAtualizado->username,
                    'email' => $usuarioAtualizado->email,
                    'contact' => $usuarioAtualizado->contact,

                    'active' => $empresa?->pivot?->active ?? false,

                    'role' => $empresa?->pivot?->role,

                    'created_at' => $usuarioAtualizado->created_at,

                    /*
                 * Retornamos os IDs das telas para o frontend.
                 */
                    'tela_ids' => $telaIds,
                ],

                /*
             * Também retornamos diretamente os IDs.
             *
             * Isso facilita o debug e o frontend,
             * caso seja necessário.
             */
                'tela_ids' => $telaIds,
            ], 200);
        } catch (\Throwable $e) {

            \Log::error('Erro ao atualizar usuário.', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),

                'user_id' => $usuarioAutenticado->id ?? null,

                'updated_user_id' => $id,

                'partner_company_id' => $partnerCompanyId,

                /*
             * Ajuda a descobrir exatamente quais
             * permissões estavam sendo enviadas.
             */
                'telas' => $validated['telas'] ?? [],
            ]);

            return response()->json([
                'message' => 'Não foi possível atualizar o usuário.'
            ], 500);
        }
    }


    /**
     * Remove um usuário da empresa atual.
     */
    public function destroy(int $id)
    {
        $usuarioAutenticado = Auth::guard('api')->user();

        if (!$usuarioAutenticado) {
            return response()->json([
                'message' => 'Usuário não autenticado.'
            ], 401);
        }

        $partnerCompanyId = CurrentCompany::id();

        if (!$partnerCompanyId) {
            return response()->json([
                'message' => 'Usuário não está vinculado a uma empresa ativa.'
            ], 422);
        }

        $usuario = User::where('id', $id)
            ->whereHas('partnerCompanies', function ($query) use ($partnerCompanyId) {
                $query->where('partner_companies.id', $partnerCompanyId);
            })
            ->first();

        if (!$usuario) {
            return response()->json([
                'message' => 'Usuário não encontrado na empresa atual.'
            ], 404);
        }

        try {

            DB::transaction(function () use (
                $usuario,
                $partnerCompanyId
            ) {
                $usuario->partnerCompanies()->detach($partnerCompanyId);
            });

            return response()->json([
                'message' => 'Usuário removido da empresa com sucesso.'
            ]);
        } catch (\Throwable $e) {

            \Log::error('Erro ao remover usuário.', [
                'message' => $e->getMessage(),
                'user_id' => $usuarioAutenticado->id ?? null,
                'deleted_user_id' => $id,
                'partner_company_id' => $partnerCompanyId,
            ]);

            return response()->json([
                'message' => 'Não foi possível remover o usuário.'
            ], 500);
        }
    }
}
