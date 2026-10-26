<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Índices para as consultas por período (caixa, relatórios e vendas do dia).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['partner_company_id', 'status', 'closed_at'], 'orders_company_status_closed_idx');
            $table->index(['partner_company_id', 'closed_at'], 'orders_company_closed_idx');
            $table->index(['partner_company_id', 'order_date'], 'orders_company_order_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_company_status_closed_idx');
            $table->dropIndex('orders_company_closed_idx');
            $table->dropIndex('orders_company_order_date_idx');
        });
    }
};
