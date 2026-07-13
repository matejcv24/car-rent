import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api, { getApiMessage } from '../../../config/api.js'
import { addDays, startOfWeek, toDateString } from '../utils/dateUtils.js'

function buildDays(startDate, endDate) {
  const today = toDateString(new Date())
  const days = []

  for (let date = new Date(`${startDate}T00:00:00`); toDateString(date) <= endDate; date = addDays(date, 1)) {
    days.push({
      date: toDateString(date),
      day_name: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      day_number: date.getDate(),
      is_today: toDateString(date) === today,
    })
  }

  return days
}

function buildCalendarShell(range, previousCalendar) {
  return {
    start_date: range.start,
    end_date: range.end,
    vehicle_count: previousCalendar.vehicle_count,
    days: buildDays(range.start, range.end),
    vehicles: previousCalendar.vehicles.map((vehicle) => ({
      ...vehicle,
      rentals: [],
    })),
  }
}

export default function useDashboardData() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek())
  const [calendar, setCalendar] = useState(null)
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const calendarCache = useRef(new Map())

  const range = useMemo(() => ({
    start: toDateString(weekStart),
    end: toDateString(addDays(weekStart, 6)),
  }), [weekStart])

  const loadCalendar = useCallback(async (signal) => {
    setIsLoading(true)
    setError('')
    try {
      const calendarResponse = await api.get('/dashboard/calendar', { params: { start_date: range.start, end_date: range.end }, signal })
      const nextCalendar = calendarResponse.data.data
      calendarCache.current.set(`${range.start}:${range.end}`, nextCalendar)
      setCalendar(nextCalendar)
    } catch (requestError) {
      if (requestError.code !== 'ERR_CANCELED') {
        setError(getApiMessage(requestError, 'Unable to load the dashboard.'))
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [range.end, range.start])

  const loadSummary = useCallback(async (signal) => {
    try {
      const summaryResponse = await api.get('/dashboard/summary', { signal })
      setSummary(summaryResponse.data.data)
    } catch (requestError) {
      if (requestError.code !== 'ERR_CANCELED') {
        setError(getApiMessage(requestError, 'Unable to load the dashboard.'))
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const cacheKey = `${range.start}:${range.end}`
    const cachedCalendar = calendarCache.current.get(cacheKey)

    if (cachedCalendar) {
      setCalendar(cachedCalendar)
    } else {
      setCalendar((previousCalendar) => (
        previousCalendar ? buildCalendarShell(range, previousCalendar) : previousCalendar
      ))
    }

    const timer = window.setTimeout(() => loadCalendar(controller.signal), 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadCalendar, range])

  useEffect(() => {
    const controller = new AbortController()
    loadSummary(controller.signal)
    return () => controller.abort()
  }, [loadSummary])

  const retry = () => {
    loadCalendar()
    loadSummary()
  }

  return {
    calendar,
    summary,
    isLoading,
    error,
    range,
    previousWeek: () => setWeekStart((current) => addDays(current, -7)),
    nextWeek: () => setWeekStart((current) => addDays(current, 7)),
    currentWeek: () => setWeekStart(startOfWeek()),
    retry,
  }
}
