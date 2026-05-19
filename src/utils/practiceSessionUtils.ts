/** Local calendar date as YYYY-MM-DD (matches session.date format). */
export function localCalendarYmd(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Players may sign in for attendance only on the practice’s calendar day (local). */
export function canSignInOnPracticeDay(session: { date: string }): boolean {
  return session.date === localCalendarYmd()
}

/** Local midnight at the start of `yyyy-mm-dd`. */
export function startOfLocalDayFromYmd(ymd: string): Date {
  const [y, mo, d] = ymd.split('-').map(Number)
  return new Date(y, mo - 1, d, 0, 0, 0, 0)
}

/** Scheduled start instant for a session (`time` like `"19:00"`). */
export function getPracticeStartMs(session: { date: string; time: string }): number {
  const [y, mo, d] = session.date.split('-').map(Number)
  const timeParts = session.time.trim().split(':')
  const hh = Number.parseInt(timeParts[0] ?? '0', 10)
  const mm = Number.parseInt(timeParts[1] ?? '0', 10)
  return new Date(y, mo - 1, d, hh, mm, 0, 0).getTime()
}
