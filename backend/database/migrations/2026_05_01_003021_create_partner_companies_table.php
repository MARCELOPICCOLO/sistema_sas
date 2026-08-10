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

        Schema::create('partner_companies', function (Blueprint $table) {
            $table->id();

            // Dados da empresa
            $table->string('corporate_name');      // Razão Social / Nome
            $table->string('trade_name')->nullable(); // Nome Fantasia
            $table->string('document', 18)->unique(); // CPF ou CNPJ

            // Endereço
            $table->string('zip_code', 9);
            $table->string('street');
            $table->string('number', 20)->nullable();
            $table->string('district');
            $table->string('city');
            $table->string('state', 2);
            $table->boolean('active')->default(true);
            $table->boolean('is_master')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_companies');
    }
};
