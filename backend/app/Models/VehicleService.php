<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleService extends Model
{
    protected $fillable = [
        'vehicle_id',
        'service_date',
        'current_mileage',
        'next_service_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'service_date' => 'date',
            'current_mileage' => 'integer',
            'next_service_date' => 'date',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
