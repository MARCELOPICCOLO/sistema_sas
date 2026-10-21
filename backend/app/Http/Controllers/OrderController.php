<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Order;
use App\Services\CurrentCompany;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private function findOrder($id): Order
    {
        return Order::ofCompany(CurrentCompany::id())->findOrFail($id);
    }

    /**
     * Lista as comandas da empresa.
     *
     * Filtros opcionais (data de fechamento): start_date, end_date, status.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date'   => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
            'status'     => ['nullable', Rule::in(Order::STATUSES)],
        ]);

        $query = Order::ofCompany(CurrentCompany::id())->with('items.product');

        if (!empty($data['start_date'])) {
            $query->where('closed_at', '>=', $this->startOfDay($data['start_date']));
        }

        if (!empty($data['end_date'])) {
            $query->where('closed_at', '<', $this->startOfNextDay($data['end_date']));
        }

        if (!empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        return response()->json($query->orderByDesc('id')->get());
    }

    public function show($id)
    {
        return response()->json($this->findOrder($id)->load('items.product'));
    }

    /**
     * Cria uma comanda. O número da comanda é sequencial por empresa.
     *
     * Também é usado para lançar vendas retroativas já fechadas
     * (status "fechado" + closed_at), por exemplo na importação do caixa.
     */
    public function store(Request $request)
    {
        $companyId = CurrentCompany::id();

        $data = $request->validate([
            'sales_point_id' => 'nullable|integer|min:0',
            'order_date'     => 'nullable|date',
            'customer_name'  => 'nullable|string|max:100',
            'status'         => ['nullable', Rule::in(Order::STATUSES)],
            'total'          => 'nullable|numeric|min:0|max:99999999',
            'payment_method' => ['nullable', Rule::in(Order::PAYMENT_METHODS)],
            'closed_at'      => 'nullable|date',
        ]);

        $status = $data['status'] ?? Order::STATUS_ABERTO;

        $orderDate = isset($data['order_date'])
            ? Carbon::parse($data['order_date'])->toDateString()
            : (isset($data['closed_at']) ? Carbon::parse($data['closed_at'])->toDateString() : now()->toDateString());

        $closedAt = null;
        if (in_array($status, [Order::STATUS_FECHADO, Order::STATUS_PENDENTE], true)) {
            $closedAt = isset($data['closed_at']) ? Carbon::parse($data['closed_at']) : $this->closingMoment($orderDate);
        }

        $paymentMethod = $data['payment_method'] ?? null;
        if ($status === Order::STATUS_PENDENTE) {
            $paymentMethod = 'pendente';
        }

        $order = DB::transaction(function () use ($companyId, $data, $status, $orderDate, $closedAt, $paymentMethod) {
            $ultimoNumero = Order::ofCompany($companyId)->lockForUpdate()->max('command_number');

            return Order::create([
                'partner_company_id' => $companyId,
                'sales_point_id'     => $data['sales_point_id'] ?? null,
                'command_number'     => ((int) $ultimoNumero) + 1,
                'order_date'         => $orderDate,
                'customer_name'      => trim($data['customer_name'] ?? '') ?: 'Cliente',
                'status'             => $status,
                'total'              => $data['total'] ?? 0,
                'payment_method'     => $paymentMethod,
                'closed_at'          => $closedAt,
            ]);
        });

        return response()->json([
            'message' => 'Comanda criada com sucesso',
            'order'   => $order->fresh()->load('items.product'),
        ], 201);
    }

    /**
     * Atualiza dados da comanda (cliente, data, ponto, status, total).
     *
     * Se a comanda possui itens, o total é sempre recalculado no servidor.
     */
    public function update(Request $request, $id)
    {
        $order = $this->findOrder($id);

        $data = $request->validate([
            'sales_point_id' => 'nullable|integer|min:0',
            'order_date'     => 'nullable|date',
            'customer_name'  => 'nullable|string|max:100',
            'status'         => ['nullable', Rule::in([Order::STATUS_ABERTO, Order::STATUS_CANCELADO])],
            'total'          => 'nullable|numeric|min:0|max:99999999',
            'payment_method' => ['nullable', Rule::in(Order::PAYMENT_METHODS)],
        ]);

        if ($order->status === Order::STATUS_CANCELADO) {
            return response()->json(['message' => 'Comanda cancelada não pode ser alterada.'], 422);
        }

        $isClosed = in_array($order->status, [Order::STATUS_FECHADO, Order::STATUS_PENDENTE], true);

        // Comanda fechada: só permite ajustar nome do cliente e forma de pagamento.
        if ($isClosed) {
            $data = array_intersect_key($data, array_flip(['customer_name', 'payment_method']));
        }

        if (array_key_exists('customer_name', $data)) {
            $data['customer_name'] = trim((string) $data['customer_name']) ?: 'Cliente';
        }

        $hasItems = $order->items()->exists();
        if ($hasItems) {
            unset($data['total']);
        }

        $order->update(array_filter($data, fn ($v) => $v !== null));

        if ($hasItems) {
            $order->recalculateTotal();
        }

        return response()->json([
            'message' => 'Comanda atualizada com sucesso',
            'order'   => $order->fresh()->load('items.product'),
        ]);
    }

    /**
     * Finaliza a comanda. Forma de pagamento "pendente" marca como não paga.
     */
    public function close(Request $request, $id)
    {
        $order = $this->findOrder($id);

        $data = $request->validate([
            'payment_method' => ['required', Rule::in(Order::PAYMENT_METHODS)],
            'total'          => 'nullable|numeric|min:0|max:99999999',
            'customer_name'  => 'nullable|string|max:100',
        ]);

        if (!in_array($order->status, [Order::STATUS_ABERTO, Order::STATUS_PENDENTE], true)) {
            return response()->json([
                'message' => $order->status === Order::STATUS_CANCELADO
                    ? 'Comanda cancelada não pode ser finalizada.'
                    : 'Comanda já está finalizada.',
            ], 422);
        }

        $status = $data['payment_method'] === 'pendente'
            ? Order::STATUS_PENDENTE
            : Order::STATUS_FECHADO;

        $attributes = [
            'status'         => $status,
            'payment_method' => $data['payment_method'],
            // O fechamento é registrado na data da comanda (permite lançamentos retroativos).
            'closed_at'      => $order->closed_at ?? $this->closingMoment($order->order_date?->toDateString()),
        ];

        if (!empty($data['customer_name'])) {
            $attributes['customer_name'] = trim($data['customer_name']);
        }

        $hasItems = $order->items()->exists();
        if (!$hasItems && isset($data['total'])) {
            $attributes['total'] = $data['total'];
        }

        $order->update($attributes);

        if ($hasItems) {
            $order->recalculateTotal();
        }

        return response()->json([
            'message' => $status === Order::STATUS_PENDENTE
                ? 'Comanda marcada como não paga'
                : 'Comanda finalizada com sucesso',
            'order' => $order->fresh()->load('items.product'),
        ]);
    }

    /**
     * Cancela a comanda (não remove do banco).
     */
    public function destroy($id)
    {
        $order = $this->findOrder($id);

        if ($order->status === Order::STATUS_CANCELADO) {
            return response()->json(['message' => 'Comanda já está cancelada'], 422);
        }

        $order->update(['status' => Order::STATUS_CANCELADO]);

        return response()->json(['message' => 'Comanda cancelada com sucesso']);
    }

    /**
     * Resumo de vendas fechadas em uma data.
     */
    public function salesSummary(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $query = Order::ofCompany(CurrentCompany::id())
            ->where('status', Order::STATUS_FECHADO)
            ->where('closed_at', '>=', $this->startOfDay($data['date']))
            ->where('closed_at', '<', $this->startOfNextDay($data['date']));

        return response()->json([
            'date'         => $data['date'],
            'total_sales'  => (float) (clone $query)->sum('total'),
            'total_orders' => $query->count(),
        ]);
    }

    /**
     * Comandas de um dia (pela data da comanda), em qualquer status.
     */
    public function byDate(string $date)
    {
        $parsed = $this->parseDate($date);

        if (!$parsed) {
            return response()->json([
                'message' => 'Data inválida. Use o formato YYYY-MM-DD.'
            ], 422);
        }

        $orders = Order::ofCompany(CurrentCompany::id())
            ->with('items.product')
            ->where(function ($q) use ($parsed) {
                $q->where('order_date', $parsed)
                    ->orWhere(function ($q) use ($parsed) {
                        $q->whereNull('order_date')
                            ->where('created_at', '>=', $this->startOfDay($parsed))
                            ->where('created_at', '<', $this->startOfNextDay($parsed));
                    });
            })
            ->orderByDesc('command_number')
            ->get();

        return response()->json($orders);
    }

    /**
     * Entradas, saídas e saldo agrupados por dia.
     */
    public function dailySummary(Request $request)
    {
        $data = $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date'   => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $companyId = CurrentCompany::id();

        $orders = Order::ofCompany($companyId)
            ->where('status', Order::STATUS_FECHADO)
            ->whereNotNull('closed_at')
            ->where('closed_at', '>=', $this->startOfDay($data['start_date']))
            ->where('closed_at', '<', $this->startOfNextDay($data['end_date']))
            ->selectRaw('DATE(closed_at) as date, COUNT(*) as total_vendas, SUM(total) as total_entradas')
            ->groupByRaw('DATE(closed_at)')
            ->get()
            ->keyBy('date');

        $expenses = Expense::where('partner_company_id', $companyId)
            ->whereBetween('expense_date', [$data['start_date'], $data['end_date']])
            ->selectRaw('DATE(expense_date) as date, SUM(amount) as total_saidas')
            ->groupByRaw('DATE(expense_date)')
            ->get()
            ->keyBy('date');

        $summary = $orders->keys()
            ->merge($expenses->keys())
            ->unique()
            ->sortDesc()
            ->values()
            ->map(function ($date) use ($orders, $expenses) {
                $entradas = (float) ($orders->get($date)?->total_entradas ?? 0);
                $saidas = (float) ($expenses->get($date)?->total_saidas ?? 0);

                return [
                    'date'           => $date,
                    'total_vendas'   => (int) ($orders->get($date)?->total_vendas ?? 0),
                    'total_entradas' => round($entradas, 2),
                    'total_saidas'   => round($saidas, 2),
                    'saldo'          => round($entradas - $saidas, 2),
                ];
            });

        return response()->json($summary);
    }

    /**
     * Vendas fechadas de um ano (relatórios).
     */
    public function reportEntries(Request $request)
    {
        $data = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        $orders = Order::ofCompany(CurrentCompany::id())
            ->where('status', Order::STATUS_FECHADO)
            ->where('closed_at', '>=', Carbon::create((int) $data['year'])->startOfYear())
            ->where('closed_at', '<', Carbon::create((int) $data['year'] + 1)->startOfYear())
            ->orderByDesc('closed_at')
            ->get();

        return response()->json($orders);
    }

    /**
     * Momento de fechamento: agora, se a comanda é de hoje; senão, a data da comanda.
     */
    private function closingMoment(?string $orderDate): Carbon
    {
        if (!$orderDate || $orderDate === now()->toDateString()) {
            return now();
        }

        return Carbon::parse($orderDate)->setTime(12, 0);
    }

    private function startOfDay(string $date): Carbon
    {
        return Carbon::parse($date)->startOfDay();
    }

    private function startOfNextDay(string $date): Carbon
    {
        return Carbon::parse($date)->addDay()->startOfDay();
    }

    private function parseDate(string $date): ?string
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return null;
        }

        [$y, $m, $d] = array_map('intval', explode('-', $date));

        return checkdate($m, $d, $y) ? $date : null;
    }
}
