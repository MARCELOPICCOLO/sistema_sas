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
        Schema::create('users', function (Blueprint $table) {

            $table->id();

            // Dados do usuário
            $table->string('full_name');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->string('contact', 20)->nullable();

            // Senha
            $table->string('password');

            // Status
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
        Schema::dropIfExists('users');
    }
};
