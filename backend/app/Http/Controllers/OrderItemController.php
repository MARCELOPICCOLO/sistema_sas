<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderItemController extends Controller
{
    private function findItem($itemId): OrderItem
    {
        return OrderItem::with('order')
            ->whereHas('order', fn ($q) => $q->where('partner_company_id', CurrentCompany::id()))
            ->findOrFail($itemId);
    }

    /**
     * Adiciona um item à comanda.
     * O preço padrão é o do produto; pode ser informado um preço específico.
     */
    public function store(Request $request, $orderId)
    {
        $companyId = CurrentCompany::id();

        $data = $request->validate([
            'product_id' => 'required|integer',
            'quantity'   => 'sometimes|integer|min:1|max:100000',
            'price'      => 'sometimes|numeric|min:0|max:99999999',
            'note'       => 'nullable|string|max:500',
        ]);

        $order = Order::ofCompany($companyId)->findOrFail($orderId);

        if (!$order->isEditable()) {
            return response()->json(['message' => 'Esta venda já foi finalizada.'], 422);
        }

        $product = Product::ofCompany($companyId)->find($data['product_id']);

        if (!$product) {
            return response()->json([
                'message' => 'Produto não encontrado.',
                'errors' => ['product_id' => ['Produto não encontrado.']],
            ], 422);
        }

        $item = DB::transaction(function () use ($order, $product, $data) {
            $item = $order->items()->create([
                'product_id' => $product->id,
                'quantity'   => (int) ($data['quantity'] ?? 1),
                'price'      => $data['price'] ?? $product->price,
                'note'       => $data['note'] ?? null,
            ]);

            $order->recalculateTotal();

            return $item;
        });

        return response()->json([
            'message' => 'Item adicionado com sucesso',
            'item'    => $item->load('product'),
            'total'   => $order->fresh()->total,
        ], 201);
    }

    public function getItems($orderId)
    {
        $order = Order::ofCompany(CurrentCompany::id())->findOrFail($orderId);

        return response()->json($order->items()->with('product')->get());
    }

    public function updateItem(Request $request, $itemId)
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1|max:100000',
            'price'    => 'sometimes|numeric|min:0|max:99999999',
        ]);

        $item = $this->findItem($itemId);
        $order = $item->order;

        if (!$order->isEditable()) {
            return response()->json(['message' => 'Esta venda já foi finalizada.'], 422);
        }

        DB::transaction(function () use ($item, $order, $data) {
            $item->update($data);
            $order->recalculateTotal();
        });

        return response()->json([
            'message' => 'Item atualizado.',
            'item'    => $item->fresh()->load('product'),
            'total'   => $order->fresh()->total,
        ]);
    }

    public function destroy($itemId)
    {
        $item = $this->findItem($itemId);
        $order = $item->order;

        if (!$order->isEditable()) {
            return response()->json(['message' => 'Esta venda já foi finalizada.'], 422);
        }

        DB::transaction(function () use ($item, $order) {
            $item->delete();
            $order->recalculateTotal();
        });

        return response()->json([
            'message' => 'Item removido com sucesso',
            'total'   => $order->fresh()->total,
        ]);
    }

    /**
     * Resumo de produtos vendidos (comandas fechadas) no ano.
     */
    public function productsSummary(Request $request)
    {
        $data = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        $rows = $this->summaryQuery((int) $data['year'])
            ->orderByDesc('total_value')
            ->get();

        return response()->json([
            'success' => true,
            'year'    => (int) $data['year'],
            'data'    => $this->formatSummary($rows),
        ]);
    }

    /**
     * Resumo de produtos vendidos com filtros adicionais.
     */
    public function productsSummaryWithFilters(Request $request)
    {
        $data = $request->validate([
            'year'           => 'required|integer|min:2000|max:2100',
            'product_id'     => 'nullable|integer',
            'category_id'    => 'nullable|integer',
            'min_quantity'   => 'nullable|integer|min:0',
            'max_quantity'   => 'nullable|integer|min:0',
            'min_value'      => 'nullable|numeric|min:0',
            'max_value'      => 'nullable|numeric|min:0',
            'sort_by'        => 'nullable|in:quantity,value,product',
            'sort_direction' => 'nullable|in:asc,desc',
            'limit'          => 'nullable|integer|min:1|max:1000',
        ]);

        $query = $this->summaryQuery((int) $data['year']);

        if (!empty($data['product_id'])) {
            $query->where('products.id', $data['product_id']);
        }

        if (!empty($data['category_id'])) {
            $query->where('products.category_id', $data['category_id']);
        }

        $having = [
            'min_quantity' => ['SUM(order_items.quantity) >= ?'],
            'max_quantity' => ['SUM(order_items.quantity) <= ?'],
            'min_value'    => ['SUM(order_items.quantity * order_items.price) >= ?'],
            'max_value'    => ['SUM(order_items.quantity * order_items.price) <= ?'],
        ];

        foreach ($having as $field => [$sql]) {
            if (isset($data[$field])) {
                $query->havingRaw($sql, [$data[$field]]);
            }
        }

        $sortField = [
            'quantity' => 'total_quantity',
            'value'    => 'total_value',
            'product'  => 'product_name',
        ][$data['sort_by'] ?? 'value'];

        $query->orderBy($sortField, $data['sort_direction'] ?? 'desc');

        if (!empty($data['limit'])) {
            $query->limit($data['limit']);
        }

        return response()->json([
            'success' => true,
            'year'    => (int) $data['year'],
            'filters' => $data,
            'data'    => $this->formatSummary($query->get()),
        ]);
    }

    private function summaryQuery(int $year)
    {
        return DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.partner_company_id', CurrentCompany::id())
            ->where('orders.status', Order::STATUS_FECHADO)
            ->whereYear('orders.closed_at', $year)
            ->select(
                'products.id',
                'products.name as product_name',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_value')
            )
            ->groupBy('products.id', 'products.name');
    }

    private function formatSummary($rows)
    {
        return $rows->map(fn ($row) => [
            'product_id' => (int) $row->id,
            'product'    => $row->product_name,
            'quantity'   => (int) $row->total_quantity,
            'value'      => round((float) $row->total_value, 2),
        ])->values();
    }
}
