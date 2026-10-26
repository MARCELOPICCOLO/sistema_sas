<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_login_returns_token_for_valid_credentials(): void
    {
        $company = $this->createCompany();
        $this->createUser($company, 'USER', ['vendas'], ['username' => 'joao', 'password' => Hash::make('secret123')]);

        $this->postJson('/api/auth/login', ['username' => 'joao', 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonStructure(['access_token', 'token_type', 'expires_in']);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $company = $this->createCompany();
        $this->createUser($company, 'USER', [], ['username' => 'joao', 'password' => Hash::make('secret123')]);

        $this->postJson('/api/auth/login', ['username' => 'joao', 'password' => 'errada'])
            ->assertStatus(401)
            ->assertJsonMissingPath('access_token');
    }

    public function test_login_rejects_inactive_user_and_user_without_active_company(): void
    {
        $company = $this->createCompany();
        $this->createUser($company, 'USER', [], ['username' => 'inativo', 'password' => Hash::make('secret123'), 'active' => false]);

        $this->postJson('/api/auth/login', ['username' => 'inativo', 'password' => 'secret123'])->assertStatus(403);

        $desvinculado = $this->createUser($company, 'USER', [], ['username' => 'desv', 'password' => Hash::make('secret123')]);
        $desvinculado->partnerCompanies()->updateExistingPivot($company->id, ['active' => false]);

        $this->postJson('/api/auth/login', ['username' => 'desv', 'password' => 'secret123'])->assertStatus(403);

        $company->update(['active' => false]);
        $this->createUser($company, 'ADMIN', [], ['username' => 'emp_inativa', 'password' => Hash::make('secret123')]);

        $this->postJson('/api/auth/login', ['username' => 'emp_inativa', 'password' => 'secret123'])->assertStatus(403);
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['username' => 'x', 'password' => 'y'])->assertStatus(401);
        }

        $this->postJson('/api/auth/login', ['username' => 'x', 'password' => 'y'])->assertStatus(429);
    }

    public function test_unauthenticated_requests_get_json_401(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401)->assertJson(['message' => 'Não autenticado.']);
        // Sem o header Accept também deve responder JSON (não redirecionar).
        $this->get('/api/products')->assertStatus(401)->assertJson(['message' => 'Não autenticado.']);
    }

    public function test_me_returns_assigned_telas_for_regular_user(): void
    {
        $company = $this->createCompany();
        $user = $this->createUser($company, 'USER', ['vendas', 'caixa']);

        $this->actingAsApi($user)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.role', 'USER')
            ->assertJsonPath('company_id', $company->id)
            ->assertJsonMissingPath('user.password')
            ->assertJsonCount(2, 'telas');
    }

    public function test_me_returns_all_telas_for_admin(): void
    {
        $company = $this->createCompany();
        $admin = $this->createUser($company, 'ADMIN');

        $slugs = collect($this->actingAsApi($admin)->getJson('/api/auth/me')->assertOk()->json('telas'))->pluck('slug');

        $this->assertEqualsCanonicalizing(
            ['produtos', 'vendas', 'caixa', 'gestao_relatorio', 'gestao_equipe'],
            $slugs->all()
        );
    }

    public function test_logout_invalidates_token(): void
    {
        $company = $this->createCompany();
        $user = $this->createUser($company, 'ADMIN');

        $this->actingAsApi($user)->postJson('/api/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_deactivated_user_loses_access_with_existing_token(): void
    {
        $company = $this->createCompany();
        $user = $this->createUser($company, 'ADMIN');

        $client = $this->actingAsApi($user);
        $client->getJson('/api/products')->assertOk();

        User::whereKey($user->id)->update(['active' => false]);
        $this->app['auth']->forgetGuards();

        $client->getJson('/api/products')->assertStatus(403);
    }
}
