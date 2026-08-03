<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

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
}
