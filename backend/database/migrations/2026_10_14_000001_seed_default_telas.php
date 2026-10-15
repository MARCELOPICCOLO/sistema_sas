<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Cadastra as telas (módulos) do sistema. Os slugs são usados pelo
 * frontend e pelo middleware "tela" para controlar o acesso.
 */
return new class extends Migration
{
    public const TELAS = [
        ['slug' => 'produtos', 'nome' => 'Gestão de Estoque', 'descricao' => 'Produtos, categorias e estoque'],
        ['slug' => 'vendas', 'nome' => 'Gestão de Vendas', 'descricao' => 'Comandas e lançamento de vendas'],
        ['slug' => 'caixa', 'nome' => 'Gestão de Caixa', 'descricao' => 'Entradas, saídas e fluxo de caixa'],
        ['slug' => 'gestao_relatorio', 'nome' => 'Relatórios', 'descricao' => 'Análises de vendas e despesas'],
        ['slug' => 'gestao_equipe', 'nome' => 'Gestão de Equipe', 'descricao' => 'Usuários e permissões de acesso'],
    ];

    public function up(): void
    {
        foreach (self::TELAS as $tela) {
            if (!DB::table('telas')->where('slug', $tela['slug'])->exists()) {
                DB::table('telas')->insert($tela + [
                    'ativo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Mantém as telas: podem estar vinculadas a usuários.
    }
};
