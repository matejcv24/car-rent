<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'license_plate',
        'model',
        'type',
        'status',
    ];

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(VehicleRegistration::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(VehicleService::class);
    }

    public function latestRegistration(): HasOne
    {
        return $this->hasOne(VehicleRegistration::class)->latestOfMany();
    }

    public function latestService(): HasOne
    {
        return $this->hasOne(VehicleService::class)->latestOfMany();
    }

    public function currentRentals(): HasMany
    {
        return $this->rentals()
            ->whereIn('status', ['pending', 'active'])
            ->whereDate('start_date', '<=', today())
            ->whereDate('end_date', '>', today());
    }
}
