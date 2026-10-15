<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartnerCompany extends Model
{
    protected $table = 'partner_companies';

    protected $fillable = [
        'corporate_name',
        'trade_name',
        'document',
        'zip_code',
        'street',
        'number',
        'district',
        'city',
        'state',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'partner_company_users', 'partner_company_id', 'user_id')
            ->withPivot('role', 'active')
            ->withTimestamps();
    }
}
