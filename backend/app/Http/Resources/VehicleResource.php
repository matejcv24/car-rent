<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'license_plate' => $this->license_plate,
            'model' => $this->model,
            'type' => $this->type,
            'status' => $this->status,
            'availability' => $this->when(
                isset($this->current_rentals_exists),
                $this->current_rentals_exists ? 'rented' : 'free',
            ),
            'registration' => $this->whenLoaded('latestRegistration', fn () => $this->latestRegistration ? [
                'registration_number' => $this->latestRegistration->registration_number,
                'start_date' => $this->latestRegistration->start_date->toDateString(),
                'expiry_date' => $this->latestRegistration->expiry_date->toDateString(),
            ] : null),
            'maintenance' => $this->whenLoaded('latestService', fn () => $this->latestService ? [
                'service_date' => $this->latestService->service_date->toDateString(),
                'next_service_date' => $this->latestService->next_service_date->toDateString(),
                'current_mileage' => $this->latestService->current_mileage,
                'notes' => $this->latestService->notes,
            ] : null),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
