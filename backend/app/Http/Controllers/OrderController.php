<?php
// app/Http/Controllers/OrderController.php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\CurrentCompany;
use Faker\Provider\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // 📋 LISTAR COMANDAS
    public function index(Request $request)
    {
        try {
            $query = Order::with('items.product');

            if ($request->has('restaurant_id')) {
                $query->where('restaurant_id', $request->restaurant_id);
            }

            $orders = $query->get();

            return response()->json($orders);
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar orders: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erro ao buscar comandas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 🔍 MOSTRAR UMA COMANDA
    public function show($id)
    {
        try {
            $order = Order::with('items.product')->findOrFail($id);
            return response()->json($order);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Comanda não encontrada'
            ], 404);
        }
    }


    // ➕ CRIAR COMANDA
    public function store(Request $request)
    {
        $partnerCompanyId = CurrentCompany::id();

        $data = $request->validate([
            'sales_point_id'  => 'nullable|integer',
            'order_date'      => 'nullable|date',
            'customer_name'   => 'nullable|string|max:100',
            'status'          => 'nullable|string|in:aberto,fechado,pendente,cancelado',
            'total'           => 'nullable|numeric|min:0',
            'payment_method'  => 'nullable|string|in:dinheiro,pix,credito,debito,pendente',
            'closed_at'       => 'nullable|date',
        ]);

        /*
     * Gera automaticamente o próximo número de comanda
     * dentro da empresa atual.
     *
     * Exemplo:
     * Empresa 1 → 190, 191, 192...
     * Empresa 2 → 55, 56, 57...
     */
        $ultimoNumero = Order::where('partner_company_id', $partnerCompanyId)
            ->max('command_number');

        $commandNumber = ($ultimoNumero ?? 0) + 1;

        // Define valores padrão
        $status = $data['status'] ?? 'aberto';
        $total = $data['total'] ?? 0;
        $customerName = $data['customer_name'] ?? 'Cliente';
        $paymentMethod = $data['payment_method'] ?? null;
        $orderDate = $data['order_date'] ?? now()->format('Y-m-d');

        $order = Order::create([
            'partner_company_id' => $partnerCompanyId,
            'sales_point_id'      => $data['sales_point_id'] ?? null,
            'command_number'      => $commandNumber,
            'order_date'          => $orderDate,
            'customer_name'       => $customerName,
            'status'              => $status,
            'total'               => $total,
            'payment_method'      => $paymentMethod,
            'closed_at'           => null,
        ]);

        return response()->json([
            'message' => 'Comanda criada com sucesso',
            'order'   => $order,
        ], 201);
    }



    // ✏️ ATUALIZAR COMANDA
    public function update(Request $request, $id)
    {
        try {
            $order = Order::findOrFail($id);

            $data = $request->validate([
                'order_number'  => 'nullable|string|max:20',
                'order_date'    => 'nullable|date',
                'customer_name' => 'nullable|string|max:100',
                'status'        => 'nullable|string|in:aberto,fechado,pendente,cancelado',
                'total'         => 'nullable|numeric|min:0',
                'payment_method' => 'nullable|string|in:dinheiro,pix,credito,debito,pendente',
                'closed_at'     => 'nullable|date',
            ]);

            $order->update($data);

            return response()->json([
                'message' => 'Comanda atualizada com sucesso',
                'order' => $order
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao atualizar comanda: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erro ao atualizar comanda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 🔢 Gerar número automático da comanda
    private function generateOrderNumber($forceUnique = false)
    {
        $prefix = date('ymd');
        $lastOrder = Order::where('order_number', 'LIKE', "{$prefix}%")
            ->orderBy('order_number', 'desc')
            ->first();

        if ($lastOrder && $lastOrder->order_number) {
            $lastNumber = intval(substr($lastOrder->order_number, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        $orderNumber = "{$prefix}{$newNumber}";

        if ($forceUnique && Order::where('order_number', $orderNumber)->exists()) {
            return $this->generateOrderNumber(true);
        }

        return $orderNumber;
    }

    // 💰 FECHAR COMANDA (CORRIGIDO)
    public function close(Request $request, $id)
    {
        try {
            $order = Order::findOrFail($id);

            if ($order->status === 'fechado') {
                return response()->json([
                    'message' => 'Comanda já está finalizada'
                ], 400);
            }

            $data = $request->validate([
                'payment_method' => 'nullable|string|in:dinheiro,pix,credito,debito,pendente',
                'total' => 'nullable|numeric|min:0'
            ]);

            // Se for comanda não paga
            $status = $data['payment_method'] === 'pendente'
                ? 'pendente'
                : 'fechado';

            // 👈 CORRETO: closed_at recebe a data da comanda (order_date)
            $closedAt = $order->order_date;

            $order->update([
                'status' => $status,
                'closed_at' => $closedAt,
                'payment_method' => $data['payment_method'] ?? null,
                'total' => $data['total'] ?? $order->total
            ]);

            return response()->json([
                'message' => $status === 'pendente'
                    ? 'Comanda marcada como não paga'
                    : 'Comanda finalizada com sucesso',
                'order' => $order
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao finalizar comanda: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erro ao finalizar comanda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ❌ CANCELAR COMANDA
    public function destroy($id)
    {
        try {
            $order = Order::findOrFail($id);

            if ($order->status === 'cancelado') {
                return response()->json([
                    'message' => 'Comanda já está cancelada'
                ], 400);
            }

            $order->update(['status' => 'cancelado']);

            return response()->json([
                'message' => 'Comanda cancelada com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao cancelar comanda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 📊 BUSCAR COMANDA POR NÚMERO
    public function getByOrderNumber($orderNumber)
    {
        try {
            $order = Order::where('order_number', $orderNumber)
                ->with('items.product')
                ->first();

            if (!$order) {
                return response()->json([
                    'message' => 'Comanda não encontrada'
                ], 404);
            }

            return response()->json($order);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar comanda',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // 🔥 MÉTODO AUXILIAR - ATUALIZAR TOTAL
    public static function updateTotal($order)
    {
        $total = $order->items()
            ->selectRaw('SUM(price * quantity) as total')
            ->value('total') ?? 0;

        $order->update(['total' => $total]);
    }

    // 📊 RESUMO DE VENDAS POR DATA
    public function salesSummary(Request $request)
    {
        try {
            $request->validate([
                'restaurant_id' => 'required|exists:restaurants,id',
                'date' => 'required|date',
            ]);

            $totalSales = Order::where('restaurant_id', $request->restaurant_id)
                ->where('status', 'fechado')
                ->whereDate('order_date', $request->date)
                ->sum('total');

            $totalOrders = Order::where('restaurant_id', $request->restaurant_id)
                ->where('status', 'fechado')
                ->whereDate('order_date', $request->date)
                ->count();

            return response()->json([
                'date' => $request->date,
                'total_sales' => (float) $totalSales,
                'total_orders' => $totalOrders,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar resumo de vendas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function byDate(string $date)
    {
        try {
            $companyId = CurrentCompany::id();

            if (!$companyId) {
                return response()->json([
                    'message' => 'Empresa não identificada.'
                ], 403);
            }

            // Validar formato da data
            try {
                $data = \Carbon\Carbon::createFromFormat('Y-m-d', $date);
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Data inválida. Use o formato YYYY-MM-DD.'
                ], 422);
            }

            $inicio = $data->copy()->startOfDay();
            $fim = $data->copy()->endOfDay();

            $orders = Order::where('partner_company_id', $companyId)
                ->where('closed_at', '>=', $inicio)
                ->where('closed_at', '<=', $fim)
                ->whereIn('status', ['fechado', 'pendente'])
                ->orderBy('closed_at', 'desc')
                ->get();

            return response()->json($orders);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar vendas do dia.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function dailySummary(Request $request)
    {
        try {
            $companyId = CurrentCompany::id();

            if (!$companyId) {
                return response()->json([
                    'message' => 'Empresa não identificada.'
                ], 403);
            }

            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');

            if (!$startDate || !$endDate) {
                return response()->json([
                    'message' => 'start_date e end_date são obrigatórios.'
                ], 422);
            }

            // =========================
            // VENDAS
            // =========================

            $orders = Order::where('partner_company_id', $companyId)
                ->where('status', 'fechado')
                ->whereNotNull('closed_at')
                ->whereDate('closed_at', '>=', $startDate)
                ->whereDate('closed_at', '<=', $endDate)
                ->selectRaw('
                DATE(closed_at) as date,
                COUNT(*) as total_vendas,
                SUM(total) as total_entradas
            ')
                ->groupByRaw('DATE(closed_at)')
                ->get()
                ->keyBy('date');


            // =========================
            // DESPESAS
            // =========================

            $expenses = Expense::where('partner_company_id', $companyId)
                ->whereDate('expense_date', '>=', $startDate)
                ->whereDate('expense_date', '<=', $endDate)
                ->selectRaw('
                DATE(expense_date) as date,
                SUM(amount) as total_saidas
            ')
                ->groupByRaw('DATE(expense_date)')
                ->get()
                ->keyBy('date');


            // =========================
            // UNIR DATAS
            // =========================

            $dates = $orders->keys()
                ->merge($expenses->keys())
                ->unique()
                ->sortDesc()
                ->values();

            // =========================
            // MONTAR RESUMO
            // =========================

            $summary = $dates->map(function ($date) use ($orders, $expenses) {

                $order = $orders->get($date);
                $expense = $expenses->get($date);

                $totalEntradas = $order
                    ? (float) $order->total_entradas
                    : 0;

                $totalSaidas = $expense
                    ? (float) $expense->total_saidas
                    : 0;

                return [
                    'date' => $date,

                    'total_vendas' => $order
                        ? (int) $order->total_vendas
                        : 0,

                    'total_entradas' => number_format(
                        $totalEntradas,
                        2,
                        '.',
                        ''
                    ),

                    'total_saidas' => number_format(
                        $totalSaidas,
                        2,
                        '.',
                        ''
                    ),

                    'saldo' => number_format(
                        $totalEntradas - $totalSaidas,
                        2,
                        '.',
                        ''
                    ),
                ];
            });

            return response()->json($summary);
        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Erro ao buscar resumo diário.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
