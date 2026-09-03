<?php

namespace App\Models;

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
        'company_id',
    ];

    protected $hidden = [
        'password',
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

    public function restaurante()
    {
        return $this->belongsTo(Restaurant::class);
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
        );
    }
}
