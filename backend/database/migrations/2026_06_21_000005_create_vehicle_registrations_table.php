<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('registration_number', 50);
            $table->date('start_date');
            $table->date('expiry_date');
            $table->timestamps();
            $table->index('expiry_date', 'idx_registration_expiry');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_registrations');
    }
};
