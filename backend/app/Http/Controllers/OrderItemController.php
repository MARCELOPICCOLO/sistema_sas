<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderItemController extends Controller
{

    public function store(Request $request, $orderId)
    {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id',
                'quantity' => 'sometimes|integer|min:1',
                'price' => 'sometimes|numeric|min:0'
            ]);

            $partnerCompanyId = CurrentCompany::id();

            $order = Order::where('id', $orderId)
                ->where('partner_company_id', $partnerCompanyId)
                ->firstOrFail();

            if ($order->status !== 'aberto') {
                return response()->json([
                    'message' => 'Esta venda já foi finalizada'
                ], 400);
            }

            $product = DB::select("
            SELECT prod.*
            FROM products prod
            INNER JOIN categories cat
                ON prod.category_id = cat.id
                AND cat.partner_company_id = ?
            WHERE prod.id = ?
        ", [
                $partnerCompanyId,
                $request->product_id
            ]);

            if (!$product) {
                return response()->json([
                    'message' => 'Produto não pertence à empresa atual'
                ], 403);
            }

            $product = $product[0];

            $quantity = (int) ($request->quantity ?? 1);
            $price = $request->has('price')
                ? (float) $request->price
                : (float) $product->price;

            $orderItem = new OrderItem();
            $orderItem->order_id = $order->id;
            $orderItem->product_id = $request->product_id;
            $orderItem->quantity = $quantity;
            $orderItem->price = $price;

            $orderItem->save();

            return response()->json([
                'message' => 'Item adicionado com sucesso',
                'item' => $orderItem
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'message' => 'Erro de validação',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {

            \Log::error('Erro ao adicionar item: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erro ao adicionar item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 📋 LISTAR ITENS DA COMANDA
    public function getItems($orderId)
    {
        try {
            $items = OrderItem::where('order_id', $orderId)
                ->with('product')
                ->get();

            return response()->json($items);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar itens',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    // ✏️ ATUALIZAR QUANTIDADE DO ITEM
    public function updateItem(Request $request, $itemId)
    {
        try {
            $data = $request->validate([
                'quantity' => 'required|integer|min:1',
            ]);

            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'message' => 'Empresa não identificada.'
                ], 403);
            }

            $item = OrderItem::with('order')->findOrFail($itemId);

            $order = $item->order;

            if (!$order) {
                return response()->json([
                    'message' => 'Venda não encontrada.'
                ], 404);
            }

            // 🔐 Garante que a venda pertence à empresa do usuário
            if ((int) $order->partner_company_id !== (int) $partnerCompanyId) {
                return response()->json([
                    'message' => 'Você não tem permissão para alterar esta venda.'
                ], 403);
            }

            if ($order->status !== 'aberto') {
                return response()->json([
                    'message' => 'Esta venda já foi finalizada.'
                ], 400);
            }

            $item->update([
                'quantity' => $data['quantity'],
            ]);

            // Recalcula o total usando:
            // preço unitário salvo no OrderItem × quantidade
            OrderController::updateTotal($order);
            $item->refresh();
            $order->refresh();

            return response()->json([
                'message' => 'Item atualizado.',
                'item' => $item,
                'total' => $order->total,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar item.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // ❌ REMOVER ITEM
    public function destroy($itemId)
    {
        try {
            $item = OrderItem::findOrFail($itemId);
            $order = $item->order;

            if ($order->status !== 'aberto') {
                return response()->json(['message' => 'Esta venda já foi finalizada'], 400);
            }

            $item->delete();
            OrderController::updateTotal($order);

            return response()->json([
                'message' => 'Item removido com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao remover item',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
