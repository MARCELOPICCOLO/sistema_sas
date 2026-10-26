<?php

namespace Tests;

use App\Models\PartnerCompany;
use App\Models\Tela;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function createCompany(array $attributes = []): PartnerCompany
    {
        static $seq = 0;
        $seq++;

        return PartnerCompany::create($attributes + [
            'corporate_name' => "Empresa {$seq}",
            'document'       => sprintf('%02d.000.000/0001-00', $seq),
            'zip_code'       => '00000-000',
            'street'         => 'Rua',
            'district'       => 'Centro',
            'city'           => 'Cidade',
            'state'          => 'SP',
            'active'         => true,
        ]);
    }

    /**
     * Cria um usuário vinculado à empresa com o papel e as telas informadas.
     *
     * @param string[] $telas slugs
     */
    protected function createUser(PartnerCompany $company, string $role = 'USER', array $telas = [], array $attributes = []): User
    {
        $user = User::factory()->create($attributes);

        $user->partnerCompanies()->attach($company->id, ['role' => $role, 'active' => true]);

        if ($telas) {
            $user->telas()->sync(Tela::whereIn('slug', $telas)->pluck('id'));
        }

        return $user;
    }

    /**
     * Autentica as próximas requisições com o JWT do usuário.
     */
    protected function actingAsApi(User $user): static
    {
        $this->app['auth']->forgetGuards();

        $token = auth('api')->login($user);

        $this->app['auth']->forgetGuards();

        return $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('Accept', 'application/json');
    }
}
