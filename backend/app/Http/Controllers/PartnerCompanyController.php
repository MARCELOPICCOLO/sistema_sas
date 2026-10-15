<?php

namespace App\Http\Controllers;

use App\Models\PartnerCompany;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Administração de empresas (somente usuários master).
 */
class PartnerCompanyController extends Controller
{
    private function rules(?int $ignoreId = null): array
    {
        return [
            'corporate_name' => 'required|string|max:255',
            'trade_name'     => 'nullable|string|max:255',
            'document'       => ['required', 'string', 'max:18', Rule::unique('partner_companies', 'document')->ignore($ignoreId)],
            'zip_code'       => 'required|string|max:9',
            'street'         => 'required|string|max:255',
            'number'         => 'nullable|string|max:20',
            'district'       => 'required|string|max:255',
            'city'           => 'required|string|max:255',
            'state'          => 'required|string|size:2',
            'active'         => 'required|boolean',
        ];
    }

    public function index()
    {
        return response()->json(PartnerCompany::orderBy('corporate_name')->get());
    }

    public function store(Request $request)
    {
        $company = PartnerCompany::create($request->validate($this->rules()));

        return response()->json([
            'message' => 'Empresa cadastrada com sucesso.',
            'data'    => $company,
        ], 201);
    }

    public function show(int $id)
    {
        return response()->json(PartnerCompany::findOrFail($id));
    }

    public function update(Request $request, int $id)
    {
        $company = PartnerCompany::findOrFail($id);
        $company->update($request->validate($this->rules($company->id)));

        return response()->json([
            'message' => 'Empresa atualizada com sucesso.',
            'data'    => $company,
        ]);
    }

    public function destroy(int $id)
    {
        PartnerCompany::findOrFail($id)->delete();

        return response()->json(['message' => 'Empresa removida com sucesso.']);
    }
}
