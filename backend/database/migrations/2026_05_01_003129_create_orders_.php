<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {

            $table->id();

            // Empresa dona da comanda
            $table->foreignId('partner_company_id')
                ->constrained('partner_companies')
                ->cascadeOnDelete();


            // Cliente
            $table->string('customer_name', 100)->nullable();

            // pontos de venda
            $table->string('sales_points', 10)->nullable();

            // Status
            $table->string('status', 50)->default('aberto');

            // Valor total
            $table->decimal('total', 10, 2)->default(0);

            // Forma de pagamento
            $table->string('payment_method', 50)->nullable();

            // Data de fechamento
            $table->timestamp('closed_at')->nullable();

            $table->timestamps();

            // Índices
            $table->index(['partner_company_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
