<?php

namespace App\Http\Controllers;

use App\Models\PartnerCompanyUser;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Administração dos vínculos usuário × empresa (somente usuários master).
 *
 * A ativação/desativação feita pelos administradores da própria empresa
 * fica em UserController::toggleStatus.
 */
class PartnerCompanyUserController extends Controller
{
    public function index(Request $request)
    {
        $query = PartnerCompanyUser::with(['user:id,full_name,username,email', 'company:id,corporate_name']);

        if ($request->filled('partner_company_id')) {
            $query->where('partner_company_id', (int) $request->input('partner_company_id'));
        }

        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_company_id' => 'required|integer|exists:partner_companies,id',
            'user_id'            => [
                'required', 'integer', 'exists:users,id',
                Rule::unique('partner_company_users')->where('partner_company_id', $request->input('partner_company_id')),
            ],
            'role'               => 'required|in:MASTER,ADMIN,USER',
            'active'             => 'boolean',
        ]);

        return response()->json(PartnerCompanyUser::create($validated), 201);
    }

    public function show(int $id)
    {
        return response()->json(PartnerCompanyUser::findOrFail($id));
    }

    public function update(Request $request, int $id)
    {
        $vinculo = PartnerCompanyUser::findOrFail($id);

        $vinculo->update($request->validate([
            'role'   => 'sometimes|required|in:MASTER,ADMIN,USER',
            'active' => 'sometimes|boolean',
        ]));

        return response()->json($vinculo);
    }

    public function destroy(int $id)
    {
        PartnerCompanyUser::findOrFail($id)->delete();

        return response()->json(['message' => 'Vínculo removido com sucesso.']);
    }
}
