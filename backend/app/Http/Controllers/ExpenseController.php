<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\CurrentCompany;
use App\Services\ExpenseImport;
use App\Services\ExpenseImportTemplate;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    private function findExpense($id): Expense
    {
        return Expense::where('partner_company_id', CurrentCompany::id())->findOrFail($id);
    }

    private function companyCategoryRule(): array
    {
        return [
            'integer',
            Rule::exists('expense_categories', 'id')->where('partner_company_id', CurrentCompany::id()),
        ];
    }

    public function index(Request $request)
    {
        $data = $request->validate([
            'start_date'          => 'nullable|date',
            'end_date'            => 'nullable|date|after_or_equal:start_date',
            'expense_category_id' => 'nullable|integer',
        ]);

        $query = Expense::where('partner_company_id', CurrentCompany::id())->with('category');

        if (!empty($data['start_date'])) {
            $query->where('expense_date', '>=', Carbon::parse($data['start_date'])->toDateString());
        }

        if (!empty($data['end_date'])) {
            $query->where('expense_date', '<=', Carbon::parse($data['end_date'])->toDateString());
        }

        if (!empty($data['expense_category_id'])) {
            $query->where('expense_category_id', $data['expense_category_id']);
        }

        return response()->json(
            $query->orderByDesc('expense_date')->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'description'         => 'required|string|max:255',
            'amount'              => 'required|numeric|min:0.01|max:99999999',
            'expense_date'        => 'required|date',
            'expense_category_id' => ['required', ...$this->companyCategoryRule()],
            'notes'               => 'nullable|string|max:2000',
        ]);

        $expense = Expense::create([
            ...$data,
            'partner_company_id' => CurrentCompany::id(),
        ]);

        return response()->json([
            'message' => 'Gasto lançado com sucesso',
            'expense' => $expense->load('category'),
        ], 201);
    }

    public function show($id)
    {
        return response()->json($this->findExpense($id)->load('category'));
    }

    public function update(Request $request, $id)
    {
        $expense = $this->findExpense($id);

        $data = $request->validate([
            'description'         => 'sometimes|string|max:255',
            'amount'              => 'sometimes|numeric|min:0.01|max:99999999',
            'expense_date'        => 'sometimes|date',
            'expense_category_id' => ['sometimes', ...$this->companyCategoryRule()],
            'notes'               => 'nullable|string|max:2000',
        ]);

        $expense->update($data);

        return response()->json([
            'message' => 'Gasto atualizado com sucesso',
            'expense' => $expense->load('category'),
        ]);
    }

    public function destroy($id)
    {
        $this->findExpense($id)->delete();

        return response()->json(['message' => 'Gasto removido com sucesso']);
    }

    public function summary(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
        ]);

        $query = Expense::where('partner_company_id', CurrentCompany::id())
            ->where('expense_date', Carbon::parse($data['date'])->toDateString());

        return response()->json([
            'date'                 => $data['date'],
            'total_expenses'       => round((float) (clone $query)->sum('amount'), 2),
            'expenses_by_category' => $this->byCategory($query),
        ]);
    }

    public function monthlySummary(Request $request)
    {
        $data = $request->validate([
            'year'  => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $start = Carbon::create((int) $data['year'], (int) $data['month'], 1)->startOfMonth();

        $query = Expense::where('partner_company_id', CurrentCompany::id())
            ->whereBetween('expense_date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()]);

        $byCategory = $this->byCategory($query);

        return response()->json([
            'year'                 => (int) $data['year'],
            'month'                => (int) $data['month'],
            'total_expenses'       => round((float) $byCategory->sum('total'), 2),
            'expenses_by_category' => $byCategory,
        ]);
    }

    /**
     * Download do modelo de planilha (.xls) para importação de gastos.
     */
    public function importTemplate(ExpenseImportTemplate $template)
    {
        $conteudo = $template->gerar(CurrentCompany::id());

        return response($conteudo, 200, [
            'Content-Type'        => 'application/vnd.ms-excel',
            'Content-Disposition' => 'attachment; filename="modelo-importacao-gastos.xls"',
            'Content-Length'      => (string) strlen($conteudo),
        ]);
    }

    /**
     * Importa gastos de uma planilha (.xls, .xlsx ou .csv).
     *
     * Com "dry_run" só valida e devolve a prévia linha a linha. Sem ele, grava
     * numa transação apenas as linhas válidas e informa as que foram ignoradas.
     */
    public function import(Request $request)
    {
        $data = $request->validate([
            'file'                => 'required|file|max:2048|extensions:xls,xlsx,csv,txt',
            'default_category_id' => ['nullable', ...$this->companyCategoryRule()],
            'dry_run'             => 'nullable|boolean',
        ]);

        $companyId = CurrentCompany::id();
        $importador = new ExpenseImport($companyId, $data['default_category_id'] ?? null);

        try {
            $linhas = $importador->analisar($data['file']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Não foi possível ler a planilha. Verifique se o arquivo não está corrompido.',
            ], 422);
        }

        $validas = array_values(array_filter($linhas, fn ($l) => !$l['errors']));
        $resumo = [
            'total'   => count($linhas),
            'valid'   => count($validas),
            'invalid' => count($linhas) - count($validas),
        ];

        if ($request->boolean('dry_run')) {
            return response()->json(['summary' => $resumo, 'rows' => $linhas]);
        }

        if (!$validas) {
            return response()->json([
                'message' => 'Nenhuma linha válida para importar.',
                'summary' => $resumo,
                'rows'    => $linhas,
            ], 422);
        }

        DB::transaction(function () use ($validas, $companyId) {
            $agora = now();

            foreach (array_chunk($validas, 200) as $lote) {
                Expense::insert(array_map(fn ($l) => [
                    'partner_company_id'  => $companyId,
                    'description'         => $l['description'],
                    'amount'              => $l['amount'],
                    'expense_date'        => $l['date'],
                    'expense_category_id' => $l['category_id'],
                    'notes'               => 'Importado de planilha',
                    'created_at'          => $agora,
                    'updated_at'          => $agora,
                ], $lote));
            }
        });

        return response()->json([
            'message'  => "{$resumo['valid']} gasto(s) importado(s).",
            'imported' => $resumo['valid'],
            'summary'  => $resumo,
            'skipped'  => array_values(array_map(
                fn ($l) => ['line' => $l['line'], 'errors' => $l['errors']],
                array_filter($linhas, fn ($l) => (bool) $l['errors']),
            )),
        ], 201);
    }

    private function byCategory($query)
    {
        return (clone $query)
            ->select('expense_category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('expense_category_id')
            ->with('category')
            ->get();
    }
}
