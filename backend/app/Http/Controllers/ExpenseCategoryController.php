<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseCategoryController extends Controller
{
    private function findCategory($id): ExpenseCategory
    {
        return ExpenseCategory::where('partner_company_id', CurrentCompany::id())->findOrFail($id);
    }

    private function uniqueNameRule(?int $ignoreId = null)
    {
        return Rule::unique('expense_categories', 'name')
            ->where('partner_company_id', CurrentCompany::id())
            ->ignore($ignoreId);
    }

    public function index()
    {
        $categories = ExpenseCategory::where('partner_company_id', CurrentCompany::id())
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function show($id)
    {
        return response()->json($this->findCategory($id));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => ['required', 'string', 'max:100', $this->uniqueNameRule()],
            'icon'  => 'nullable|string|max:10',
            'color' => ['nullable', 'string', 'max:20', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
        ]);

        $category = ExpenseCategory::create([
            'partner_company_id' => CurrentCompany::id(),
            'name'      => trim($data['name']),
            'icon'      => $data['icon'] ?? '📌',
            'color'     => $data['color'] ?? '#6b7280',
            'is_active' => true,
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, $id)
    {
        $category = $this->findCategory($id);

        $data = $request->validate([
            'name'      => ['sometimes', 'required', 'string', 'max:100', $this->uniqueNameRule($category->id)],
            'icon'      => 'nullable|string|max:10',
            'color'     => ['nullable', 'string', 'max:20', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
            'is_active' => 'sometimes|boolean',
        ]);

        $category->update(array_filter($data, fn ($v) => $v !== null));

        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = $this->findCategory($id);

        if ($category->expenses()->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir categoria com gastos associados'
            ], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Categoria excluída com sucesso']);
    }
}
