<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Order;
use App\Models\PartnerCompany;
use App\Rules\CpfCnpj;
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
            'document'       => ['required', 'string', 'max:18', new CpfCnpj(), Rule::unique('partner_companies', 'document')->ignore($ignoreId)],
            'zip_code'       => ['required', 'string', 'regex:/^\d{5}-\d{3}$/'],
            'street'         => 'required|string|max:255',
            'number'         => 'nullable|string|max:20',
            'district'       => 'required|string|max:255',
            'city'           => 'required|string|max:255',
            'state'          => ['required', 'string', 'size:2', 'alpha'],
            'active'         => 'required|boolean',
        ];
    }

    private function messages(): array
    {
        return [
            'document.unique' => 'Já existe uma empresa cadastrada com este CPF/CNPJ.',
            'zip_code.regex'  => 'Informe o CEP no formato 00000-000.',
        ];
    }

    /**
     * Padroniza documento, CEP e UF antes de validar, para a checagem de
     * duplicidade funcionar com ou sem pontuação.
     */
    private function validar(Request $request, ?int $ignoreId = null): array
    {
        $cep = preg_replace('/\D/', '', (string) $request->input('zip_code'));

        $request->merge([
            'document' => CpfCnpj::formatar((string) $request->input('document')),
            'zip_code' => strlen($cep) === 8 ? substr($cep, 0, 5) . '-' . substr($cep, 5) : $request->input('zip_code'),
            'state'    => strtoupper(trim((string) $request->input('state'))),
        ]);

        return $request->validate($this->rules($ignoreId), $this->messages(), [
            'corporate_name' => 'razão social',
            'trade_name'     => 'nome fantasia',
            'document'       => 'CPF/CNPJ',
            'zip_code'       => 'CEP',
            'street'         => 'logradouro',
            'number'         => 'número',
            'district'       => 'bairro',
            'city'           => 'cidade',
            'state'          => 'UF',
            'active'         => 'situação',
        ]);
    }

    public function index()
    {
        return response()->json(
            PartnerCompany::withCount('users')->orderBy('corporate_name')->get()
        );
    }

    public function store(Request $request)
    {
        $company = PartnerCompany::create($this->validar($request));

        return response()->json([
            'message' => 'Empresa cadastrada com sucesso.',
            'data'    => $company->loadCount('users'),
        ], 201);
    }

    public function show(int $id)
    {
        return response()->json(PartnerCompany::withCount('users')->findOrFail($id));
    }

    public function update(Request $request, int $id)
    {
        $company = PartnerCompany::findOrFail($id);
        $company->update($this->validar($request, $company->id));

        return response()->json([
            'message' => 'Empresa atualizada com sucesso.',
            'data'    => $company->loadCount('users'),
        ]);
    }

    public function toggleStatus(int $id)
    {
        $company = PartnerCompany::findOrFail($id);
        $company->update(['active' => !$company->active]);

        return response()->json([
            'message' => $company->active ? 'Empresa ativada.' : 'Empresa desativada.',
            'data'    => $company->loadCount('users'),
        ]);
    }

    /**
     * Só remove empresas sem nenhum dado. As demais devem ser desativadas:
     * a exclusão apagaria em cascata produtos, vendas e gastos.
     */
    public function destroy(int $id)
    {
        $company = PartnerCompany::findOrFail($id);

        $temDados = $company->users()->exists()
            || Category::where('partner_company_id', $id)->exists()
            || ExpenseCategory::where('partner_company_id', $id)->exists()
            || Order::where('partner_company_id', $id)->exists()
            || Expense::where('partner_company_id', $id)->exists();

        if ($temDados) {
            return response()->json([
                'message' => 'Esta empresa possui usuários ou movimentações e não pode ser excluída. Desative-a.',
            ], 409);
        }

        $company->delete();

        return response()->json(['message' => 'Empresa removida com sucesso.']);
    }
}
