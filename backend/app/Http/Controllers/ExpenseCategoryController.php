<?php
// app/Http/Controllers/ExpenseCategoryController.php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request)
    {
        $partnerCompanyId = CurrentCompany::id();

        $categories = ExpenseCategory::where('partner_company_id', $partnerCompanyId)
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $partnerCompanyId = CurrentCompany::id();

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:20',
        ]);

        $category = ExpenseCategory::create([
            'partner_company_id' => $partnerCompanyId,
            'name' => $data['name'],
            'icon' => $data['icon'] ?? '📌',
            'color' => $data['color'] ?? '#6b7280',
            'is_active' => true
        ]);


        return response()->json($category, 201);
    }

    public function update(Request $request, $id)
    {
        $partnerCompanyId = CurrentCompany::id();

        if (!$partnerCompanyId) {
            return response()->json([
                'message' => 'Usuário não está vinculado a nenhuma empresa.'
            ], 403);
        }

        $category = ExpenseCategory::where('id', $id)
            ->where('partner_company_id', $partnerCompanyId)
            ->first();

        if (!$category) {
            return response()->json([
                'message' => 'Categoria não encontrada.'
            ], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'icon' => 'nullable|string|max:10',
            'color' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $category->update($data);

        return response()->json($category);
    }

    public function destroy($id)
    {
        $companyId = CurrentCompany::id();

        $category = ExpenseCategory::where('id', $id)
            ->where('partner_company_id', $companyId)
            ->firstOrFail();


        // Verificar se tem gastos associados
        if ($category->expenses()->count() > 0) {
            return response()->json([
                'message' => 'Não é possível excluir categoria com gastos associados'
            ], 409);
        }

        DB::delete("Delete from expense_categories where id = ? and partner_company_id = ?", [$id, $companyId]);

        return response()->json([
            'message' => 'Categoria excluída com sucesso'
        ]);
    }
}
