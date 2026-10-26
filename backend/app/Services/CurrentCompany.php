<?php

namespace App\Services;

use App\Models\PartnerCompany;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Resolve a empresa (tenant) ativa do usuário autenticado.
 *
 * O resultado é memorizado nos atributos da requisição atual, evitando
 * consultas repetidas e sem vazar estado entre requisições.
 */
class CurrentCompany
{
    public const ADMIN_ROLES = ['MASTER', 'ADMIN'];

    private const CACHE_KEY = '_current_company_membership';

    /**
     * Vínculo ativo (partner_company_users) do usuário com uma empresa ativa.
     */
    public static function membership(): ?object
    {
        $userId = Auth::guard('api')->id();

        if (!$userId) {
            return null;
        }

        $attributes = request()->attributes;
        $cached = $attributes->get(self::CACHE_KEY);

        if ($cached && $cached['user_id'] === $userId) {
            return $cached['membership'];
        }

        $membership = DB::table('partner_company_users as pcu')
            ->join('partner_companies as pc', 'pc.id', '=', 'pcu.partner_company_id')
            ->where('pcu.user_id', $userId)
            ->where('pcu.active', true)
            ->where('pc.active', true)
            ->orderBy('pcu.id')
            ->select('pcu.partner_company_id', 'pcu.role')
            ->first();

        $attributes->set(self::CACHE_KEY, [
            'user_id' => $userId,
            'membership' => $membership,
        ]);

        return $membership;
    }

    /**
     * Retorna o ID da empresa ativa do usuário autenticado.
     */
    public static function id(): ?int
    {
        $membership = self::membership();

        return $membership ? (int) $membership->partner_company_id : null;
    }

    /**
     * Papel do usuário na empresa ativa (MASTER, ADMIN ou USER).
     */
    public static function role(): ?string
    {
        return self::membership()?->role;
    }

    /**
     * Administradores da empresa têm acesso a todas as telas.
     */
    public static function isAdmin(): bool
    {
        return in_array(self::role(), self::ADMIN_ROLES, true);
    }

    public static function company(): ?PartnerCompany
    {
        $id = self::id();

        return $id ? PartnerCompany::find($id) : null;
    }
}
