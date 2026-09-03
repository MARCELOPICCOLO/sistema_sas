<?php

namespace App\Http\Controllers;

use App\Models\PartnerCompany;
use Illuminate\Http\Request;

class PartnerCompanyController extends Controller
{
    /**
     * Lista todas as empresas.
     */
    public function index()
    {
        $companies = PartnerCompany::orderBy('corporate_name')->get();

        return response()->json($companies);
    }

    /**
     * Salva uma nova empresa.
     */
    public function store(Request $request)
    {

        $validated = $request->validate([
            'corporate_name' => 'required|string|max:255',
            'trade_name'     => 'nullable|string|max:255',
            'document'       => 'required|string|max:18|unique:partner_companies,document',
            'zip_code'       => 'required|string|max:9',
            'street'         => 'required|string|max:255',
            'number'         => 'nullable|string|max:20',
            'district'       => 'required|string|max:255',
            'city'           => 'required|string|max:255',
            'state'          => 'required|string|size:2',
            'active'         => 'required|boolean',
        ]);

        $company = PartnerCompany::create($validated);

        return response()->json([
            'message' => 'Empresa cadastrada com sucesso.',
            'data' => $company
        ], 201);
    }

    /**
     * Exibe uma empresa.
     */
    public function show(PartnerCompany $partnerCompany)
    {
        return response()->json($partnerCompany);
    }

    /**
     * Atualiza uma empresa.
     */
    public function update(Request $request, PartnerCompany $partnerCompany)
    {
        $validated = $request->validate([
            'corporate_name' => 'required|string|max:255',
            'trade_name'     => 'nullable|string|max:255',
            'document'       => 'required|string|max:18|unique:partner_companies,document,' . $partnerCompany->id,
            'zip_code'       => 'required|string|max:9',
            'street'         => 'required|string|max:255',
            'number'         => 'nullable|string|max:20',
            'district'       => 'required|string|max:255',
            'city'           => 'required|string|max:255',
            'state'          => 'required|string|size:2',
            'active'         => 'required|boolean',
        ]);

        $partnerCompany->update($validated);

        return response()->json([
            'message' => 'Empresa atualizada com sucesso.',
            'data' => $partnerCompany
        ]);
    }

    /**
     * Exclui uma empresa.
     */
    public function destroy(PartnerCompany $partnerCompany)
    {
        $partnerCompany->delete();

        return response()->json([
            'message' => 'Empresa removida com sucesso.'
        ]);
    }
}
