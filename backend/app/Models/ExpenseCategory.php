<?php
// app/Models/ExpenseCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $table = 'expense_categories';

    protected $fillable = [
        'partner_company_id',
        'name',
        'icon',
        'color',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'expense_category_id');
    }
}
