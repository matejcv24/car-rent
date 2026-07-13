<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class DashboardCalendarRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $today = CarbonImmutable::today();

        $this->merge([
            'start_date' => $this->input('start_date', $today->startOfWeek()->toDateString()),
            'end_date' => $this->input('end_date', $today->endOfWeek()->toDateString()),
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
                function (string $attribute, mixed $value, Closure $fail): void {
                    try {
                        $start = CarbonImmutable::parse((string) $this->input('start_date'));
                        $end = CarbonImmutable::parse((string) $this->input('end_date'));
                    } catch (\Throwable) {
                        return;
                    }

                    if ($start->diffInDays($end) > 31) {
                        $fail('The calendar date range may not exceed 31 days.');
                    }
                },
            ],
        ];
    }
}
