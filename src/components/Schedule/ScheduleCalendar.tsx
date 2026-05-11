import { SUMMER_SCHEDULE, GROUP_COLORS, type ScheduledSession } from '../../data/schedule'

interface Props {
  onSelectSession: (session: ScheduledSession) => void
  savedPlanDates: Set<string> // "2026-06-02_18U Boys" format
}

const MONTHS = [
  { year: 2026, month: 5,  label: 'June 2026' },
  { year: 2026, month: 6,  label: 'July 2026' },
  { year: 2026, month: 7,  label: 'August 2026' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  // Convert Sunday=0 to Mon-based: Mon=0..Sun=6
  const startOffset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function ScheduleCalendar({ onSelectSession, savedPlanDates }: Props) {
  const sessionsByDate = SUMMER_SCHEDULE.reduce<Record<string, ScheduledSession[]>>((acc, s) => {
    acc[s.date] = acc[s.date] ?? []
    acc[s.date].push(s)
    return acc
  }, {})

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-condensed text-3xl font-black">Summer 2026</h2>
          <p className="text-xs text-gray-500 mt-0.5">High Performance Training Schedule · Click a session to build its plan</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(GROUP_COLORS).map(([group, c]) => (
            <div key={group} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${c.bg}`} />
              <span className="text-gray-400">{group}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row — computed live from schedule data */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {(['18U Boys', '17U Boys', '16U Boys'] as const).map((group) => {
          const c = GROUP_COLORS[group]
          const groupSessions = SUMMER_SCHEDULE.filter(s => s.group === group)
          const sessions = groupSessions.length
          const hours = Math.round(groupSessions.reduce((sum, s) => sum + parseInt(s.duration) / 60, 0))
          const planned = groupSessions.filter(s => savedPlanDates.has(`${s.date}_${s.group}`)).length
          return (
            <div key={group} className="bg-bg2 border border-white/7 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-sm ${c.bg}`} />
                <span className="text-sm font-semibold">{group}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-condensed text-2xl font-black text-white">{sessions}</span>
                <span className="text-xs text-gray-500">sessions · {hours}h</span>
              </div>
              <div className="mt-2 h-1.5 bg-bg3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${c.bg}`}
                  style={{ width: sessions > 0 ? `${(planned / sessions) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{planned}/{sessions} plans ready</p>
            </div>
          )
        })}
      </div>

      {/* Months */}
      <div className="space-y-8">
        {MONTHS.map(({ year, month, label }) => {
          const cells = getCalendarDays(year, month)
          return (
            <div key={label}>
              <h3 className="font-condensed text-xl font-bold mb-3 text-accent">{label}</h3>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} />
                  const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
                  const sessions = sessionsByDate[dateStr] ?? []
                  const isToday = dateStr === today
                  const isWeekend = idx % 7 >= 5

                  return (
                    <div
                      key={idx}
                      className={`min-h-[72px] rounded-lg p-1.5 border transition-colors ${
                        isWeekend
                          ? 'bg-bg border-white/5 opacity-50'
                          : sessions.length > 0
                          ? 'bg-bg2 border-white/10 hover:border-white/20'
                          : 'bg-bg border-white/5'
                      } ${isToday ? 'ring-1 ring-accent' : ''}`}
                    >
                      <div className={`text-xs font-bold mb-1 ${
                        isToday ? 'text-accent' : isWeekend ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {sessions.map(s => {
                          const c = GROUP_COLORS[s.group]
                          const hasPlan = savedPlanDates.has(`${s.date}_${s.group}`)
                          return (
                            <button
                              key={s.id}
                              onClick={() => onSelectSession(s)}
                              className={`w-full text-left px-1.5 py-0.5 rounded text-white transition-all hover:opacity-80 hover:scale-105 ${c.bg} ${hasPlan ? 'ring-1 ring-white/40' : ''}`}
                              title={`${s.group} · ${s.facility} · ${s.time} · ${parseInt(s.duration)/60}h`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold leading-none truncate">
                                  {s.group.replace(' Boys', '')}
                                </span>
                                {hasPlan && (
                                  <span className="text-xs leading-none opacity-80">✓</span>
                                )}
                              </div>
                              <div className="text-xs opacity-75 leading-none mt-0.5 truncate">
                                {s.time} · {s.facility.replace('Mount Joy', 'MJ').replace('Coliseum', 'Col')}
                              </div>
                            </button>
                          )
                        })}
                        {isWeekend && (
                          <div className="text-xs text-gray-700 text-center mt-1">open gym</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-700 text-center mt-8 pb-4">
        Unity Volleyball · Summer 2026 · {SUMMER_SCHEDULE.length} training sessions · {Math.round(SUMMER_SCHEDULE.reduce((s, x) => s + parseInt(x.duration) / 60, 0))}h total
      </p>
    </div>
  )
}
