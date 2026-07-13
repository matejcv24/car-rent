<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    protected $signature = 'fleettrack:create-admin {email : The administrator email address}';

    protected $description = 'Create or promote the initial FleetTrack administrator';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $password = (string) $this->secret('Password (minimum 8 characters)');

        $validator = Validator::make(compact('email', 'password'), [
            'email' => ['required', 'email', 'max:100'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        User::query()->updateOrCreate(
            ['email' => $email],
            ['password' => $password, 'is_admin' => true],
        );

        $this->info('Administrator account is ready.');

        return self::SUCCESS;
    }
}
