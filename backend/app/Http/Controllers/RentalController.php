<?php

namespace App\Http\Controllers;

use App\Actions\Rentals\CreateRental;
use App\Http\Requests\ListRentalsRequest;
use App\Http\Requests\StoreRentalRequest;
use App\Http\Requests\UpdateRentalRequest;
use App\Http\Resources\RentalResource;
use App\Models\Rental;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RentalController extends Controller
{
    public function index(ListRentalsRequest $request): AnonymousResourceCollection
    {
        $limit = min(max($request->integer('limit', 15), 1), 100);

        $rentals = $this->rentalQuery($request)
            ->latest('start_date')
            ->paginate($limit)
            ->withQueryString();

        return RentalResource::collection($rentals)->additional(['success' => true]);
    }

    public function store(StoreRentalRequest $request, CreateRental $action): JsonResponse
    {
        $rental = $action->handle($request->validated());

        return (new RentalResource($rental->refresh()->load(['vehicle', 'renter'])))
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Rental $rental): RentalResource
    {
        return (new RentalResource($rental->load(['vehicle', 'renter'])))
            ->additional(['success' => true]);
    }

    public function update(UpdateRentalRequest $request, Rental $rental): RentalResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $rental): void {
            $vehicleId = $data['vehicle_id'] ?? $rental->vehicle_id;
            $startDate = $data['start_date'] ?? $rental->start_date->toDateString();
            $endDate = $data['end_date'] ?? $rental->end_date->toDateString();

            if (array_key_exists('vehicle_id', $data) || array_key_exists('start_date', $data) || array_key_exists('end_date', $data)) {
                $vehicle = Vehicle::query()->lockForUpdate()->findOrFail($vehicleId);

                $conflictingRentals = Rental::query()
                    ->whereKeyNot($rental->id)
                    ->where('vehicle_id', $vehicleId)
                    ->where('status', '!=', 'cancelled')
                    ->whereDate('start_date', '<', $endDate)
                    ->whereDate('end_date', '>', $startDate)
                    ->orderBy('start_date')
                    ->get(['start_date', 'end_date']);

                if ($conflictingRentals->isNotEmpty()) {
                    $vehicleLabel = trim("{$vehicle->model} - {$vehicle->license_plate}");
                    $bookedDates = $conflictingRentals
                        ->map(fn (Rental $conflict): string => sprintf(
                            '%s to %s',
                            $conflict->start_date->format('d/m/Y'),
                            $conflict->end_date->format('d/m/Y'),
                        ))
                        ->join(', ');

                    throw ValidationException::withMessages([
                        'vehicle_id' => ["{$vehicleLabel} can't be rented because it is already rented from {$bookedDates}."],
                    ]);
                }
            }

            if (array_key_exists('renter', $data)) {
                $rental->renter->update([
                    'first_name' => trim((string) ($data['renter']['first_name'] ?? '')),
                    'last_name' => trim((string) ($data['renter']['last_name'] ?? '')),
                    'phone' => trim((string) ($data['renter']['phone'] ?? '')),
                    'email' => trim((string) ($data['renter']['email'] ?? '')) ?: null,
                ]);
            }

            $rental->update(Arr::only($data, [
                'vehicle_id',
                'start_date',
                'end_date',
                'status',
                'payment_status',
                'total_price',
            ]));
        });

        return (new RentalResource($rental->refresh()->load(['vehicle', 'renter'])))
            ->additional(['success' => true]);
    }

    public function destroy(Rental $rental): Response
    {
        $rental->delete();

        return response()->noContent();
    }

    public function upcoming(Request $request): AnonymousResourceCollection
    {
        $limit = min(max($request->integer('limit', 5), 1), 50);

        $rentals = Rental::query()
            ->with(['vehicle', 'renter'])
            ->where('status', '!=', 'cancelled')
            ->whereDate('end_date', '>=', today())
            ->orderBy('start_date')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        return RentalResource::collection($rentals)->additional(['success' => true]);
    }

    private function rentalQuery(ListRentalsRequest $request): Builder
    {
        return Rental::query()
            ->with(['vehicle', 'renter'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('payment_status'), fn ($query) => $query->where('payment_status', $request->string('payment_status')->toString()))
            ->when($request->filled('vehicle_id'), fn ($query) => $query->where('vehicle_id', $request->integer('vehicle_id')))
            ->when($request->filled('start_date'), fn ($query) => $query->whereDate('end_date', '>=', $request->date('start_date')))
            ->when($request->filled('end_date'), fn ($query) => $query->whereDate('start_date', '<=', $request->date('end_date')))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = '%'.addcslashes($request->string('search')->toString(), '%_\\').'%';
                $query->whereHas('renter', function ($query) use ($search): void {
                    $query->where('first_name', 'like', $search)
                        ->orWhere('last_name', 'like', $search)
                        ->orWhere('email', 'like', $search)
                        ->orWhere('phone', 'like', $search);
                });
            });
    }
}
