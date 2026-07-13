<?php

namespace Tests\Feature;

use App\Models\Rental;
use App\Models\Renter;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/dashboard/calendar')->assertUnauthorized();
        $this->getJson('/api/v1/dashboard/alerts')->assertUnauthorized();
        $this->getJson('/api/v1/dashboard/summary')->assertUnauthorized();
    }

    public function test_calendar_returns_vehicle_timeline_and_return_markers(): void
    {
        $this->travelTo('2026-06-16 12:00:00');
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = $this->createVehicle();
        $renter = $this->createRenter();
        Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-14',
            'end_date' => '2026-06-18',
            'status' => 'active',
            'total_price' => 300,
        ]);
        Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-19',
            'end_date' => '2026-06-21',
            'status' => 'cancelled',
            'total_price' => 200,
        ]);
        Vehicle::create([
            'license_plate' => 'SK-0000-ZZ',
            'model' => 'Retired vehicle',
            'type' => 'car',
            'status' => 'retired',
        ]);

        $this->getJson('/api/v1/dashboard/calendar?start_date=2026-06-16&end_date=2026-06-22')
            ->assertOk()
            ->assertJsonPath('data.start_date', '2026-06-16')
            ->assertJsonPath('data.end_date', '2026-06-22')
            ->assertJsonPath('data.vehicle_count', 1)
            ->assertJsonCount(7, 'data.days')
            ->assertJsonCount(1, 'data.vehicles.0.rentals')
            ->assertJsonPath('data.vehicles.0.rentals.0.visible_booking.start_date', '2026-06-16')
            ->assertJsonPath('data.vehicles.0.rentals.0.visible_booking.end_date', '2026-06-17')
            ->assertJsonPath('data.vehicles.0.rentals.0.visible_booking.starts_before_range', true)
            ->assertJsonPath('data.vehicles.0.rentals.0.return_marker.date', '2026-06-18');
    }

    public function test_calendar_rejects_ranges_longer_than_31_days(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum');

        $this->getJson('/api/v1/dashboard/calendar?start_date=2026-01-01&end_date=2026-03-01')
            ->assertUnprocessable()
            ->assertJsonPath('success', false);
    }

    public function test_alerts_identify_overdue_and_due_soon_items(): void
    {
        $this->travelTo('2026-06-16 12:00:00');
        $this->actingAs(User::factory()->create(), 'sanctum');
        $vehicle = $this->createVehicle();
        $vehicle->registrations()->create([
            'registration_number' => 'REG-1234',
            'start_date' => '2025-06-01',
            'expiry_date' => '2026-06-10',
        ]);
        $vehicle->services()->create([
            'service_date' => '2026-01-01',
            'current_mileage' => 87000,
            'next_service_date' => '2026-06-25',
        ]);

        $this->getJson('/api/v1/dashboard/alerts?days=30')
            ->assertOk()
            ->assertJsonPath('data.counts.total', 2)
            ->assertJsonPath('data.counts.overdue', 1)
            ->assertJsonPath('data.counts.due_soon', 1)
            ->assertJsonPath('data.alerts.0.type', 'registration')
            ->assertJsonPath('data.alerts.0.status', 'overdue')
            ->assertJsonPath('data.alerts.1.type', 'maintenance');
    }

    public function test_summary_returns_fleet_counts_and_upcoming_rentals(): void
    {
        $this->travelTo('2026-06-16 12:00:00');
        $this->actingAs(User::factory()->create(), 'sanctum');
        $rentedVehicle = $this->createVehicle();
        Vehicle::create([
            'license_plate' => 'SK-7788-KL',
            'model' => 'Renault Trafic',
            'type' => 'van',
        ]);
        $renter = $this->createRenter();
        $rental = Rental::create([
            'vehicle_id' => $rentedVehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-14',
            'end_date' => '2026-06-18',
            'status' => 'active',
            'total_price' => 300,
        ]);

        $this->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.week.start_date', '2026-06-15')
            ->assertJsonPath('data.week.end_date', '2026-06-21')
            ->assertJsonPath('data.vehicles.total', 2)
            ->assertJsonPath('data.vehicles.rented', 1)
            ->assertJsonPath('data.vehicles.available', 1)
            ->assertJsonPath('data.upcoming_rentals.0.id', $rental->id);
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
}
