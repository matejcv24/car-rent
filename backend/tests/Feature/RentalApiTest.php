<?php

namespace Tests\Feature;

use App\Models\Rental;
use App\Models\Renter;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_rental_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/rentals')->assertUnauthorized();
        $this->postJson('/api/v1/rentals', [])->assertUnauthorized();
    }

    public function test_rental_can_be_created_with_embedded_renter_details(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = $this->createVehicle();

        $response = $this->postJson('/api/v1/rentals', $this->rentalPayload($vehicle));

        $response->assertCreated()
            ->assertJsonPath('data.vehicle.license_plate', 'SK-1234-AB')
            ->assertJsonPath('data.renter.full_name', 'Aleksandar Petrov')
            ->assertJsonPath('data.payment_status', 'unpaid')
            ->assertJsonPath('data.total_price', '350.00');

        $this->assertDatabaseHas('renters', ['email' => 'petrov@example.com']);
        $this->assertDatabaseHas('rentals', [
            'vehicle_id' => $vehicle->id,
            'status' => 'pending',
        ]);
    }

    public function test_overlapping_rentals_are_rejected_but_same_day_turnaround_is_allowed(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = $this->createVehicle();

        $this->postJson('/api/v1/rentals', $this->rentalPayload($vehicle, [
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-15',
        ]))->assertCreated();

        $this->postJson('/api/v1/rentals', $this->rentalPayload($vehicle, [
            'start_date' => '2026-06-14',
            'end_date' => '2026-06-18',
            'renter.email' => 'overlap@example.com',
        ]))->assertUnprocessable()
            ->assertJsonPath('errors.vehicle_id.0', 'Vehicle allocation conflict detected.');

        $this->postJson('/api/v1/rentals', $this->rentalPayload($vehicle, [
            'start_date' => '2026-06-15',
            'end_date' => '2026-06-18',
            'renter.email' => 'turnaround@example.com',
        ]))->assertCreated();
    }

    public function test_rental_status_and_payment_status_can_be_updated(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $rental = $this->createRental();

        $this->putJson("/api/v1/rentals/{$rental->id}", [
            'status' => 'completed',
            'payment_status' => 'paid',
        ])->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.payment_status', 'paid');
    }

    public function test_rental_details_can_be_updated(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $rental = $this->createRental();
        $vehicle = Vehicle::create([
            'license_plate' => 'SK-5678-CD',
            'model' => 'Mercedes Vito',
            'type' => 'van',
        ]);

        $this->putJson("/api/v1/rentals/{$rental->id}", [
            'vehicle_id' => $vehicle->id,
            'start_date' => '2026-06-22',
            'end_date' => '2026-06-25',
            'payment_status' => 'paid',
            'total_price' => 420,
            'renter' => [
                'first_name' => 'Martin',
                'last_name' => '',
                'phone' => '070123456',
                'email' => 'martin@example.com',
            ],
        ])->assertOk()
            ->assertJsonPath('data.vehicle.id', $vehicle->id)
            ->assertJsonPath('data.renter.full_name', 'Martin')
            ->assertJsonPath('data.start_date', '2026-06-22')
            ->assertJsonPath('data.end_date', '2026-06-25')
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertDatabaseHas('renters', [
            'id' => $rental->renter_id,
            'first_name' => 'Martin',
            'phone' => '070123456',
        ]);
    }

    public function test_rental_can_be_deleted(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $rental = $this->createRental();

        $this->deleteJson("/api/v1/rentals/{$rental->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('rentals', [
            'id' => $rental->id,
        ]);
    }

    public function test_upcoming_rentals_include_ongoing_bookings_and_exclude_cancelled_ones(): void
    {
        $this->travelTo('2026-06-16 12:00:00');
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = $this->createVehicle();
        $renter = $this->createRenter();

        $ongoing = Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-14',
            'end_date' => '2026-06-18',
            'status' => 'active',
            'total_price' => 200,
        ]);
        Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-20',
            'end_date' => '2026-06-22',
            'status' => 'cancelled',
            'total_price' => 200,
        ]);

        $this->getJson('/api/v1/rentals/upcoming')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ongoing->id);
    }

    public function test_rentals_can_be_filtered_by_status_and_renter_search(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');
        $rental = $this->createRental();

        $this->getJson('/api/v1/rentals?status=pending&search=Petrov')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $rental->id);

        $this->getJson('/api/v1/rentals?status=completed')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    private function createVehicle(): Vehicle
    {
        return Vehicle::create([
            'license_plate' => 'SK-1234-AB',
            'model' => 'VW Golf',
            'type' => 'car',
        ]);
    }

    private function createRenter(): Renter
    {
        return Renter::create([
            'first_name' => 'Aleksandar',
            'last_name' => 'Petrov',
            'phone' => '+38970123456',
            'email' => 'petrov@example.com',
        ]);
    }

    private function createRental(): Rental
    {
        return Rental::create([
            'vehicle_id' => $this->createVehicle()->id,
            'renter_id' => $this->createRenter()->id,
            'start_date' => '2026-06-19',
            'end_date' => '2026-06-21',
            'total_price' => 350,
        ]);
    }

    private function rentalPayload(Vehicle $vehicle, array $overrides = []): array
    {
        $payload = [
            'vehicle_id' => $vehicle->id,
            'start_date' => '2026-06-19',
            'end_date' => '2026-06-21',
            'total_price' => 350,
            'renter' => [
                'first_name' => 'Aleksandar',
                'last_name' => 'Petrov',
                'phone' => '+38970123456',
                'email' => 'petrov@example.com',
            ],
        ];

        foreach ($overrides as $key => $value) {
            data_set($payload, $key, $value);
        }

        return $payload;
    }
}
