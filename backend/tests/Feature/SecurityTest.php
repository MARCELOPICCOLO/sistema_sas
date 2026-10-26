<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    public function test_companies_cannot_access_each_others_data(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();

        $catA = Category::create(['partner_company_id' => $companyA->id, 'name' => 'A']);
        $prodA = Product::create(['category_id' => $catA->id, 'name' => 'Produto A', 'price' => 10, 'quantity' => 1]);
        $orderA = Order::create(['partner_company_id' => $companyA->id, 'command_number' => 1, 'status' => 'aberto', 'total' => 10, 'order_date' => now()->toDateString()]);
        $itemA = OrderItem::create(['order_id' => $orderA->id, 'product_id' => $prodA->id, 'quantity' => 1, 'price' => 10]);
        $expCatA = ExpenseCategory::create(['partner_company_id' => $companyA->id, 'name' => 'Luz']);
        $expenseA = Expense::create(['partner_company_id' => $companyA->id, 'expense_category_id' => $expCatA->id, 'description' => 'Conta', 'amount' => 50, 'expense_date' => now()->toDateString()]);

        $this->actingAsApi($this->createUser($companyB, 'ADMIN'));

        // Listagens só retornam dados da própria empresa
        $this->getJson('/api/products')->assertOk()->assertJsonCount(0);
        $this->getJson('/api/categories')->assertOk()->assertJsonCount(0);
        $this->getJson('/api/orders')->assertOk()->assertJsonCount(0);
        $this->getJson('/api/expenses')->assertOk()->assertJsonCount(0);
        $this->getJson('/api/expense-categories')->assertOk()->assertJsonCount(0);
        $this->getJson('/api/orders/by-date/' . now()->toDateString())->assertOk()->assertJsonCount(0);

        // Acesso direto por ID retorna 404
        $this->getJson("/api/products/{$prodA->id}")->assertNotFound();
        $this->putJson("/api/products/{$prodA->id}", ['name' => 'hack'])->assertNotFound();
        $this->deleteJson("/api/products/{$prodA->id}")->assertNotFound();
        $this->getJson("/api/categories/{$catA->id}")->assertNotFound();
        $this->deleteJson("/api/categories/{$catA->id}")->assertNotFound();
        $this->getJson("/api/orders/{$orderA->id}")->assertNotFound();
        $this->putJson("/api/orders/{$orderA->id}", ['total' => 0])->assertNotFound();
        $this->postJson("/api/orders/{$orderA->id}/close", ['payment_method' => 'pix'])->assertNotFound();
        $this->deleteJson("/api/orders/{$orderA->id}")->assertNotFound();
        $this->postJson("/api/order-items/order/{$orderA->id}/item", ['product_id' => $prodA->id])->assertNotFound();
        $this->getJson("/api/order-items/{$orderA->id}/items")->assertNotFound();
        $this->putJson("/api/order-items/{$itemA->id}", ['quantity' => 99])->assertNotFound();
        $this->deleteJson("/api/order-items/{$itemA->id}")->assertNotFound();
        $this->getJson("/api/expenses/{$expenseA->id}")->assertNotFound();
        $this->putJson("/api/expenses/{$expenseA->id}", ['amount' => 1])->assertNotFound();
        $this->deleteJson("/api/expenses/{$expenseA->id}")->assertNotFound();
        $this->putJson("/api/expense-categories/{$expCatA->id}", ['name' => 'x'])->assertNotFound();
        $this->deleteJson("/api/expense-categories/{$expCatA->id}")->assertNotFound();

        // Não pode usar categoria/produto de outra empresa
        $this->postJson('/api/products', ['category_id' => $catA->id, 'name' => 'X', 'price' => 1, 'quantity' => 1])
            ->assertStatus(422)->assertJsonValidationErrors('category_id');
        $this->postJson('/api/expenses', ['expense_category_id' => $expCatA->id, 'description' => 'x', 'amount' => 1, 'expense_date' => '2026-01-01'])
            ->assertStatus(422)->assertJsonValidationErrors('expense_category_id');

        $orderB = $this->postJson('/api/orders', [])->json('order');
        $this->postJson("/api/order-items/order/{$orderB['id']}/item", ['product_id' => $prodA->id])->assertStatus(422);

        // Os dados da empresa A continuam intactos
        $this->assertSame('Produto A', $prodA->fresh()->name);
        $this->assertSame('aberto', $orderA->fresh()->status);
        $this->assertSame(1, $itemA->fresh()->quantity);
        $this->assertNotNull($expenseA->fresh());
    }

    public function test_screen_permissions_are_enforced(): void
    {
        $company = $this->createCompany();
        $vendedor = $this->createUser($company, 'USER', ['vendas']);
        $cat = Category::create(['partner_company_id' => $company->id, 'name' => 'Bebidas']);

        $this->actingAsApi($vendedor);

        // Quem vende pode ler produtos e lançar comandas
        $this->getJson('/api/products')->assertOk();
        $this->getJson('/api/categories')->assertOk();
        $this->postJson('/api/orders', [])->assertCreated();

        // ... mas não pode alterar estoque, caixa, relatórios ou equipe
        $this->postJson('/api/products', ['category_id' => $cat->id, 'name' => 'X', 'price' => 1, 'quantity' => 1])->assertForbidden();
        $this->postJson('/api/categories', ['name' => 'Nova'])->assertForbidden();
        $this->getJson('/api/expenses')->assertForbidden();
        $this->getJson('/api/orders/daily-summary?start_date=2026-01-01&end_date=2026-01-02')->assertForbidden();
        $this->getJson('/api/orders/reports/entries?year=2026')->assertForbidden();
        $this->getJson('/api/users')->assertForbidden();
        $this->getJson('/api/telas')->assertForbidden();

        $semTelas = $this->createUser($company, 'USER');
        $this->actingAsApi($semTelas)->getJson('/api/products')->assertForbidden();
    }

    public function test_platform_admin_routes_require_master(): void
    {
        $company = $this->createCompany();
        $admin = $this->createUser($company, 'ADMIN');

        $this->actingAsApi($admin);
        $this->getJson('/api/admin/partner-companies')->assertForbidden();
        $this->postJson('/api/admin/partner-company-users', ['partner_company_id' => $company->id, 'user_id' => $admin->id, 'role' => 'MASTER'])->assertForbidden();
        $this->deleteJson("/api/admin/partner-companies/{$company->id}")->assertForbidden();

        $master = $this->createUser($company, 'ADMIN', [], ['is_master' => true]);
        $this->actingAsApi($master);
        $this->getJson('/api/admin/partner-companies')->assertOk()->assertJsonCount(1);
        $this->getJson("/api/admin/partner-companies/{$company->id}")->assertOk()->assertJsonPath('id', $company->id);
    }

    public function test_product_with_sales_is_deactivated_instead_of_deleted(): void
    {
        $company = $this->createCompany();
        $cat = Category::create(['partner_company_id' => $company->id, 'name' => 'Pratos']);
        $vendido = Product::create(['category_id' => $cat->id, 'name' => 'Vendido', 'price' => 10, 'quantity' => 1]);
        $novo = Product::create(['category_id' => $cat->id, 'name' => 'Novo', 'price' => 10, 'quantity' => 1]);
        $order = Order::create(['partner_company_id' => $company->id, 'command_number' => 1, 'status' => 'fechado', 'total' => 10]);
        OrderItem::create(['order_id' => $order->id, 'product_id' => $vendido->id, 'quantity' => 1, 'price' => 10]);

        $this->actingAsApi($this->createUser($company, 'USER', ['produtos']));

        $this->deleteJson("/api/products/{$vendido->id}")->assertOk()->assertJsonPath('deactivated', true);
        $this->assertFalse($vendido->fresh()->active);
        $this->assertSame(1, OrderItem::count());

        $this->deleteJson("/api/products/{$novo->id}")->assertOk();
        $this->assertNull($novo->fresh());

        $this->getJson('/api/products')->assertOk()->assertJsonCount(0);
    }

    public function test_product_code_is_unique_per_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $catA = Category::create(['partner_company_id' => $companyA->id, 'name' => 'A']);
        $catB = Category::create(['partner_company_id' => $companyB->id, 'name' => 'B']);
        Product::create(['category_id' => $catA->id, 'name' => 'A', 'product_code' => 'X1', 'price' => 1, 'quantity' => 1]);

        $this->actingAsApi($this->createUser($companyB, 'ADMIN'));
        $this->postJson('/api/products', ['category_id' => $catB->id, 'name' => 'B', 'product_code' => 'X1', 'price' => 1, 'quantity' => 1])->assertCreated();
        $this->postJson('/api/products', ['category_id' => $catB->id, 'name' => 'C', 'product_code' => 'X1', 'price' => 1, 'quantity' => 1])->assertStatus(422);

        $auto = $this->postJson('/api/products', ['category_id' => $catB->id, 'name' => 'D', 'price' => 1, 'quantity' => 1])->json();
        $this->assertStringStartsWith('PROD-', $auto['product_code']);
    }

    public function test_api_errors_do_not_leak_internals_and_have_security_headers(): void
    {
        $company = $this->createCompany();
        $this->actingAsApi($this->createUser($company, 'ADMIN'));

        $this->getJson('/api/orders/999999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Registro não encontrado.'])
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY');
    }
}
