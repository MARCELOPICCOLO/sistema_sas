<?php

namespace Tests\Feature;

use App\Models\ExpenseCategory;
use App\Models\PartnerCompany;
use Tests\TestCase;

class CompanyAdminTest extends TestCase
{
    private array $dados = [
        'corporate_name' => 'Nova Empresa LTDA',
        'trade_name'     => 'Nova',
        'document'       => '11222333000181', // CNPJ válido sem pontuação
        'zip_code'       => '01310100',
        'street'         => 'Av. Paulista',
        'number'         => '1000',
        'district'       => 'Bela Vista',
        'city'           => 'São Paulo',
        'state'          => 'sp',
        'active'         => true,
    ];

    private function master()
    {
        return $this->createUser($this->createCompany(), 'ADMIN', [], ['is_master' => true]);
    }

    public function test_only_master_can_manage_companies(): void
    {
        $company = $this->createCompany();

        foreach (['ADMIN', 'MASTER', 'USER'] as $papel) {
            $this->actingAsApi($this->createUser($company, $papel, ['gestao_equipe', 'caixa']));

            $this->getJson('/api/admin/partner-companies')->assertForbidden();
            $this->postJson('/api/admin/partner-companies', $this->dados)->assertForbidden();
            $this->patchJson("/api/admin/partner-companies/{$company->id}/status")->assertForbidden();
            $this->deleteJson("/api/admin/partner-companies/{$company->id}")->assertForbidden();
        }

        $this->assertTrue($company->fresh()->active);
    }

    public function test_master_creates_company_with_normalized_fields(): void
    {
        $this->actingAsApi($this->master());

        $this->postJson('/api/admin/partner-companies', $this->dados)
            ->assertCreated()
            ->assertJsonPath('data.document', '11.222.333/0001-81')
            ->assertJsonPath('data.zip_code', '01310-100')
            ->assertJsonPath('data.state', 'SP')
            ->assertJsonPath('data.users_count', 0);

        // Mesmo documento com pontuação é duplicado
        $this->postJson('/api/admin/partner-companies', ['document' => '11.222.333/0001-81'] + $this->dados)
            ->assertStatus(422)
            ->assertJsonPath('errors.document.0', 'Já existe uma empresa cadastrada com este CPF/CNPJ.');

        $this->getJson('/api/admin/partner-companies')->assertOk()->assertJsonFragment(['corporate_name' => 'Nova Empresa LTDA']);
    }

    public function test_document_and_zip_are_validated(): void
    {
        $this->actingAsApi($this->master());

        $this->postJson('/api/admin/partner-companies', ['document' => '11.222.333/0001-82'] + $this->dados)
            ->assertStatus(422)->assertJsonValidationErrors('document');

        $this->postJson('/api/admin/partner-companies', ['document' => '111.111.111-11'] + $this->dados)
            ->assertStatus(422)->assertJsonValidationErrors('document');

        $this->postJson('/api/admin/partner-companies', ['zip_code' => '123'] + $this->dados)
            ->assertStatus(422)->assertJsonValidationErrors('zip_code');

        // CPF válido é aceito
        $this->postJson('/api/admin/partner-companies', ['document' => '529.982.247-25'] + $this->dados)
            ->assertCreated()->assertJsonPath('data.document', '529.982.247-25');
    }

    public function test_update_toggle_and_safe_delete(): void
    {
        $this->actingAsApi($this->master());

        $id = $this->postJson('/api/admin/partner-companies', $this->dados)->json('data.id');

        $this->putJson("/api/admin/partner-companies/{$id}", ['corporate_name' => 'Renomeada'] + $this->dados)
            ->assertOk()->assertJsonPath('data.corporate_name', 'Renomeada');

        $this->patchJson("/api/admin/partner-companies/{$id}/status")->assertOk()->assertJsonPath('data.active', false);
        $this->patchJson("/api/admin/partner-companies/{$id}/status")->assertOk()->assertJsonPath('data.active', true);

        // Com dados vinculados, não exclui
        $categoria = ExpenseCategory::create(['partner_company_id' => $id, 'name' => 'Luz']);
        $this->deleteJson("/api/admin/partner-companies/{$id}")->assertStatus(409);
        $this->assertNotNull(PartnerCompany::find($id));

        // Sem dados, exclui
        $categoria->delete();
        $this->deleteJson("/api/admin/partner-companies/{$id}")->assertOk();
        $this->assertNull(PartnerCompany::find($id));
    }
}
