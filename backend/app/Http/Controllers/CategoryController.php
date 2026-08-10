<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\CurrentCompany;

class CategoryController extends Controller
{
    // 📋 LISTAR CATEGORIAS
    public function index(Request $request)
    {
        try {

            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Recupera a empresa ativa do usuário
            $partnerCompanyId = CurrentCompany::id();


            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $categories = Category::where('partner_company_id', $partnerCompanyId)
                ->orderBy('name')
                ->get();

            return response()->json($categories);
        } catch (\Exception $e) {

            Log::error($e);

            return response()->json([
                'message' => 'Erro ao buscar categorias',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ➕ CRIAR CATEGORIA
    public function store(Request $request)
    {
        try {

            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $data = $request->validate([
                'name' => 'required|string|max:255',
            ]);

            $data['partner_company_id'] = $partnerCompanyId;


            $category = Category::create($data);

            return response()->json($category, 201);
        } catch (\Exception $e) {

            Log::error($e);

            return response()->json([
                'message' => 'Erro ao criar categoria',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 🔍 MOSTRAR CATEGORIA
    public function show($id)
    {
        try {

            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $category = Category::with('products')
                ->where('restaurant_id', $user->restaurant_id)
                ->where('id', $id)
                ->first();

            if (!$category) {
                return response()->json([
                    'message' => 'Categoria não encontrada'
                ], 404);
            }

            return response()->json($category);
        } catch (\Exception $e) {

            Log::error($e);

            return response()->json([
                'message' => 'Erro ao buscar categoria',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ✏️ ATUALIZAR CATEGORIA
    public function update(Request $request, $id)
    {
        try {

            $user = Auth::guard('api')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }


            $category = Category::where('partner_company_id', $partnerCompanyId)
                ->where('id', $id)
                ->first();

            if (!$category) {
                return response()->json([
                    'message' => 'Categoria não encontrada'
                ], 404);
            }

            $data = $request->validate([
                'name' => 'required|string|max:255'
            ]);

            $category->update($data);

            return response()->json($category);
        } catch (\Exception $e) {

            Log::error($e);

            return response()->json([
                'message' => 'Erro ao atualizar categoria',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ❌ EXCLUIR CATEGORIA
    public function destroy($id)
    {
        try {

            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $category = Category::where('partner_company_id', $partnerCompanyId)
                ->where('id', $id)
                ->withCount('products')
                ->first();

            if (!$category) {
                return response()->json([
                    'message' => 'Categoria não encontrada'
                ], 404);
            }

            if ($category->products_count > 0) {
                return response()->json([
                    'message' => 'Não é possível excluir uma categoria que possui produtos cadastrados.'
                ], 409);
            }

            $category->delete();

            return response()->json([
                'message' => 'Categoria deletada com sucesso'
            ]);
        } catch (\Exception $e) {

            Log::error($e);

            return response()->json([
                'message' => 'Erro ao deletar categoria',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
