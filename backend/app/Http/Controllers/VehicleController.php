<?php

namespace App\Http\Controllers;

use App\Actions\Vehicles\CreateVehicle;
use App\Http\Requests\StoreVehicleRegistrationRequest;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\StoreVehicleServiceRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class VehicleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $limit = min(max($request->integer('limit', 15), 1), 100);

        $vehicles = Vehicle::query()
            ->with(['latestRegistration', 'latestService'])
            ->withExists('currentRentals')
            ->when($request->filled('type'), fn ($query) => $query->where('type', $request->string('type')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = '%'.addcslashes($request->string('search')->toString(), '%_\\').'%';
                $query->where(function ($query) use ($search): void {
                    $query->where('license_plate', 'like', $search)
                        ->orWhere('model', 'like', $search);
                });
            })
            ->orderBy('type')
            ->orderBy('license_plate')
            ->paginate($limit)
            ->withQueryString();

        return VehicleResource::collection($vehicles)->additional(['success' => true]);
    }

    public function store(StoreVehicleRequest $request, CreateVehicle $action): JsonResponse
    {
        $vehicle = $action->handle($request->validated());

        return (new VehicleResource($this->loadCardData($vehicle)))
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Vehicle $vehicle): VehicleResource
    {
        return (new VehicleResource($this->loadCardData($vehicle)))
            ->additional(['success' => true]);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): VehicleResource
    {
        $data = $request->validated();

        if (($data['status'] ?? null) === 'retired' && $vehicle->status !== 'retired') {
            $hasCurrentOrUpcomingRentals = $vehicle->rentals()
                ->where('status', '!=', 'cancelled')
                ->whereDate('end_date', '>=', today())
                ->exists();

            if ($hasCurrentOrUpcomingRentals) {
                throw ValidationException::withMessages([
                    'status' => ['Cannot change the status of the vehicle to inactive beacuse it has active/upcoming rental'],
                ]);
            }
        }

        $vehicle->update($data);

        return (new VehicleResource($this->loadCardData($vehicle)))
            ->additional(['success' => true]);
    }

    public function destroy(Vehicle $vehicle): Response|JsonResponse
    {
        if ($vehicle->status !== 'retired' && $vehicle->rentals()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Active vehicles with rental history cannot be deleted.',
            ], 409);
        }

        $vehicle->delete();

        return response()->noContent();
    }

    public function history(Vehicle $vehicle): JsonResponse
    {
        $vehicle->load([
            'registrations' => fn ($query) => $query->latest('start_date'),
            'services' => fn ($query) => $query->latest('service_date'),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'registrations' => $vehicle->registrations,
                'services' => $vehicle->services,
            ],
        ]);
    }

    public function storeRegistration(
        StoreVehicleRegistrationRequest $request,
        Vehicle $vehicle,
    ): JsonResponse {
        $registration = $vehicle->registrations()->create($request->validated());

        return response()->json(['success' => true, 'data' => $registration], 201);
    }

    public function storeService(StoreVehicleServiceRequest $request, Vehicle $vehicle): JsonResponse
    {
        $service = $vehicle->services()->create($request->validated());

        return response()->json(['success' => true, 'data' => $service], 201);
    }

    private function loadCardData(Vehicle $vehicle): Vehicle
    {
        return $vehicle->refresh()
            ->load(['latestRegistration', 'latestService'])
            ->loadExists('currentRentals');
    }
}
