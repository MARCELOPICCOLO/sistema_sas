<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\PartnerCompany;


class CurrentCompany
{
    /**
     * Retorna o ID da empresa ativa do usuário autenticado.
     */
    public static function id(): ?int
    {
        return DB::table('partner_company_users')
            ->where('user_id', Auth::id())
            ->where('active', true)
            ->value('partner_company_id');
    }

    public static function company(): ?PartnerCompany
    {
        $id = self::id();

        return $id ? PartnerCompany::find($id) : null;
    }
}
