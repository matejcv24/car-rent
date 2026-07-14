<?php

namespace App\Actions\Dashboard;

use App\Models\Vehicle;
use Carbon\CarbonImmutable;

class GetCalendar
{
    public function handle(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $vehicles = Vehicle::query()
            ->where('status', '!=', 'retired')
            ->with(['rentals' => function ($query) use ($start, $end): void {
                $query->with('renter')
                    ->where('status', '!=', 'cancelled')
                    ->whereDate('start_date', '<=', $end)
                    ->whereDate('end_date', '>=', $start)
                    ->orderBy('start_date');
            }])
            ->orderBy('type')
            ->orderBy('license_plate')
            ->get();

        $days = [];
        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            $days[] = [
                'date' => $date->toDateString(),
                'day_name' => $date->format('D'),
                'day_number' => $date->day,
                'is_today' => $date->isToday(),
            ];
        }

        return [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'vehicle_count' => $vehicles->count(),
            'days' => $days,
            'vehicles' => $vehicles->map(function (Vehicle $vehicle) use ($start, $end): array {
                return [
                    'id' => $vehicle->id,
                    'license_plate' => $vehicle->license_plate,
                    'model' => $vehicle->model,
                    'type' => $vehicle->type,
                    'status' => $vehicle->status,
                    'rentals' => $vehicle->rentals->map(function ($rental) use ($start, $end): array {
                        $rentalStart = CarbonImmutable::parse($rental->start_date);
                        $rentalEnd = CarbonImmutable::parse($rental->end_date);
                        $bookingStart = $rentalStart->max($start);
                        $bookingEnd = $rentalEnd->subDay()->min($end);
                        $hasVisibleBooking = $bookingStart->lte($bookingEnd);
                        $hasReturnMarker = $rentalEnd->betweenIncluded($start, $end);

                        return [
                            'id' => $rental->id,
                            'renter' => [
                                'id' => $rental->renter->id,
                                'first_name' => $rental->renter->first_name,
                                'last_name' => $rental->renter->last_name,
                                'name' => trim("{$rental->renter->first_name} {$rental->renter->last_name}"),
                                'phone' => $rental->renter->phone,
                                'email' => $rental->renter->email,
                            ],
                            'start_date' => $rentalStart->toDateString(),
                            'end_date' => $rentalEnd->toDateString(),
                            'status' => $rental->status,
                            'payment_status' => $rental->payment_status,
                            'visible_booking' => $hasVisibleBooking ? [
                                'start_date' => $bookingStart->toDateString(),
                                'end_date' => $bookingEnd->toDateString(),
                                'starts_before_range' => $rentalStart->lt($start),
                                'continues_after_range' => $rentalEnd->gt($end->addDay()),
                            ] : null,
                            'return_marker' => $hasReturnMarker ? [
                                'date' => $rentalEnd->toDateString(),
                                'label' => 'Return',
                            ] : null,
                        ];
                    })->values(),
                ];
            })->values(),
        ];
    }
}
