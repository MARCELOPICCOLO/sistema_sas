<?php

namespace App\Http\Controllers;

use App\Models\PartnerCompanyUser;
use App\Models\User;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PartnerCompanyUserController extends Controller
{
    /**
     * Lista todos os vínculos.
     */
    public function index()
    {
        return response()->json(PartnerCompanyUser::all());
    }

    /**
     * Cria um novo vínculo.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_company_id' => 'required|exists:partner_companies,id',
            'user_id'            => 'required|exists:users,id',
            'role'               => 'required|in:MASTER,ADMIN,USER',
            'active'             => 'boolean',
        ]);

        $partnerCompanyUser = PartnerCompanyUser::create($validated);

        return response()->json($partnerCompanyUser, 201);
    }

    /**
     * Exibe um vínculo.
     */
    public function show(int $id)
    {
        $partnerCompanyUser = PartnerCompanyUser::findOrFail($id);

        return response()->json($partnerCompanyUser);
    }

    /**
     * Atualiza um vínculo.
     */
    public function update(Request $request, int $id)
    {
        $partnerCompanyUser = PartnerCompanyUser::findOrFail($id);

        $validated = $request->validate([
            'partner_company_id' => 'sometimes|required|exists:partner_companies,id',
            'user_id'            => 'sometimes|required|exists:users,id',
            'role'               => 'sometimes|required|in:MASTER,ADMIN,USER',
            'active'             => 'boolean',
        ]);

        $partnerCompanyUser->update($validated);

        return response()->json($partnerCompanyUser);
    }

    /**
     * Remove um vínculo.
     */
    public function destroy(int $id)
    {
        $partnerCompanyUser = PartnerCompanyUser::findOrFail($id);

        $partnerCompanyUser->delete();

        return response()->json([
            'message' => 'Vínculo removido com sucesso.'
        ]);
    }
    /**
     * Alterna o status do usuário na empresa atual.
     */
    public function deactivate(int $id)
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

        try {

            /*
         * Verifica se o usuário possui vínculo
         * com a empresa atual.
         */
            $usuarioStatus = DB::selectOne(
                "SELECT id, active
             FROM partner_company_users
             WHERE user_id = ?
             AND partner_company_id = ?",
                [
                    $id,
                    $partnerCompanyId
                ]
            );

            if (!$usuarioStatus) {
                return response()->json([
                    'message' => 'Usuário não pertence à empresa atual.'
                ], 404);
            }

            /*
         * Alterna o status somente no vínculo
         * do usuário com a empresa atual.
         *
         * true  -> false
         * false -> true
         */
            DB::update(
                "UPDATE partner_company_users
             SET active = NOT active
             WHERE user_id = ?
             AND partner_company_id = ?",
                [
                    $id,
                    $partnerCompanyId
                ]
            );

            /*
         * Busca o novo status para retornar
         * ao frontend.
         */
            $novoStatus = DB::selectOne(
                "SELECT active
             FROM partner_company_users
             WHERE user_id = ?
             AND partner_company_id = ?",
                [
                    $id,
                    $partnerCompanyId
                ]
            );

            return response()->json([
                'message' => $novoStatus->active
                    ? 'Usuário ativado com sucesso.'
                    : 'Usuário desativado com sucesso.',
                'active' => (bool) $novoStatus->active
            ], 200);
        } catch (\Throwable $e) {

            \Log::error('Erro ao alterar status do usuário.', [
                'message' => $e->getMessage(),
                'user_id' => $usuarioAutenticado->id ?? null,
                'target_user_id' => $id,
                'partner_company_id' => $partnerCompanyId,
            ]);

            return response()->json([
                'message' => 'Não foi possível alterar o status do usuário.'
            ], 500);
        }
    }
}
