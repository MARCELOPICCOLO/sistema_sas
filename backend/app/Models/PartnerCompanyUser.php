<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerCompanyUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_company_id',
        'user_id',
        'role',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];
}
