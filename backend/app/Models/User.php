<?php

namespace App\Models;

use App\Services\CurrentCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'username',
        'email',
        'contact',
        'password',
        'active',
        'is_master',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'active' => 'boolean',
        'is_master' => 'boolean',
    ];

    /**
     * Retorna o identificador que será gravado no JWT.
     */
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * Claims adicionais do JWT.
     */
    public function getJWTCustomClaims(): array
    {
        return [];
    }

    public function partnerCompanies()
    {
        return $this->belongsToMany(
            PartnerCompany::class,
            'partner_company_users',
            'user_id',
            'partner_company_id'
        )
            ->withPivot('role', 'active')
            ->withTimestamps();
    }

    public function telas(): BelongsToMany
    {
        return $this->belongsToMany(
            Tela::class,
            'usuario_telas',
            'user_id',
            'tela_id'
        )->withTimestamps();
    }

    /**
     * Telas ativas que o usuário pode acessar na empresa atual.
     *
     * Administradores (MASTER/ADMIN) acessam todas as telas;
     * os demais, somente as telas atribuídas a eles.
     */
    public function allowedTelas()
    {
        if (!$this->active || !CurrentCompany::id()) {
            return collect();
        }

        $query = CurrentCompany::isAdmin()
            ? Tela::query()
            : $this->telas();

        return $query
            ->where('telas.ativo', true)
            ->orderBy('telas.id')
            ->get(['telas.id', 'telas.nome', 'telas.slug', 'telas.descricao', 'telas.ativo'])
            ->map(fn (Tela $tela) => $tela->setHidden(['pivot']))
            ->values();
    }

    /**
     * @return string[]
     */
    public function allowedTelaSlugs(): array
    {
        return $this->allowedTelas()->pluck('slug')->all();
    }
}
