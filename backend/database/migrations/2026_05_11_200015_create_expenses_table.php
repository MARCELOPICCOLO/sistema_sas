<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {

            $table->id();

            // Empresa
            $table->foreignId('partner_company_id')
                ->constrained('partner_companies')
                ->cascadeOnDelete();

            // Categoria da despesa
            $table->foreignId('expense_category_id')
                ->constrained('expense_categories')
                ->cascadeOnDelete();

            // Dados da despesa
            $table->string('description', 255);
            $table->decimal('amount', 10, 2);
            $table->date('expense_date');
            $table->text('notes')->nullable();

            $table->timestamps();

            // Índices
            $table->index(['partner_company_id', 'expense_date']);
            $table->index(['partner_company_id', 'expense_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
