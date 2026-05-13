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
