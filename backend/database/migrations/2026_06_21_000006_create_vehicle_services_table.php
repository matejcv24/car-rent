<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->date('service_date');
            $table->unsignedInteger('current_mileage');
            $table->date('next_service_date');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('next_service_date', 'idx_next_service');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_services');
    }
};
