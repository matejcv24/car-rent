<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle->id,
                'license_plate' => $this->vehicle->license_plate,
                'model' => $this->vehicle->model,
                'type' => $this->vehicle->type,
            ]),
            'renter' => $this->whenLoaded('renter', fn () => [
                'id' => $this->renter->id,
                'first_name' => $this->renter->first_name,
                'last_name' => $this->renter->last_name,
                'full_name' => trim("{$this->renter->first_name} {$this->renter->last_name}"),
                'phone' => $this->renter->phone,
                'email' => $this->renter->email,
            ]),
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'total_price' => $this->total_price,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
