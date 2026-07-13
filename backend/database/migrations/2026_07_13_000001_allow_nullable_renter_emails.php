<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('renters', function (Blueprint $table): void {
            $table->string('email', 100)->nullable()->change();
        });

        DB::table('renters')->where('email', '')->update(['email' => null]);
    }

    public function down(): void
    {
        DB::table('renters')
            ->whereNull('email')
            ->orderBy('id')
            ->update(['email' => DB::raw("CONCAT('renter+', id, '@fleettrack.local')")]);

        Schema::table('renters', function (Blueprint $table): void {
            $table->string('email', 100)->nullable(false)->change();
        });
    }
};
