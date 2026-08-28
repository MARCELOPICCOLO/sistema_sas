<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderItemController extends Controller
{

    public function store(Request $request, $orderId)
    {
        // ... (seu código existente)
    }

    // 📋 LISTAR ITENS DA COMANDA
    public function getItems($orderId)
    {
        // ... (seu código existente)
    }

    // ✏️ ATUALIZAR QUANTIDADE DO ITEM
    public function updateItem(Request $request, $itemId)
    {
        // ... (seu código existente)
    }

    // ❌ REMOVER ITEM
    public function destroy($itemId)
    {
        // ... (seu código existente)
    }

    // =============================================
    // 📊 RESUMO DE PRODUTOS VENDIDOS POR ANO - OTIMIZADO
    // =============================================

    /**
     * Retorna o resumo de produtos vendidos agrupados por produto
     * Retorna apenas: produto, quantidade total e valor total
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function productsSummary(Request $request)
    {
        try {
            // Validação do ano
            $request->validate([
                'year' => 'required|integer|min:2000|max:2099',
            ]);

            $year = $request->input('year');
            $partnerCompanyId = CurrentCompany::id();

            Log::info('Products Summary Request', [
                'year' => $year,
                'partner_company_id' => $partnerCompanyId
            ]);

            if (!$partnerCompanyId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Empresa não identificada.'
                ], 403);
            }

            // Data de início e fim do ano
            $startDate = $year . '-01-01';
            $endDate = $year . '-12-31';

            Log::info('Date range', [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]);

            // Primeiro, vamos verificar se existem comandas fechadas no período
            $ordersCount = Order::where('partner_company_id', $partnerCompanyId)
                ->where('status', 'fechado')
                ->whereBetween('closed_at', [$startDate, $endDate])
                ->count();

            Log::info('Orders found', ['count' => $ordersCount]);

            if ($ordersCount === 0) {
                return response()->json([
                    'success' => true,
                    'year' => $year,
                    'data' => [],
                    'message' => 'Nenhuma comanda fechada encontrada no período.'
                ]);
            }

            // Buscar os produtos vendidos no período - OTIMIZADO
            $productsSummary = OrderItem::query()
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('orders.partner_company_id', $partnerCompanyId)
                ->where('orders.status', 'fechado')
                ->whereBetween('orders.closed_at', [$startDate, $endDate])
                ->select(
                    'products.id',
                    'products.name as product_name',
                    DB::raw('SUM(order_items.quantity) as total_quantity'),
                    DB::raw('SUM(order_items.quantity * order_items.price) as total_value')
                )
                ->groupBy('products.id', 'products.name')
                ->having('total_quantity', '>', 0)
                ->orderBy('total_value', 'DESC')
                ->get();

            Log::info('Products summary found', ['count' => $productsSummary->count()]);

            // Formatar os dados - APENAS O ESSENCIAL
            $formattedData = $productsSummary->map(function ($item) {
                return [
                    'product' => $item->product_name,
                    'quantity' => (int) $item->total_quantity,
                    'value' => (float) number_format($item->total_value, 2, '.', ''),
                ];
            });

            return response()->json([
                'success' => true,
                'year' => $year,
                'data' => $formattedData,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error in productsSummary', [
                'errors' => $e->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in productsSummary: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar resumo de produtos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retorna o resumo de produtos vendidos com filtros adicionais
     * Versão otimizada com apenas os dados essenciais
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function productsSummaryWithFilters(Request $request)
    {
        try {
            // Validação dos filtros
            $request->validate([
                'year' => 'required|integer|min:2000|max:2099',
                'product_id' => 'nullable|integer|exists:products,id',
                'category_id' => 'nullable|integer|exists:categories,id',
                'min_quantity' => 'nullable|integer|min:0',
                'max_quantity' => 'nullable|integer|min:0',
                'min_value' => 'nullable|numeric|min:0',
                'max_value' => 'nullable|numeric|min:0',
                'sort_by' => 'nullable|in:quantity,value,product',
                'sort_direction' => 'nullable|in:asc,desc',
                'limit' => 'nullable|integer|min:1|max:1000',
            ]);

            $year = $request->input('year');
            $partnerCompanyId = CurrentCompany::id();

            if (!$partnerCompanyId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Empresa não identificada.'
                ], 403);
            }

            $startDate = $year . '-01-01';
            $endDate = $year . '-12-31';

            // Query base - OTIMIZADA
            $query = OrderItem::query()
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('orders.partner_company_id', $partnerCompanyId)
                ->where('orders.status', 'fechada')
                ->whereBetween('orders.closed_at', [$startDate, $endDate])
                ->select(
                    'products.id',
                    'products.name as product_name',
                    DB::raw('SUM(order_items.quantity) as total_quantity'),
                    DB::raw('SUM(order_items.quantity * order_items.price) as total_value')
                )
                ->groupBy('products.id', 'products.name');

            // Aplicar filtros
            if ($request->has('product_id') && $request->product_id) {
                $query->where('products.id', $request->product_id);
            }

            if ($request->has('category_id') && $request->category_id) {
                $query->where('products.category_id', $request->category_id);
            }

            if ($request->has('min_quantity') && $request->min_quantity) {
                $query->having('total_quantity', '>=', $request->min_quantity);
            }

            if ($request->has('max_quantity') && $request->max_quantity) {
                $query->having('total_quantity', '<=', $request->max_quantity);
            }

            if ($request->has('min_value') && $request->min_value) {
                $query->having('total_value', '>=', $request->min_value);
            }

            if ($request->has('max_value') && $request->max_value) {
                $query->having('total_value', '<=', $request->max_value);
            }

            // Ordenação
            $sortBy = $request->input('sort_by', 'total_value');
            $sortDirection = $request->input('sort_direction', 'DESC');

            $sortMapping = [
                'quantity' => 'total_quantity',
                'value' => 'total_value',
                'product' => 'product_name',
            ];

            $sortField = $sortMapping[$sortBy] ?? 'total_value';
            $query->orderBy($sortField, $sortDirection);

            // Limite
            if ($request->has('limit') && $request->limit) {
                $query->limit($request->limit);
            }

            $productsSummary = $query->get();

            // Formatar os dados - APENAS O ESSENCIAL
            $formattedData = $productsSummary->map(function ($item) {
                return [
                    'product' => $item->product_name,
                    'quantity' => (int) $item->total_quantity,
                    'value' => (float) number_format($item->total_value, 2, '.', ''),
                ];
            });

            return response()->json([
                'success' => true,
                'year' => $year,
                'filters' => $request->all(),
                'data' => $formattedData,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar resumo de produtos com filtros: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar resumo de produtos',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
