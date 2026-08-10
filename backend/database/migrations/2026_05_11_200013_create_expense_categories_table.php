<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {

            $table->id();

            $table->foreignId('partner_company_id')
                ->constrained('partner_companies')
                ->cascadeOnDelete();

            $table->string('name', 100);
            $table->string('icon', 10)->default('📌');
            $table->string('color', 20)->default('#6b7280');
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // O nome da categoria deve ser único apenas dentro da empresa
            $table->unique(['partner_company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
