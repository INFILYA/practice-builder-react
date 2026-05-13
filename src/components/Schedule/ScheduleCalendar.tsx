import { useEffect, useMemo, useState } from 'react'
import { getGroupColor, openFacilityDirections, type ScheduledSession, type GroupColorConfig } from '../../data/schedule'
import { fetchAttendance, fetchPlayers, fetchAvailability, deleteGroupAndSessions } from '../../firebase/db'
import { RosterModal } from '../Roster/RosterModal'
import { SessionWellnessModal } from './SessionWellnessModal'
import { AddGroupModal } from './AddGroupModal'
import type { GroupKey, CancelledSession, Player } from '../../types'
import type { User } from 'firebase/auth'

interface Props {
  sessions: ScheduledSession[]
  groupColors: Record<string, GroupColorConfig>
  cancellations: Record<string, CancelledSession>
  onSelectSession: (session: ScheduledSession) => void
  onDeleteSession: (session: ScheduledSession) => void
  onScheduleChanged: () => void
  savedPlanDates: Set<string>
  isCoach: boolean
  canEditPlans: boolean
  /** Add/remove age groups and their sessions (admin account only). */
  canManageAgeGroups: boolean
  currentUser: User | null
  currentPlayer: Player | null | undefined
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getMonthsFromSessions(sessions: ScheduledSession[]) {
  if (sessions.length === 0) return [
    { year: 2026, month: 5, label: 'June 2026' },
    { year: 2026, month: 6, label: 'July 2026' },
    { year: 2026, month: 7, label: 'August 2026' },
  ]
  const seen = new Set<string>()
  sessions.forEach(s => {
    const [y, m] = s.date.split('-').map(Number)
    seen.add(`${y}-${m - 1}`)
  })
  return Array.from(seen)
    .sort()
    .map(key => {
      const [year, month] = key.split('-').map(Number)
      return { year, month, label: `${MONTH_NAMES[month]} ${year}` }
    })
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function ScheduleCalendar({ sessions, groupColors, cancellations, onSelectSession, onDeleteSession, onScheduleChanged, savedPlanDates, isCoach, canEditPlans, canManageAgeGroups, currentUser, currentPlayer }: Props) {
  const [rosterGroup,      setRosterGroup]      = useState<GroupKey | null>(null)
  const [wellnessSession,  setWellnessSession]  = useState<ScheduledSession | null>(null)
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({})
  const [availTally,       setAvailTally]       = useState<Record<string, { y: number; m: number; n: number }>>({})
  const [groupSizes,       setGroupSizes]       = useState<Record<string, number>>({})
  const [showAddGroup,     setShowAddGroup]     = useState(false)
  const [availRefreshTick, setAvailRefreshTick] = useState(0)
  const [deletingGroup,    setDeletingGroup]    = useState<string | null>(null)
  /** Admin: which group card is expanded to show remove-from-schedule (inside the card). */
  const [groupCardExpanded, setGroupCardExpanded] = useState<string | null>(null)

  // Derive unique groups from sessions, preserve original order for first 3
  const allGroups = useMemo(() => {
    const seen = new Set<string>()
    const ordered = ['18U Boys', '17U Boys', '16U Boys']
    ordered.forEach(g => seen.add(g))
    sessions.forEach(s => seen.add(s.group))
    return Array.from(seen).filter(g => sessions.some(s => s.group === g))
  }, [sessions])

  const [activeGroups, setActiveGroups] = useState<Set<string>>(new Set(allGroups))

  // Keep activeGroups in sync when new groups are added
  useEffect(() => {
    setActiveGroups(prev => {
      const next = new Set(prev)
      allGroups.forEach(g => next.add(g))
      return next
    })
  }, [allGroups])

  const toggleGroup = (group: string) => {
    setActiveGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  const handleDeleteAgeGroup = async (group: string, sessionCount: number) => {
    if (!window.confirm(`Remove “${group}” and all ${sessionCount} scheduled sessions from the calendar? This cannot be undone.`)) return
    setDeletingGroup(group)
    try {
      await deleteGroupAndSessions(group)
      setGroupCardExpanded(prev => (prev === group ? null : prev))
      onScheduleChanged()
    } catch (e) {
      console.error(e)
      window.alert('Could not remove this group. Check your connection and that you are signed in as the schedule admin.')
    } finally {
      setDeletingGroup(null)
    }
  }

  const sessionsByDate = sessions.reduce<Record<string, ScheduledSession[]>>((acc, s) => {
    acc[s.date] = acc[s.date] ?? []
    acc[s.date].push(s)
    return acc
  }, {})

  const today = new Date().toISOString().split('T')[0]

  // Fetch attendance counts, pre-practice availability tallies, + group sizes (coach only)
  useEffect(() => {
    if (!isCoach) return
    const keys = sessions.map(s => `${s.date}_${s.group}`)
    Promise.all([
      Promise.all(keys.map(k => fetchAttendance(k).catch(() => ({} as Record<string, unknown>)))),
      Promise.all(keys.map(k => fetchAvailability(k).catch(() => ({} as Record<string, { status: string }>)))),
      fetchPlayers(),
    ]).then(([attResults, availResults, players]) => {
      const counts: Record<string, number> = {}
      keys.forEach((k, i) => { counts[k] = Object.keys(attResults[i] ?? {}).length })
      setAttendanceCounts(counts)

      const tally: Record<string, { y: number; m: number; n: number }> = {}
      keys.forEach((k, i) => {
        const vals = Object.values(availResults[i] ?? {})
        tally[k] = {
          y: vals.filter(r => r.status === 'available').length,
          m: vals.filter(r => r.status === 'maybe').length,
          n: vals.filter(r => r.status === 'unavailable').length,
        }
      })
      setAvailTally(tally)

      const sizes: Record<string, number> = {}
      for (const p of players) {
        if (p.role === 'player' && p.group) {
          sizes[p.group] = (sizes[p.group] ?? 0) + 1
        }
      }
      setGroupSizes(sizes)
    })
  }, [isCoach, sessions, availRefreshTick])

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 scrollbar-thin">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 sm:mb-6 gap-2">
        <div>
          <h2 className="font-condensed text-2xl sm:text-3xl font-black">Summer 2026</h2>
          <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
            High Performance Training Schedule · Coaches: tap a practice for sign-ins, can&apos;t-attend notices, and plans
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs flex-wrap justify-end">
            {allGroups.map(group => {
              const c = getGroupColor(group, groupColors)
              return (
                <div key={group} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm ${c.bg}`} />
                  <span className="text-gray-400">{group}</span>
                </div>
              )
            })}
          </div>
          {canManageAgeGroups && (
            <button
              onClick={() => setShowAddGroup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/20 transition-all flex-shrink-0"
              title="Add a new age group with its own schedule"
            >
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">Add group</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats row — clickable for coach to open roster */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-8">
        {allGroups.map((group) => {
          const c = getGroupColor(group, groupColors)
          const isActive = activeGroups.has(group)
          const groupSessions = sessions.filter(s => s.group === group)
          const sessionCount = groupSessions.length
          const hours    = Math.round(groupSessions.reduce((sum, s) => sum + parseInt(s.duration) / 60, 0))
          const planned  = groupSessions.filter(s => savedPlanDates.has(`${s.date}_${s.group}`)).length
          const totalSignIns = isCoach
            ? groupSessions.reduce((sum, s) => sum + (attendanceCounts[`${s.date}_${s.group}`] ?? 0), 0)
            : 0

          const busy = deletingGroup === group
          const showAdminPanel = canManageAgeGroups && sessionCount > 0 && groupCardExpanded === group
          const shellClass = `relative bg-bg2 border rounded-lg px-2.5 sm:px-4 py-2.5 sm:py-3 transition-all ${
            isActive ? 'border-white/7' : 'border-white/5 opacity-50'
          } ${
            showAdminPanel
              ? 'ring-1 ring-accent/25'
              : isCoach || (canManageAgeGroups && sessionCount > 0)
                ? 'cursor-pointer hover:border-white/20 hover:-translate-y-0.5'
                : ''
          }`

          const statsBlock = (
            <>
              <div className="flex items-center gap-1.5 mb-1 pr-5">
                <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm ${c.bg} flex-shrink-0`} />
                <span className="text-xs sm:text-sm font-semibold truncate">{group.replace(' Boys', '')}</span>
              </div>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="font-condensed text-xl sm:text-2xl font-black text-white">{sessionCount}</span>
                <span className="text-xs text-gray-500 hidden sm:block">sessions · {hours}h</span>
                <span className="text-xs text-gray-500 sm:hidden">{hours}h</span>
              </div>
              <div className="mt-1.5 sm:mt-2 h-1.5 bg-bg3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${c.bg}`}
                  style={{ width: sessionCount > 0 ? `${(planned / sessionCount) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 hidden sm:block">{planned}/{sessionCount} plans ready</p>
              {isCoach && (
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                  {groupSizes[group] ?? 0} players assigned
                  {totalSignIns > 0 && <span className="text-green-500"> · {totalSignIns} total sign-ins</span>}
                </p>
              )}
            </>
          )

          const filterBtn = (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleGroup(group) }}
              title={isActive ? `Hide ${group} on calendar` : `Show ${group} on calendar`}
              className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all z-10 ${
                isActive
                  ? `${c.bg} border-transparent text-white`
                  : 'bg-transparent border-white/20 text-gray-600 hover:border-white/40'
              }`}
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                {isActive
                  ? <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  : <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                }
              </svg>
            </button>
          )

          return (
            <div key={group} className="min-w-0">
              <div className={shellClass}>
                {filterBtn}
                {!canManageAgeGroups || sessionCount === 0 ? (
                  isCoach ? (
                    <button type="button" className="w-full text-left" onClick={() => setRosterGroup(group)}>
                      {statsBlock}
                    </button>
                  ) : (
                    <div>{statsBlock}</div>
                  )
                ) : showAdminPanel ? (
                  <div>
                    {statsBlock}
                    <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
                      {isCoach && (
                        <button
                          type="button"
                          className="block w-full text-left text-xs font-semibold text-accent hover:text-accent/80"
                          onClick={() => { setRosterGroup(group); setGroupCardExpanded(null) }}
                        >
                          View roster
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { void handleDeleteAgeGroup(group, sessionCount) }}
                        className="block w-full text-left text-[11px] sm:text-xs font-semibold text-red-400/90 hover:text-red-300 disabled:opacity-40"
                      >
                        {busy ? 'Removing…' : 'Remove group from schedule'}
                      </button>
                      <button
                        type="button"
                        className="text-[11px] text-gray-500 hover:text-gray-400"
                        onClick={() => setGroupCardExpanded(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setGroupCardExpanded(group)}
                  >
                    {statsBlock}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Months */}
      <div className="space-y-6 sm:space-y-8">
        {getMonthsFromSessions(sessions).map(({ year, month, label }) => {
          const cells = getCalendarDays(year, month)
          return (
            <div key={label}>
              <h3 className="font-condensed text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-accent">{label}</h3>
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">
                    <span className="hidden sm:inline">{d}</span>
                    <span className="sm:hidden">{d[0]}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} />
                  const dateStr  = `${year}-${pad(month + 1)}-${pad(day)}`
                  const sessions = (sessionsByDate[dateStr] ?? []).filter(s => activeGroups.has(s.group))
                  const isToday  = dateStr === today
                  const isWeekend = idx % 7 >= 5

                  return (
                    <div
                      key={idx}
                      className={`min-h-[60px] sm:min-h-[72px] rounded-lg p-1 sm:p-1.5 border transition-colors ${
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
                          const c           = getGroupColor(s.group, groupColors)
                          const hasPlan     = savedPlanDates.has(`${s.date}_${s.group}`)
                          const sigIns      = isCoach ? (attendanceCounts[`${s.date}_${s.group}`] ?? 0) : 0
                          const isCancelled = !!cancellations[s.id]

                          return (
                            <div key={s.id} className="group/pill relative">
                              <button
                                onClick={() => isCoach ? setWellnessSession(s) : onSelectSession(s)}
                                className={`w-full text-left px-1.5 py-0.5 rounded text-white transition-all hover:opacity-90 ${
                                  isCancelled ? 'bg-red-900/60 opacity-70' : `${c.bg} ${hasPlan ? 'ring-1 ring-white/50' : 'opacity-80'}`
                                }`}
                                title={isCancelled ? `CANCELLED — ${s.group}` : isCoach ? `Sign-ins, absentee notices & plan — ${s.group} · ${s.facility}` : hasPlan ? `Open plan — ${s.group} · ${s.facility}` : `Build plan — ${s.group} · ${s.facility}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-bold leading-none truncate ${isCancelled ? 'line-through opacity-60' : ''}`}>
                                    {s.group.replace(' Boys', '').replace(' Girls', '')}
                                  </span>
                                  {isCancelled
                                    ? <span className="text-xs leading-none text-red-300 font-bold">✕</span>
                                    : hasPlan && <span className="text-xs leading-none">✓</span>
                                  }
                                </div>
                                {isCancelled ? (
                                  <div className="text-xs text-red-300 leading-none mt-0.5 font-semibold">Cancelled</div>
                                ) : (
                                  <div className="text-xs leading-none mt-0.5 truncate">
                                    <span className="opacity-75">{s.time} · </span>
                                    <button
                                      type="button"
                                      onClick={e => { e.stopPropagation(); openFacilityDirections(s.facility) }}
                                      className="font-bold opacity-90 hover:opacity-100 hover:underline"
                                    >{s.facility}</button>
                                  </div>
                                )}
                                {isCoach && !isCancelled && (() => {
                                  const total = groupSizes[s.group] ?? 0
                                  if (!total && sigIns === 0) return null
                                  const pct = total > 0 ? Math.min(sigIns / total, 1) : 0
                                  const barColor = pct >= 0.75 ? 'bg-green-400' : pct >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                                  return (
                                    <div className="mt-1">
                                      <div className="text-xs text-white/70 leading-none mb-0.5">
                                        {sigIns}/{total > 0 ? total : '?'}
                                      </div>
                                      {total > 0 && (
                                        <div className="h-1 bg-black/30 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct * 100}%` }} />
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                                {isCoach && !isCancelled && (() => {
                                  const sk = `${s.date}_${s.group}`
                                  const t = availTally[sk]
                                  if (!t || t.n === 0) return null
                                  return (
                                    <div className="text-[10px] leading-tight mt-0.5 font-semibold text-red-200">
                                      ❌ {t.n} can&apos;t attend
                                    </div>
                                  )
                                })()}
                              </button>
                              {hasPlan && canEditPlans && !isCancelled && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDeleteSession(s) }}
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs font-bold leading-none items-center justify-center hidden group-hover/pill:flex hover:bg-red-400 transition-all z-10"
                                  title="Delete plan"
                                >×</button>
                              )}
                            </div>
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
        Summer 2026 · {sessions.length} sessions · {Math.round(sessions.reduce((s, x) => s + parseInt(x.duration) / 60, 0))}h total
      </p>

      {/* Roster modal */}
      {rosterGroup && (
        <RosterModal
          group={rosterGroup}
          assignableGroups={allGroups as GroupKey[]}
          onClose={() => setRosterGroup(null)}
        />
      )}

      {/* Session wellness modal */}
      {wellnessSession && (
        <SessionWellnessModal
          session={wellnessSession}
          hasPlan={savedPlanDates.has(`${wellnessSession.date}_${wellnessSession.group}`)}
          cancellation={cancellations[wellnessSession.id] ?? null}
          canEditPlans={canEditPlans}
          currentUser={currentUser}
          currentPlayer={currentPlayer}
          onOpenPlan={() => onSelectSession(wellnessSession)}
          onClose={() => { setWellnessSession(null); setAvailRefreshTick(t => t + 1) }}
          onCancellationChanged={onScheduleChanged}
        />
      )}

      {/* Add group modal */}
      {showAddGroup && (
        <AddGroupModal
          onClose={() => setShowAddGroup(false)}
          onSaved={() => { onScheduleChanged(); setShowAddGroup(false) }}
        />
      )}
    </div>
  )
}
