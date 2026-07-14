<?php

namespace App\Actions\Dashboard;

use App\Http\Resources\RentalResource;
use App\Models\Rental;
use App\Models\Vehicle;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

class GetSummary
{
    public function handle(Request $request): array
    {
        $today = CarbonImmutable::today();
        $vehicleQuery = Vehicle::query()->where('status', '!=', 'retired');
        $vehicleCount = (clone $vehicleQuery)->count();
        $rentedCount = (clone $vehicleQuery)->whereHas('currentRentals')->count();

        $activeRentals = Rental::query()
            ->with(['vehicle', 'renter'])
            ->where('status', '!=', 'cancelled')
            ->whereDate('end_date', '>=', $today)
            ->orderBy('start_date')
            ->orderBy('id')
            ->limit(4)
            ->get();

        return [
            'week' => [
                'start_date' => $today->startOfWeek()->toDateString(),
                'end_date' => $today->endOfWeek()->toDateString(),
            ],
            'vehicles' => [
                'total' => $vehicleCount,
                'rented' => $rentedCount,
                'available' => $vehicleCount - $rentedCount,
            ],
            'upcoming_rentals' => RentalResource::collection($activeRentals)->resolve($request),
        ];
    }
}
