<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public const STATUS_ABERTO = 'aberto';
    public const STATUS_FECHADO = 'fechado';
    public const STATUS_PENDENTE = 'pendente';
    public const STATUS_CANCELADO = 'cancelado';

    public const STATUSES = [
        self::STATUS_ABERTO,
        self::STATUS_FECHADO,
        self::STATUS_PENDENTE,
        self::STATUS_CANCELADO,
    ];

    public const PAYMENT_METHODS = ['dinheiro', 'pix', 'credito', 'debito', 'pendente'];

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
        'order_date' => 'date:Y-m-d',
        'closed_at' => 'datetime',
        'sales_point_id' => 'integer',
        'command_number' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function company()
    {
        return $this->belongsTo(PartnerCompany::class, 'partner_company_id');
    }

    public function scopeOfCompany($query, ?int $companyId)
    {
        return $query->where('partner_company_id', $companyId);
    }

    public function isEditable(): bool
    {
        return $this->status === self::STATUS_ABERTO;
    }

    /**
     * Recalcula o total a partir dos itens (preço unitário × quantidade).
     */
    public function recalculateTotal(): void
    {
        $total = $this->items()
            ->selectRaw('COALESCE(SUM(price * quantity), 0) as total')
            ->value('total');

        $this->update(['total' => $total ?? 0]);
    }
}
