<?php

namespace App\Http\Controllers;

use App\Models\PartnerCompanyUser;
use Illuminate\Http\Request;

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
}
