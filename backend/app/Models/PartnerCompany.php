<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartnerCompany extends Model
{
    /**
     * Nome da tabela.
     */
    protected $table = 'partner_companies';

    /**
     * Campos que podem ser preenchidos em massa.
     */
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
}
