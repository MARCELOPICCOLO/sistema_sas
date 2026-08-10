<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    // ✅ GARANTA QUE TODOS OS CAMPOS ESTEJAM AQUI
    protected $fillable = [
        'category_id',
        'name',
        'product_code',
        'description',
        'price',
        'quantity',      // ← CAMPO IMPORTANTE
        'active'
    ];

    // ✅ CASTS PARA TIPOS CORRETOS
    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',  // ← CAST PARA INTEGER
        'active' => 'boolean'
    ];

    // ✅ RELACIONAMENTOS
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // ✅ SCOPES ÚTEIS
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeByCode($query, $restaurantId, $code)
    {
        return $query->where('restaurant_id', $restaurantId)
            ->where('product_code', $code);
    }

    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
                ->orWhere('product_code', 'LIKE', "%{$term}%");
        });
    }
}
