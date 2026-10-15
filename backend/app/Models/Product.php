<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'product_code',
        'description',
        'price',
        'quantity',
        'active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Produtos cuja categoria pertence à empresa informada.
     */
    public function scopeOfCompany($query, ?int $companyId)
    {
        return $query->whereHas('category', fn ($q) => $q->where('partner_company_id', $companyId));
    }

    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
                ->orWhere('product_code', 'LIKE', "%{$term}%");
        });
    }
}
