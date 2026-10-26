<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\PartnerCompany;
use App\Models\Product;
use Tests\TestCase;

class OrderFlowTest extends TestCase
{
    private PartnerCompany $company;
    private Product $burger;
    private Product $soda;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = $this->createCompany();
        $category = Category::create(['partner_company_id' => $this->company->id, 'name' => 'Lanches']);
        $this->burger = Product::create(['category_id' => $category->id, 'name' => 'Burger', 'price' => 25.50, 'quantity' => 10]);
        $this->soda = Product::create(['category_id' => $category->id, 'name' => 'Refri', 'price' => 6, 'quantity' => 10]);

        $this->actingAsApi($this->createUser($this->company, 'USER', ['vendas', 'caixa', 'gestao_relatorio']));
    }

    public function test_full_sale_flow(): void
    {
        $today = now()->toDateString();

        $order = $this->postJson('/api/orders', [
            'sales_point_id' => 3,
            'order_date'     => $today,
            'customer_name'  => 'Maria',
            'status'         => 'aberto',
            'total'          => 0,
        ])->assertCreated()
            ->assertJsonPath('order.command_number', 1)
            ->assertJsonPath('order.order_date', $today)
            ->json('order');

        // Número sequencial por empresa
        $this->postJson('/api/orders', [])->assertCreated()->assertJsonPath('order.command_number', 2);

        // A comanda aberta aparece na listagem do dia
        $this->getJson("/api/orders/by-date/{$today}")
            ->assertOk()
            ->assertJsonFragment(['id' => $order['id'], 'status' => 'aberto']);

        $item = $this->postJson("/api/order-items/order/{$order['id']}/item", [
            'product_id' => $this->burger->id,
            'quantity'   => 2,
        ])->assertCreated()->assertJsonPath('total', '51.00')->json('item');

        $this->postJson("/api/order-items/order/{$order['id']}/item", [
            'product_id' => $this->soda->id,
            'quantity'   => 1,
            'price'      => 5,
        ])->assertCreated()->assertJsonPath('total', '56.00');

        $this->putJson("/api/order-items/{$item['id']}", ['quantity' => 3])
            ->assertOk()->assertJsonPath('total', '81.50');

        // Total enviado pelo cliente é ignorado quando há itens
        $this->putJson("/api/orders/{$order['id']}", ['total' => 1, 'customer_name' => 'Maria Silva'])
            ->assertOk()
            ->assertJsonPath('order.total', '81.50')
            ->assertJsonPath('order.customer_name', 'Maria Silva');

        $this->postJson("/api/orders/{$order['id']}/close", ['payment_method' => 'pix', 'total' => 1])
            ->assertOk()
            ->assertJsonPath('order.status', 'fechado')
            ->assertJsonPath('order.total', '81.50');

        $this->assertNotNull(Order::find($order['id'])->closed_at);

        // Comanda fechada não aceita itens nem novo fechamento
        $this->postJson("/api/order-items/order/{$order['id']}/item", ['product_id' => $this->soda->id])->assertStatus(422);
        $this->deleteJson("/api/order-items/{$item['id']}")->assertStatus(422);
        $this->postJson("/api/orders/{$order['id']}/close", ['payment_method' => 'pix'])->assertStatus(422);

        // Caixa e relatórios enxergam a venda
        $this->getJson("/api/orders/daily-summary?start_date={$today}&end_date={$today}")
            ->assertOk()
            ->assertJsonPath('0.total_vendas', 1)
            ->assertJsonPath('0.total_entradas', 81.5);

        $this->getJson("/api/orders?start_date={$today}&end_date={$today}")
            ->assertOk()->assertJsonCount(1);

        $this->getJson('/api/orders/reports/entries?year=' . now()->year)->assertOk()->assertJsonCount(1);

        $this->getJson('/api/order-items/products-summary?year=' . now()->year)
            ->assertOk()
            ->assertJsonPath('data.0.product', 'Burger')
            ->assertJsonPath('data.0.quantity', 3)
            ->assertJsonPath('data.0.value', 76.5);

        $this->getJson('/api/order-items/products-summary/filtered?year=' . now()->year . '&sort_by=product&sort_direction=asc')
            ->assertOk()
            ->assertJsonPath('data.0.product', 'Burger')
            ->assertJsonCount(2, 'data');
    }

    public function test_unpaid_order_is_pending_and_can_be_paid_later(): void
    {
        $order = $this->postJson('/api/orders', ['customer_name' => 'Fiado'])->json('order');
        $this->postJson("/api/order-items/order/{$order['id']}/item", ['product_id' => $this->soda->id]);

        $this->postJson("/api/orders/{$order['id']}/close", ['payment_method' => 'pendente'])
            ->assertOk()->assertJsonPath('order.status', 'pendente');

        $this->postJson("/api/orders/{$order['id']}/close", ['payment_method' => 'dinheiro'])
            ->assertOk()->assertJsonPath('order.status', 'fechado');
    }

    public function test_retroactive_closed_sale_is_recorded_on_its_date(): void
    {
        $this->postJson('/api/orders', [
            'customer_name'  => 'Importada',
            'status'         => 'fechado',
            'total'          => 120,
            'payment_method' => 'dinheiro',
            'closed_at'      => '2026-03-10',
        ])->assertCreated()
            ->assertJsonPath('order.order_date', '2026-03-10')
            ->assertJsonPath('order.total', '120.00');

        $this->getJson('/api/orders/daily-summary?start_date=2026-03-10&end_date=2026-03-10')
            ->assertOk()
            ->assertJsonPath('0.total_entradas', 120);
    }

    public function test_cancel_order(): void
    {
        $order = $this->postJson('/api/orders', [])->json('order');

        $this->deleteJson("/api/orders/{$order['id']}")->assertOk();
        $this->assertSame('cancelado', Order::find($order['id'])->status);
        $this->deleteJson("/api/orders/{$order['id']}")->assertStatus(422);
        $this->putJson("/api/orders/{$order['id']}", ['customer_name' => 'x'])->assertStatus(422);
    }

    public function test_validation_errors(): void
    {
        $this->postJson('/api/orders', ['status' => 'xpto'])->assertStatus(422)->assertJsonValidationErrors('status');
        $this->getJson('/api/orders/by-date/2026-02-31')->assertStatus(422);

        $order = $this->postJson('/api/orders', [])->json('order');
        $this->postJson("/api/orders/{$order['id']}/close", [])->assertStatus(422)->assertJsonValidationErrors('payment_method');
        $this->postJson("/api/order-items/order/{$order['id']}/item", ['product_id' => 999999])->assertStatus(422);
    }
}
