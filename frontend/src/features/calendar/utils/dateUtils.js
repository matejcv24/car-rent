export function parseDate(value) {
  return new Date(`${value}T00:00:00`)
}

export function toDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function startOfWeek(date = new Date()) {
  const start = new Date(date)
  const day = start.getDay()
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
  start.setHours(0, 0, 0, 0)
  return start
}

export function formatWeekLabel(startDate, endDate) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const startMonth = start.toLocaleDateString('en-GB', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-GB', { month: 'short' })

  return `Week of ${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`
}

export function formatShortDate(value) {
  return parseDate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

