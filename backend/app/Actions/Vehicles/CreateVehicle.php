<?php

namespace App\Actions\Vehicles;

use App\Models\Vehicle;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class CreateVehicle
{
    public function handle(array $data): Vehicle
    {
        return DB::transaction(function () use ($data): Vehicle {
            $vehicle = Vehicle::create(Arr::only($data, [
                'license_plate',
                'model',
                'type',
                'status',
            ]));

            if (isset($data['registration'])) {
                $vehicle->registrations()->create($data['registration']);
            }

            if (isset($data['service'])) {
                $vehicle->services()->create($data['service']);
            }

            return $vehicle;
        });
    }
}
