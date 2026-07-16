<?php

namespace Tests\Feature;

use App\Models\Rental;
use App\Models\Renter;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_vehicle_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/vehicles')->assertUnauthorized();
        $this->postJson('/api/v1/vehicles', [])->assertUnauthorized();
    }

    public function test_authenticated_user_can_create_and_update_a_vehicle(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');

        $response = $this->postJson('/api/v1/vehicles', [
            'license_plate' => 'SK-1234-AB',
            'model' => 'VW Golf 1.6 TDI · 2021',
            'type' => 'car',
            'registration' => [
                'registration_number' => 'REG-1234',
                'start_date' => '2025-12-12',
                'expiry_date' => '2026-12-12',
            ],
            'service' => [
                'service_date' => '2026-03-15',
                'current_mileage' => 87400,
                'next_service_date' => '2026-09-15',
                'notes' => 'Oil and filters changed.',
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.license_plate', 'SK-1234-AB')
            ->assertJsonPath('data.type', 'car')
            ->assertJsonPath('data.availability', 'free')
            ->assertJsonPath('data.registration.expiry_date', '2026-12-12')
            ->assertJsonPath('data.maintenance.current_mileage', 87400);

        $vehicleId = $response->json('data.id');
        $this->putJson("/api/v1/vehicles/{$vehicleId}", [
            'model' => 'VW Golf 2.0 TDI · 2021',
            'status' => 'maintenance',
        ])->assertOk()
            ->assertJsonPath('data.model', 'VW Golf 2.0 TDI · 2021')
            ->assertJsonPath('data.status', 'maintenance');

        $this->assertDatabaseHas('vehicle_registrations', ['vehicle_id' => $vehicleId]);
        $this->assertDatabaseHas('vehicle_services', [
            'vehicle_id' => $vehicleId,
            'current_mileage' => 87400,
        ]);
    }

    public function test_vehicle_list_supports_filters_and_current_availability(): void
    {
        $this->travelTo('2026-06-21 12:00:00');
        $this->actingAs(User::factory()->create(), 'sanctum');

        $rentedCar = Vehicle::create([
            'license_plate' => 'SK-5678-CD',
            'model' => 'Toyota Yaris',
            'type' => 'car',
        ]);
        Vehicle::create([
            'license_plate' => 'SK-7788-KL',
            'model' => 'Renault Trafic',
            'type' => 'van',
        ]);
        $renter = Renter::create([
            'first_name' => 'Marko',
            'last_name' => 'Dimitrov',
            'phone' => '+38971123456',
            'email' => 'marko@example.com',
        ]);
        Rental::create([
            'vehicle_id' => $rentedCar->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-20',
            'end_date' => '2026-06-22',
            'status' => 'active',
            'total_price' => 100,
        ]);

        $this->getJson('/api/v1/vehicles?type=car&search=Yaris')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.license_plate', 'SK-5678-CD')
            ->assertJsonPath('data.0.availability', 'rented');
    }

    public function test_history_entries_can_be_added_and_returned(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = Vehicle::create([
            'license_plate' => 'SK-9012-EF',
            'model' => 'Skoda Fabia',
            'type' => 'car',
        ]);

        $this->postJson("/api/v1/vehicles/{$vehicle->id}/registrations", [
            'registration_number' => 'REG-9012',
            'start_date' => '2026-01-01',
            'expiry_date' => '2027-01-01',
        ])->assertCreated();

        $this->postJson("/api/v1/vehicles/{$vehicle->id}/services", [
            'service_date' => '2026-04-01',
            'current_mileage' => 112800,
            'next_service_date' => '2026-10-01',
        ])->assertCreated();

        $this->getJson("/api/v1/vehicles/{$vehicle->id}/history")
            ->assertOk()
            ->assertJsonCount(1, 'data.registrations')
            ->assertJsonCount(1, 'data.services');
    }

    public function test_active_vehicle_with_rental_history_cannot_be_deleted(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = Vehicle::create([
            'license_plate' => 'SK-3344-GH',
            'model' => 'Ford Transit',
            'type' => 'van',
        ]);
        $renter = Renter::create([
            'first_name' => 'Bojan',
            'last_name' => 'Stojkov',
            'phone' => '+38970111222',
            'email' => 'bojan@example.com',
        ]);
        Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
            'status' => 'completed',
            'total_price' => 250,
        ]);

        $this->deleteJson("/api/v1/vehicles/{$vehicle->id}")
            ->assertConflict()
            ->assertJsonPath('success', false);
    }

    public function test_inactive_vehicle_with_rental_history_can_be_deleted(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = Vehicle::create([
            'license_plate' => 'SK-3344-IJ',
            'model' => 'Ford Transit',
            'type' => 'van',
            'status' => 'retired',
        ]);
        $renter = Renter::create([
            'first_name' => 'Bojan',
            'last_name' => 'Stojkov',
            'phone' => '+38970111222',
            'email' => 'bojan@example.com',
        ]);
        $rental = Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
            'status' => 'completed',
            'total_price' => 250,
        ]);

        $this->deleteJson("/api/v1/vehicles/{$vehicle->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('vehicles', ['id' => $vehicle->id]);
        $this->assertDatabaseMissing('rentals', ['id' => $rental->id]);
    }

    public function test_vehicle_cannot_be_marked_inactive_with_active_or_upcoming_rentals(): void
    {
        $this->travelTo('2026-06-21 12:00:00');
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = Vehicle::create([
            'license_plate' => 'SK-4455-KL',
            'model' => 'Toyota Yaris',
            'type' => 'car',
        ]);
        $renter = Renter::create([
            'first_name' => 'Ana',
            'last_name' => 'Petrova',
            'phone' => '+38970111223',
            'email' => 'ana@example.com',
        ]);
        Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-23',
            'end_date' => '2026-06-25',
            'status' => 'pending',
            'total_price' => 250,
        ]);

        $this->putJson("/api/v1/vehicles/{$vehicle->id}", ['status' => 'retired'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.status.0', 'Cannot change the status of the vehicle to inactive beacuse it has active/upcoming rental');

        $this->assertDatabaseHas('vehicles', [
            'id' => $vehicle->id,
            'status' => 'active',
        ]);
    }

    public function test_vehicle_can_be_marked_inactive_when_rentals_are_past_or_cancelled(): void
    {
        $this->travelTo('2026-06-21 12:00:00');
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = Vehicle::create([
            'license_plate' => 'SK-5566-MN',
            'model' => 'Toyota Corolla',
            'type' => 'car',
        ]);
        $renter = Renter::create([
            'first_name' => 'Ana',
            'last_name' => 'Petrova',
            'phone' => '+38970111223',
            'email' => 'ana@example.com',
        ]);
        Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-12',
            'status' => 'completed',
            'total_price' => 250,
        ]);
        Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-23',
            'end_date' => '2026-06-25',
            'status' => 'cancelled',
            'total_price' => 250,
        ]);

        $this->putJson("/api/v1/vehicles/{$vehicle->id}", ['status' => 'retired'])
            ->assertOk()
            ->assertJsonPath('data.status', 'retired');
    }
}
