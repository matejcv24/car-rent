<?php

namespace App\Actions\Dashboard;

use App\Models\Vehicle;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class GetAlerts
{
    public function handle(int $days): array
    {
        $today = CarbonImmutable::today();
        $deadline = $today->addDays($days);
        $vehicles = Vehicle::query()
            ->where('status', '!=', 'retired')
            ->with(['latestRegistration', 'latestService'])
            ->get();

        $alerts = new Collection;

        foreach ($vehicles as $vehicle) {
            if ($vehicle->latestRegistration) {
                $dueDate = CarbonImmutable::parse($vehicle->latestRegistration->expiry_date);
                if ($dueDate->lte($deadline)) {
                    $alerts->push($this->alert('registration', $vehicle, $dueDate, $today));
                }
            }

            if ($vehicle->latestService) {
                $dueDate = CarbonImmutable::parse($vehicle->latestService->next_service_date);
                if ($dueDate->lte($deadline)) {
                    $alerts->push($this->alert('maintenance', $vehicle, $dueDate, $today));
                }
            }
        }

        $alerts = $alerts->sortBy('due_date')->values();

        return [
            'window_days' => $days,
            'counts' => [
                'total' => $alerts->count(),
                'overdue' => $alerts->where('status', 'overdue')->count(),
                'due_soon' => $alerts->where('status', 'due_soon')->count(),
            ],
            'alerts' => $alerts,
        ];
    }

    private function alert(string $type, Vehicle $vehicle, CarbonImmutable $dueDate, CarbonImmutable $today): array
    {
        return [
            'type' => $type,
            'status' => $dueDate->lt($today) ? 'overdue' : 'due_soon',
            'due_date' => $dueDate->toDateString(),
            'days_remaining' => (int) $today->diffInDays($dueDate, false),
            'vehicle' => [
                'id' => $vehicle->id,
                'license_plate' => $vehicle->license_plate,
                'model' => $vehicle->model,
                'type' => $vehicle->type,
            ],
        ];
    }
}
