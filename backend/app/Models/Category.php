<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'partner_company_id',
        'name',
        'active'
    ];

    public function products()
    {
        return $this->hasMany(\App\Models\Product::class);
    }
}
