<?php

namespace Tests\Feature;

use App\Models\Tela;
use Tests\TestCase;

class TeamManagementTest extends TestCase
{
    public function test_admin_creates_updates_and_toggles_users(): void
    {
        $company = $this->createCompany();
        $admin = $this->createUser($company, 'ADMIN');
        $vendas = Tela::where('slug', 'vendas')->value('id');
        $caixa = Tela::where('slug', 'caixa')->value('id');

        $this->actingAsApi($admin);

        $created = $this->postJson('/api/users', [
            'full_name' => 'Ana Souza',
            'username'  => 'ana',
            'email'     => 'ana@example.com',
            'password'  => 'segredo1',
            'role'      => 'USER',
            'telas'     => [$vendas],
        ])->assertCreated()
            ->assertJsonPath('user.role', 'USER')
            ->assertJsonPath('tela_ids', [$vendas])
            ->assertJsonMissingPath('user.password')
            ->json('user');

        $this->getJson('/api/users')->assertOk()->assertJsonCount(1)->assertJsonPath('0.username', 'ana');
        $this->getJson('/api/telas')->assertOk()->assertJsonCount(5, 'data');

        $this->putJson("/api/users/{$created['id']}", [
            'full_name' => 'Ana S.',
            'username'  => 'ana',
            'email'     => 'ana@example.com',
            'role'      => 'USER',
            'telas'     => [$vendas, $caixa],
        ])->assertOk()->assertJsonPath('user.tela_ids', [$vendas, $caixa]);

        $this->patchJson("/api/partner-company-users/{$created['id']}/deactivate")
            ->assertOk()->assertJsonPath('active', false);

        // Usuário desativado na empresa não consegue mais entrar
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();
        $this->postJson('/api/auth/login', ['username' => 'ana', 'password' => 'segredo1'])->assertForbidden();

        $this->actingAsApi($admin)->patchJson("/api/partner-company-users/{$created['id']}/deactivate")
            ->assertOk()->assertJsonPath('active', true);

        $this->deleteJson("/api/users/{$created['id']}")->assertOk();
        $this->getJson('/api/users')->assertOk()->assertJsonCount(0);
    }

    public function test_regular_user_cannot_escalate_privileges(): void
    {
        $company = $this->createCompany();
        $gerente = $this->createUser($company, 'USER', ['gestao_equipe']);
        $admin = $this->createUser($company, 'ADMIN');
        $colega = $this->createUser($company, 'USER');

        $this->actingAsApi($gerente);

        $payload = ['full_name' => 'X', 'username' => 'novo', 'email' => 'n@example.com', 'password' => 'segredo1'];

        $this->postJson('/api/users', $payload + ['role' => 'ADMIN'])->assertForbidden();
        $this->postJson('/api/users', $payload + ['role' => 'USER'])->assertCreated();

        $this->putJson("/api/users/{$colega->id}", [
            'full_name' => 'Colega', 'username' => $colega->username, 'email' => $colega->email, 'role' => 'ADMIN',
        ])->assertForbidden();

        $this->putJson("/api/users/{$admin->id}", [
            'full_name' => 'Admin', 'username' => $admin->username, 'email' => $admin->email, 'role' => 'USER', 'password' => 'trocada1',
        ])->assertForbidden();
        $this->patchJson("/api/partner-company-users/{$admin->id}/deactivate")->assertForbidden();
        $this->deleteJson("/api/users/{$admin->id}")->assertForbidden();

        // Ninguém altera a si mesmo por esta tela
        $this->patchJson("/api/partner-company-users/{$gerente->id}/deactivate")->assertForbidden();
    }

    public function test_cannot_manage_users_from_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $userA = $this->createUser($companyA, 'USER');

        $this->actingAsApi($this->createUser($companyB, 'ADMIN'));

        $this->getJson("/api/users/{$userA->id}")->assertNotFound();
        $this->putJson("/api/users/{$userA->id}", ['full_name' => 'x', 'username' => 'x', 'email' => 'x@x.com', 'role' => 'USER'])->assertNotFound();
        $this->patchJson("/api/partner-company-users/{$userA->id}/deactivate")->assertNotFound();
        $this->deleteJson("/api/users/{$userA->id}")->assertNotFound();
    }
}
