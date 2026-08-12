<?php
// app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{

    protected $fillable = [
        'partner_company_id',
        'sales_point_id',
        'command_number',
        'order_date',
        'customer_name',
        'status',
        'total',
        'payment_method',
        'closed_at',
    ];



    protected $casts = [
        'total' => 'decimal:2',
        'order_date' => 'date',    // 👈 NOVO CAST
        'closed_at' => 'datetime'
    ];

    // Relacionamento com a mesa
    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    // ✅ RELACIONAMENTO COM OS ITENS (CORRIGIDO)
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    // Relacionamento com o restaurante
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    // Escopo para comandas abertas
    public function scopeOpen($query)
    {
        return $query->where('status', 'aberto');
    }

    // Escopo para comandas fechadas
    public function scopeClosed($query)
    {
        return $query->where('status', 'fechado');
    }
}
