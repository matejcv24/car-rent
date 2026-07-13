<?php

namespace App\Actions\Rentals;

use App\Models\Rental;
use App\Models\Renter;
use App\Models\Vehicle;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateRental
{
    public function handle(array $data): Rental
    {
        return DB::transaction(function () use ($data): Rental {
            $vehicle = Vehicle::query()->lockForUpdate()->findOrFail($data['vehicle_id']);

            $conflictingRentals = Rental::query()
                ->where('vehicle_id', $data['vehicle_id'])
                ->where('status', '!=', 'cancelled')
                ->whereDate('start_date', '<', $data['end_date'])
                ->whereDate('end_date', '>', $data['start_date'])
                ->orderBy('start_date')
                ->get(['start_date', 'end_date']);

            if ($conflictingRentals->isNotEmpty()) {
                $vehicleLabel = trim("{$vehicle->model} - {$vehicle->license_plate}");
                $bookedDates = $conflictingRentals
                    ->map(fn (Rental $rental): string => sprintf(
                        '%s to %s',
                        $this->formatDisplayDate($rental->start_date),
                        $this->formatDisplayDate($rental->end_date),
                    ))
                    ->join(', ');

                throw ValidationException::withMessages([
                    'vehicle_id' => ["{$vehicleLabel} can't be rented because it is already rented from {$bookedDates}."],
                ]);
            }

            $renterData = [
                'first_name' => trim((string) ($data['renter']['first_name'] ?? '')),
                'last_name' => trim((string) ($data['renter']['last_name'] ?? '')),
                'phone' => trim((string) ($data['renter']['phone'] ?? '')),
                'email' => trim((string) ($data['renter']['email'] ?? '')) ?: null,
            ];
            $renter = $renterData['email']
                ? Renter::query()->firstOrCreate(['email' => $renterData['email']], Arr::only($renterData, ['first_name', 'last_name', 'phone']))
                : Renter::query()->create($renterData);

            return $renter->rentals()->create(Arr::only($data, [
                'vehicle_id',
                'start_date',
                'end_date',
                'status',
                'payment_status',
                'total_price',
            ]));
        });
    }

    private function formatDisplayDate($date): string
    {
        return $date->format('d/m/Y');
    }
}
