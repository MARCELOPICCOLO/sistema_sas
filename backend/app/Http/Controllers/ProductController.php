<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    private function findProduct($id): Product
    {
        return Product::ofCompany(CurrentCompany::id())->with('category:id,name')->findOrFail($id);
    }

    /**
     * Garante que a categoria existe e pertence à empresa atual.
     */
    private function companyCategoryRule(): array
    {
        return [
            'integer',
            Rule::exists('categories', 'id')->where('partner_company_id', CurrentCompany::id()),
        ];
    }

    /**
     * Código do produto é único dentro da empresa.
     */
    private function assertUniqueCode(?string $code, ?int $ignoreId = null): ?\Illuminate\Http\JsonResponse
    {
        if (!$code) {
            return null;
        }

        $exists = Product::ofCompany(CurrentCompany::id())
            ->where('product_code', $code)
            ->when($ignoreId, fn ($q) => $q->where('products.id', '!=', $ignoreId))
            ->exists();

        if (!$exists) {
            return null;
        }

        return response()->json([
            'message' => 'Já existe um produto com este código.',
            'errors' => ['product_code' => ['Já existe um produto com este código.']],
        ], 422);
    }

    /**
     * Lista os produtos ativos de categorias ativas da empresa.
     */
    public function index()
    {
        $products = Product::ofCompany(CurrentCompany::id())
            ->active()
            ->whereHas('category', fn ($q) => $q->where('active', true))
            ->with('category:id,name')
            ->orderBy('name')
            ->get(['id', 'category_id', 'name', 'product_code', 'description', 'price', 'quantity', 'active']);

        return response()->json($products);
    }

    public function findByCode($code)
    {
        $product = Product::ofCompany(CurrentCompany::id())
            ->with('category:id,name')
            ->where('product_code', $code)
            ->firstOrFail();

        return response()->json($product);
    }

    public function show($id)
    {
        return response()->json($this->findProduct($id));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id'  => ['required', ...$this->companyCategoryRule()],
            'name'         => 'required|string|max:255',
            'product_code' => 'nullable|string|max:50',
            'description'  => 'nullable|string|max:2000',
            'price'        => 'required|numeric|min:0|max:99999999',
            'quantity'     => 'required|integer|min:0',
            'active'       => 'sometimes|boolean',
        ]);

        if ($error = $this->assertUniqueCode($data['product_code'] ?? null)) {
            return $error;
        }

        $product = DB::transaction(function () use ($data) {
            $product = Product::create($data);

            if (empty($product->product_code)) {
                $product->update([
                    'product_code' => 'PROD-' . str_pad($product->id, 5, '0', STR_PAD_LEFT),
                ]);
            }

            return $product;
        });

        return response()->json($product->load('category:id,name'), 201);
    }

    public function update(Request $request, $id)
    {
        $product = $this->findProduct($id);

        $data = $request->validate([
            'category_id'  => ['sometimes', ...$this->companyCategoryRule()],
            'name'         => 'sometimes|string|max:255',
            'product_code' => 'nullable|string|max:50',
            'description'  => 'nullable|string|max:2000',
            'price'        => 'sometimes|numeric|min:0|max:99999999',
            'quantity'     => 'sometimes|integer|min:0',
            'active'       => 'sometimes|boolean',
        ]);

        if ($error = $this->assertUniqueCode($data['product_code'] ?? null, $product->id)) {
            return $error;
        }

        if (array_key_exists('product_code', $data) && empty($data['product_code'])) {
            unset($data['product_code']);
        }

        $product->update($data);

        return response()->json($product->fresh()->load('category:id,name'));
    }

    public function updateStock(Request $request, $id)
    {
        $product = $this->findProduct($id);

        $data = $request->validate([
            'quantity' => 'required|integer|min:0',
        ]);

        $product->update(['quantity' => $data['quantity']]);

        return response()->json([
            'message' => 'Estoque atualizado com sucesso',
            'product' => $product,
        ]);
    }

    /**
     * Exclui o produto. Se ele já foi vendido, apenas desativa
     * para preservar o histórico de vendas e relatórios.
     */
    public function destroy($id)
    {
        $product = $this->findProduct($id);

        if ($product->orderItems()->exists()) {
            $product->update(['active' => false]);

            return response()->json([
                'message' => 'Produto possui vendas registradas e foi desativado.',
                'deactivated' => true,
            ]);
        }

        $product->delete();

        return response()->json(['message' => 'Produto deletado com sucesso']);
    }

    public function bulkUpdateStock(Request $request)
    {
        $data = $request->validate([
            'products'            => 'required|array|max:1000',
            'products.*.id'       => 'required|integer',
            'products.*.quantity' => 'required|integer|min:0',
        ]);

        $ids = collect($data['products'])->pluck('id');
        $products = Product::ofCompany(CurrentCompany::id())->whereIn('id', $ids)->get()->keyBy('id');

        $updated = DB::transaction(function () use ($data, $products) {
            $updated = [];

            foreach ($data['products'] as $item) {
                if ($product = $products->get($item['id'])) {
                    $product->update(['quantity' => $item['quantity']]);
                    $updated[] = $product;
                }
            }

            return $updated;
        });

        return response()->json([
            'message'  => count($updated) . ' produtos atualizados com sucesso',
            'products' => $updated,
        ]);
    }
}
