<?php

namespace App\Http\Controllers;

use App\Actions\Rentals\CreateRental;
use App\Http\Requests\ListRentalsRequest;
use App\Http\Requests\StoreRentalRequest;
use App\Http\Requests\UpdateRentalRequest;
use App\Http\Resources\RentalResource;
use App\Models\Rental;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
        $rental->update($request->validated());

        return (new RentalResource($rental->refresh()->load(['vehicle', 'renter'])))
            ->additional(['success' => true]);
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
