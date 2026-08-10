<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use App\Services\CurrentCompany;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    // 📋 LISTAR PRODUTOS
    public function index()
    {
        $partnerCompanyId = CurrentCompany::id();

        $products = DB::select("
    SELECT
        prod.id,
        prod.product_code,
        prod.description,
        prod.price,
        prod.quantity,
        prod.active,
        prod.created_at,
        prod.updated_at
    FROM products prod
    INNER JOIN categories cat
        ON prod.category_id = cat.id
    WHERE cat.partner_company_id = ?
      AND cat.active = 1
      AND prod.active = 1
    ORDER BY prod.name
", [$partnerCompanyId]);

        foreach ($products as $prod) {
            $cat = DB::select(
                "
        SELECT cat.id, cat.name 
        FROM categories cat 
        INNER JOIN products prod 
            ON prod.category_id = cat.id 
        WHERE prod.id = " . $prod->id
            );

            $prod->category = $cat;
        }

        return response()->json($products);
    }
    // 🔍 BUSCAR PRODUTO POR CÓDIGO
    public function findByCode(Request $request, $code)
    {
        try {

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $product = Product::with('category')
                ->where('product_code', $code)
                ->whereHas('category', function ($query) use ($partnerCompanyId) {
                    $query->where('partner_company_id', $partnerCompanyId);
                })
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produto não encontrado'
                ], 404);
            }

            return response()->json($product);
        } catch (\Exception $e) {

            \Log::error($e);

            return response()->json([
                'message' => 'Erro ao buscar produto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 🔍 MOSTRAR UM PRODUTO
    public function show($id)
    {
        try {

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $product = Product::with('category')
                ->where('id', $id)
                ->whereHas('category', function ($query) use ($partnerCompanyId) {
                    $query->where('partner_company_id', $partnerCompanyId);
                })
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produto não encontrado'
                ], 404);
            }

            $product->quantity = $product->quantity ?? 0;

            return response()->json($product);
        } catch (\Exception $e) {

            \Log::error($e);

            return response()->json([
                'message' => 'Erro ao buscar produto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ➕ CRIAR PRODUTO
    public function store(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }
            // dd($request->all());

            $data = $request->validate([
                'category_id'  => 'required|exists:categories,id',
                'name'         => 'required|string|max:255',
                'product_code' => 'nullable|string|max:50',
                'price'        => 'required|numeric|min:0',
                'quantity'     => 'required|integer|min:0',
                'active'       => 'boolean'
            ]);

            // Verifica se a categoria pertence à empresa do usuário
            $category = Category::where('id', $data['category_id'])
                ->where('partner_company_id', $partnerCompanyId)
                ->first();

            if (!$category) {
                return response()->json([
                    'message' => 'Categoria inválida.'
                ], 400);
            }

            // Cria o produto
            $product = Product::create($data);

            // Gera código automaticamente após salvar
            if (empty($product->product_code)) {
                $product->product_code = 'PROD-' . str_pad($product->id, 5, '0', STR_PAD_LEFT);
                $product->save();
            }

            $product->load('category');

            return response()->json($product, 201);
        } catch (\Exception $e) {

            \Log::error($e);

            return response()->json([
                'message' => 'Erro ao criar produto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ✏️ ATUALIZAR PRODUTO
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::guard('api')->user();

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $product = Product::where('id', $id)
                ->whereHas('category', function ($query) use ($partnerCompanyId) {
                    $query->where('partner_company_id', $partnerCompanyId);
                })
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produto não encontrado'
                ], 404);
            }

            $data = $request->validate([
                'category_id'  => 'sometimes|exists:categories,id',
                'name'         => 'sometimes|string|max:255',
                'product_code' => 'nullable|string|max:50|unique:products,product_code,' . $product->id,
                'price'        => 'sometimes|numeric|min:0',
                'quantity'     => 'sometimes|integer|min:0',
                'active'       => 'sometimes|boolean'
            ]);

            // Se a categoria foi alterada, verifica se pertence à empresa
            if (isset($data['category_id'])) {

                $category = Category::where('id', $data['category_id'])
                    ->where('partner_company_id', $partnerCompanyId)
                    ->first();

                if (!$category) {
                    return response()->json([
                        'message' => 'Categoria inválida.'
                    ], 400);
                }
            }

            $product->update($data);
            $product->load('category');

            return response()->json($product);
        } catch (\Exception $e) {

            \Log::error($e);

            return response()->json([
                'message' => 'Erro ao atualizar produto',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // 📊 ATUALIZAR ESTOQUE
    public function updateStock(Request $request, $id)
    {
        try {

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $product = Product::where('id', $id)
                ->whereHas('category', function ($query) use ($partnerCompanyId) {
                    $query->where('partner_company_id', $partnerCompanyId);
                })
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produto não encontrado'
                ], 404);
            }

            $data = $request->validate([
                'quantity' => 'required|integer|min:0',
            ]);

            $product->update([
                'quantity' => $data['quantity']
            ]);

            return response()->json([
                'message' => 'Estoque atualizado com sucesso',
                'product' => $product
            ]);
        } catch (\Exception $e) {

            \Log::error($e);

            return response()->json([
                'message' => 'Erro ao atualizar estoque',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ❌ DELETAR PRODUTO
    public function destroy($id)
    {
        try {

            $user = Auth::guard('api')->user();

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $product = Product::where('id', $id)
                ->whereHas('category', function ($query) use ($partnerCompanyId) {
                    $query->where('partner_company_id', $partnerCompanyId);
                })
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produto não encontrado'
                ], 404);
            }

            // Verificar se o produto está sendo usado em alguma comanda
            // if ($product->orderItems()->exists()) {
            //     return response()->json([
            //         'message' => 'Não é possível excluir o produto pois ele está vinculado a comandas'
            //     ], 409);
            // }

            $product->delete();

            return response()->json([
                'message' => 'Produto deletado com sucesso'
            ]);
        } catch (\Exception $e) {

            \Log::error($e);

            return response()->json([
                'message' => 'Erro ao deletar produto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 📊 ATUALIZAR ESTOQUE EM LOTE
    public function bulkUpdateStock(Request $request)
    {
        try {

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Usuário não está vinculado a nenhuma empresa.'
                ], 403);
            }

            $data = $request->validate([
                'products' => 'required|array',
                'products.*.id' => 'required|exists:products,id',
                'products.*.quantity' => 'required|integer|min:0',
            ]);

            $updated = [];

            foreach ($data['products'] as $item) {

                $product = Product::where('id', $item['id'])
                    ->whereHas('category', function ($query) use ($partnerCompanyId) {
                        $query->where('partner_company_id', $partnerCompanyId);
                    })
                    ->first();

                if (!$product) {
                    continue;
                }

                $product->update([
                    'quantity' => $item['quantity']
                ]);

                $updated[] = $product;
            }

            return response()->json([
                'message' => count($updated) . ' produtos atualizados com sucesso',
                'products' => $updated
            ]);
        } catch (\Exception $e) {

            \Log::error($e);

            return response()->json([
                'message' => 'Erro ao atualizar estoque',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
