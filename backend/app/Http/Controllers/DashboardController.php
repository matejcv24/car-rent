<?php

namespace App\Http\Controllers;

use App\Actions\Dashboard\GetAlerts;
use App\Actions\Dashboard\GetCalendar;
use App\Actions\Dashboard\GetSummary;
use App\Http\Requests\DashboardAlertsRequest;
use App\Http\Requests\DashboardCalendarRequest;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function calendar(DashboardCalendarRequest $request, GetCalendar $action): JsonResponse
    {
        $data = $action->handle(
            CarbonImmutable::parse($request->validated('start_date')),
            CarbonImmutable::parse($request->validated('end_date')),
        );

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function alerts(DashboardAlertsRequest $request, GetAlerts $action): JsonResponse
    {
        $data = $action->handle($request->integer('days', 30));

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function summary(Request $request, GetSummary $action): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $action->handle($request),
        ]);
    }
}
