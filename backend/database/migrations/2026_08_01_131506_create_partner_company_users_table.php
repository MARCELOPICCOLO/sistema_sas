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
        Schema::create('partner_company_users', function (Blueprint $table) {
            $table->id();

            $table->foreignId('partner_company_id')
                ->constrained('partner_companies')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Papel do usuário na empresa
            $table->enum('role', [
                'MASTER',
                'ADMIN',
                'USER'
            ]);

            $table->boolean('active')->default(true);

            $table->timestamps();

            // Um usuário pode existir em várias empresas,
            // mas apenas uma vez em cada empresa.
            $table->unique([
                'partner_company_id',
                'user_id'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_company_users');
    }
};
