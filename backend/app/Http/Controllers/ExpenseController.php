<?php
// app/Http/Controllers/ExpenseController.php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Services\CurrentCompany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        try {
            $companyId = CurrentCompany::id();


            if (!$companyId) {
                return response()->json([
                    'message' => 'Empresa não identificada.'
                ], 403);
            }


            $data = $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'expense_category_id' => 'nullable|integer',
            ]);

            $query = Expense::where('partner_company_id', $companyId)
                ->with('category');

            if (!empty($data['start_date'])) {
                $query->whereDate('expense_date', '>=', $data['start_date']);
            }

            if (!empty($data['end_date'])) {
                $query->whereDate('expense_date', '<=', $data['end_date']);
            }

            if (!empty($data['expense_category_id'])) {
                $query->where(
                    'expense_category_id',
                    $data['expense_category_id']
                );
            }

            $expenses = $query
                ->orderBy('expense_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($expenses);
        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'message' => 'Erro de validação',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Erro ao buscar gastos',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function store(Request $request)
    {
        try {
            $companyId = CurrentCompany::id();

            $data = $request->validate([
                'description' => 'required|string|max:255',
                'amount' => 'required|numeric|min:0.01',
                'expense_date' => 'required|date',
                'expense_category_id' => 'required|integer',
                'notes' => 'nullable|string',
            ]);

            $category = ExpenseCategory::where(
                'id',
                $data['expense_category_id']
            )
                ->where('partner_company_id', $companyId)
                ->first();

            if (!$category) {
                return response()->json([
                    'message' => 'Categoria não encontrada ou não pertence à empresa atual'
                ], 404);
            }

            $expense = Expense::create([
                'partner_company_id' => $companyId,
                'description' => $data['description'],
                'amount' => $data['amount'],
                'expense_date' => $data['expense_date'],
                'expense_category_id' => $data['expense_category_id'],
                'notes' => $data['notes'] ?? null,
            ]);

            $expense->load('category');

            return response()->json([
                'message' => 'Gasto lançado com sucesso',
                'expense' => $expense
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'message' => 'Erro de validação',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Erro ao criar gasto',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function show($id)
    {
        try {
            $expense = Expense::with('category')->findOrFail($id);
            return response()->json($expense);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gasto não encontrado'
            ], 404);
        }
    }
    public function update(Request $request, $id)
    {
        try {
            $expense = Expense::findOrFail($id);

            $data = $request->validate([
                'description' => 'sometimes|string|max:255',
                'amount' => 'sometimes|numeric|min:0.01',
                'expense_date' => 'sometimes|date',
                'category_id' => 'sometimes|exists:expense_categories,id', // Mudado de category para category_id
                'notes' => 'nullable|string',
            ]);

            $expense->update($data);
            $expense->load('category');

            return response()->json([
                'message' => 'Gasto atualizado com sucesso',
                'expense' => $expense
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar gasto',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function destroy($id)
    {
        try {
            $expense = Expense::findOrFail($id);
            $expense->delete();

            return response()->json([
                'message' => 'Gasto removido com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao remover gasto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function summary(Request $request)
    {
        try {

            $companyId = CurrentCompany::id();

            if (!$companyId) {
                return response()->json([
                    'message' => 'Empresa não identificada.'
                ], 403);
            }

            $request->validate([
                'date' => 'required|date',
            ]);

            $totalExpenses = Expense::where('partner_company_id', $companyId)
                ->whereDate('expense_date', $request->date)
                ->sum('amount');

            $expensesByCategory = Expense::where('partner_company_id', $companyId)
                ->whereDate('expense_date', $request->date)
                ->with('category')
                ->select('category_id', DB::raw('SUM(amount) as total'))
                ->groupBy('category_id')
                ->get();

            return response()->json([
                'date' => $request->date,
                'total_expenses' => $totalExpenses,
                'expenses_by_category' => $expensesByCategory,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar resumo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function monthlySummary(Request $request)
    {
        try {

            $companyId = CurrentCompany::id();

            if (!$companyId) {
                return response()->json([
                    'message' => 'Empresa não identificada.'
                ], 403);
            }

            $request->validate([
                'year' => 'required|integer|min:2020|max:2030',
                'month' => 'required|integer|min:1|max:12',
            ]);

            $startDate = date("{$request->year}-{$request->month}-01");
            $endDate = date("{$request->year}-{$request->month}-t");

            $expenses = Expense::where('partner_company_id', $companyId)
                ->whereBetween('expense_date', [$startDate, $endDate])
                ->with('category')
                ->select('category_id', DB::raw('SUM(amount) as total'))
                ->groupBy('category_id')
                ->get();

            $total = $expenses->sum('total');

            return response()->json([
                'year' => $request->year,
                'month' => $request->month,
                'total_expenses' => $total,
                'expenses_by_category' => $expenses,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar resumo mensal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function importCsv(Request $request)
    {
        try {
            $request->validate([
                'restaurant_id' => 'required|exists:restaurants,id',
                'file' => 'required|file|mimes:csv,txt',
                'category_id' => 'required|exists:expense_categories,id',
            ]);

            $file = $request->file('file');
            $handle = fopen($file->getPathname(), 'r');

            // Ler cabeçalho
            $header = fgetcsv($handle, 0, ';');

            $imported = 0;
            $errors = [];

            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                try {
                    $data = array_combine($header, $row);

                    // Converter data de DD/MM/YYYY para YYYY-MM-DD
                    $dateParts = explode('/', $data['Data']);
                    $formattedDate = "{$dateParts[2]}-{$dateParts[1]}-{$dateParts[0]}";

                    // Converter valor (substituir vírgula por ponto)
                    $amount = str_replace(',', '.', $data['Valor']);

                    Expense::create([
                        'restaurant_id' => $request->restaurant_id,
                        'description' => $data['Descrição'],
                        'amount' => (float) $amount,
                        'expense_date' => $formattedDate,
                        'category_id' => $request->category_id,
                        'notes' => null,
                    ]);

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Erro na linha " . ($imported + 2) . ": " . $e->getMessage();
                }
            }

            fclose($handle);

            return response()->json([
                'message' => "Importação concluída",
                'imported' => $imported,
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro na importação',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
