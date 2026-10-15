<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    private function findCategory($id): Category
    {
        return Category::where('partner_company_id', CurrentCompany::id())->findOrFail($id);
    }

    private function uniqueNameRule(?int $ignoreId = null)
    {
        return Rule::unique('categories', 'name')
            ->where('partner_company_id', CurrentCompany::id())
            ->ignore($ignoreId);
    }

    public function index()
    {
        $categories = Category::where('partner_company_id', CurrentCompany::id())
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'   => ['required', 'string', 'max:255', $this->uniqueNameRule()],
            'active' => 'sometimes|boolean',
        ]);

        $category = Category::create([
            'partner_company_id' => CurrentCompany::id(),
            'name'               => trim($data['name']),
            'active'             => $data['active'] ?? true,
        ]);

        return response()->json($category, 201);
    }

    public function show($id)
    {
        return response()->json($this->findCategory($id)->load('products'));
    }

    public function update(Request $request, $id)
    {
        $category = $this->findCategory($id);

        $data = $request->validate([
            'name'   => ['sometimes', 'required', 'string', 'max:255', $this->uniqueNameRule($category->id)],
            'active' => 'sometimes|boolean',
        ]);

        $category->update($data);

        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = $this->findCategory($id);

        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir uma categoria que possui produtos cadastrados.'
            ], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Categoria deletada com sucesso']);
    }
}
