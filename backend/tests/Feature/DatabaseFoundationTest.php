<?php

namespace Tests\Feature;

use App\Models\Rental;
use App\Models\Renter;
use App\Models\Vehicle;
use App\Models\VehicleRegistration;
use App\Models\VehicleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_fleet_tables_have_the_required_columns(): void
    {
        $this->assertTrue(Schema::hasColumns('user_invitations', [
            'email', 'token', 'expires_at',
        ]));
        $this->assertTrue(Schema::hasColumns('vehicles', [
            'license_plate', 'model', 'status',
        ]));
        $this->assertTrue(Schema::hasColumns('renters', [
            'first_name', 'last_name', 'phone', 'email',
        ]));
        $this->assertTrue(Schema::hasColumns('rentals', [
            'vehicle_id', 'renter_id', 'start_date', 'end_date',
            'status', 'payment_status', 'total_price',
        ]));
        $this->assertTrue(Schema::hasColumns('vehicle_registrations', [
            'vehicle_id', 'registration_number', 'start_date', 'expiry_date',
        ]));
        $this->assertTrue(Schema::hasColumns('vehicle_services', [
            'vehicle_id', 'service_date', 'current_mileage', 'next_service_date', 'notes',
        ]));
    }

    public function test_fleet_models_expose_their_relationships(): void
    {
        $vehicle = Vehicle::create([
            'license_plate' => 'SK-1234-AB',
            'model' => 'VW Golf',
        ]);
        $renter = Renter::create([
            'first_name' => 'Aleksandar',
            'last_name' => 'Petrov',
            'phone' => '+38970123456',
            'email' => 'petrov@example.com',
        ]);
        $rental = Rental::create([
            'vehicle_id' => $vehicle->id,
            'renter_id' => $renter->id,
            'start_date' => '2026-06-19',
            'end_date' => '2026-06-21',
            'total_price' => 150,
        ]);
        VehicleRegistration::create([
            'vehicle_id' => $vehicle->id,
            'registration_number' => 'REG-001',
            'start_date' => '2026-01-01',
            'expiry_date' => '2027-01-01',
        ]);
        VehicleService::create([
            'vehicle_id' => $vehicle->id,
            'service_date' => '2026-05-01',
            'current_mileage' => 50000,
            'next_service_date' => '2026-11-01',
        ]);

        $this->assertTrue($vehicle->rentals->contains($rental));
        $this->assertTrue($renter->rentals->contains($rental));
        $this->assertTrue($rental->vehicle->is($vehicle));
        $this->assertTrue($rental->renter->is($renter));
        $this->assertCount(1, $vehicle->registrations);
        $this->assertCount(1, $vehicle->services);
    }
}
