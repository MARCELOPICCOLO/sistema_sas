<?php

namespace Database\Seeders;

use App\Models\PartnerCompany;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Cria a empresa inicial e o usuário administrador.
     *
     * Credenciais configuráveis por SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD.
     */
    public function run(): void
    {
        $company = PartnerCompany::firstOrCreate(
            ['document' => env('SEED_COMPANY_DOCUMENT', '00.000.000/0001-00')],
            [
                'corporate_name' => env('SEED_COMPANY_NAME', 'Restaurante Exemplo'),
                'trade_name'     => env('SEED_COMPANY_NAME', 'Restaurante Exemplo'),
                'zip_code'       => '00000-000',
                'street'         => 'Rua Principal',
                'number'         => '1',
                'district'       => 'Centro',
                'city'           => 'São Paulo',
                'state'          => 'SP',
                'active'         => true,
            ]
        );

        $username = env('SEED_ADMIN_USERNAME', 'admin');
        $password = env('SEED_ADMIN_PASSWORD', 'admin123');

        $admin = User::firstOrCreate(
            ['username' => $username],
            [
                'full_name' => 'Administrador',
                'email'     => env('SEED_ADMIN_EMAIL', 'admin@restaurante.local'),
                'password'  => Hash::make($password),
                'active'    => true,
                'is_master' => true,
            ]
        );

        $admin->partnerCompanies()->syncWithoutDetaching([
            $company->id => ['role' => 'ADMIN', 'active' => true],
        ]);

        $this->command?->info("Administrador: {$username} (altere a senha após o primeiro acesso).");
    }
}
