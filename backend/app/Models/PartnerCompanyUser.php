<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartnerCompanyUser extends Model
{
    protected $fillable = [
        'partner_company_id',
        'user_id',
        'role',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function company()
    {
        return $this->belongsTo(PartnerCompany::class, 'partner_company_id');
    }
}
