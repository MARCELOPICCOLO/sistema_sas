<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ExpenseTest extends TestCase
{
    public function test_expense_crud_and_summaries(): void
    {
        $company = $this->createCompany();
        $this->actingAsApi($this->createUser($company, 'USER', ['caixa']));

        $category = $this->postJson('/api/expense-categories', ['name' => 'Fornecedores', 'color' => '#ff0000'])
            ->assertCreated()->json();

        $this->postJson('/api/expense-categories', ['name' => 'Fornecedores'])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'Este nome já está em uso.');

        $expense = $this->postJson('/api/expenses', [
            'description'         => 'Carne',
            'amount'              => 150.75,
            'expense_date'        => '2026-05-10',
            'expense_category_id' => $category['id'],
        ])->assertCreated()
            ->assertJsonPath('expense.expense_date', '2026-05-10')
            ->json('expense');

        $this->putJson("/api/expenses/{$expense['id']}", ['amount' => 200])
            ->assertOk()->assertJsonPath('expense.amount', '200.00');

        $this->getJson('/api/expenses?start_date=2026-05-01&end_date=2026-05-31')->assertOk()->assertJsonCount(1);
        $this->getJson('/api/expenses/summary?date=2026-05-10')->assertOk()->assertJsonPath('total_expenses', 200);
        $this->getJson('/api/expenses/monthly-summary?year=2026&month=5')
            ->assertOk()
            ->assertJsonPath('total_expenses', 200)
            ->assertJsonPath('expenses_by_category.0.category.name', 'Fornecedores');

        $this->getJson('/api/orders/daily-summary?start_date=2026-05-10&end_date=2026-05-10')
            ->assertOk()
            ->assertJsonPath('0.total_saidas', 200)
            ->assertJsonPath('0.saldo', -200);

        // Categoria com gastos não pode ser excluída
        $this->deleteJson("/api/expense-categories/{$category['id']}")->assertStatus(409);

        $this->deleteJson("/api/expenses/{$expense['id']}")->assertOk();
        $this->deleteJson("/api/expense-categories/{$category['id']}")->assertOk();
    }

    public function test_csv_import_with_default_category(): void
    {
        $company = $this->createCompany();
        $this->actingAsApi($this->createUser($company, 'USER', ['caixa']));

        $category = $this->postJson('/api/expense-categories', ['name' => 'Diversos'])->json();

        $csv = "Data;Descrição;Valor\n10/05/2026;Gás;1.234,56\n31/02/2026;Inválida;10,00\n11/05/2026;Água;80,00\n";
        $file = UploadedFile::fake()->createWithContent('gastos.csv', $csv);

        $this->post('/api/expenses/import', ['file' => $file, 'default_category_id' => $category['id']], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('imported', 2)
            ->assertJsonPath('skipped.0.line', 3);

        $this->getJson('/api/expenses/summary?date=2026-05-10')->assertJsonPath('total_expenses', 1234.56);
    }
}
