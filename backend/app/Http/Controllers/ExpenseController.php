<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\CurrentCompany;
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
            $query->whereDate('expense_date', '>=', $data['start_date']);
        }

        if (!empty($data['end_date'])) {
            $query->whereDate('expense_date', '<=', $data['end_date']);
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
            ->whereDate('expense_date', $data['date']);

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
     * Importa gastos de um CSV (separado por ";") com colunas Data;Descrição;Valor.
     */
    public function importCsv(Request $request)
    {
        $data = $request->validate([
            'file'                => 'required|file|mimes:csv,txt|max:2048',
            'expense_category_id' => ['required', ...$this->companyCategoryRule()],
        ]);

        $handle = fopen($data['file']->getPathname(), 'r');
        $header = array_map(fn ($h) => trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $h)), fgetcsv($handle, 0, ';') ?: []);

        $imported = 0;
        $errors = [];
        $line = 1;

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                $line++;

                if (count($row) !== count($header)) {
                    $errors[] = "Linha {$line}: número de colunas inválido.";
                    continue;
                }

                $values = array_combine($header, $row);

                try {
                    $rawDate = trim($values['Data'] ?? '');
                    $parsed = Carbon::createFromFormat('!d/m/Y', $rawDate);

                    // Rejeita datas que "transbordam" (ex.: 31/02 viraria 03/03).
                    if (!$parsed || $parsed->format('d/m/Y') !== $rawDate) {
                        throw new \InvalidArgumentException('data inválida');
                    }

                    $date = $parsed->toDateString();
                    $amount = (float) str_replace(['.', ','], ['', '.'], trim($values['Valor'] ?? ''));

                    if ($amount <= 0) {
                        throw new \InvalidArgumentException('valor inválido');
                    }

                    Expense::create([
                        'partner_company_id'  => CurrentCompany::id(),
                        'description'         => mb_substr(trim($values['Descrição'] ?? $values['Descricao'] ?? 'Gasto importado'), 0, 255),
                        'amount'              => $amount,
                        'expense_date'        => $date,
                        'expense_category_id' => $data['expense_category_id'],
                    ]);

                    $imported++;
                } catch (\Throwable $e) {
                    $errors[] = "Linha {$line}: dados inválidos.";
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        } finally {
            fclose($handle);
        }

        return response()->json([
            'message'  => 'Importação concluída',
            'imported' => $imported,
            'errors'   => $errors,
        ]);
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
