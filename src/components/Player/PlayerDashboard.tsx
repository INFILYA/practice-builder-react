import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { signInForSession, removeAttendance, fetchAttendance, fetchPlayerWellnessHistory, fetchAllPlans, setAvailability, removeAvailability, fetchAvailability, fetchDrillEdits, drillEditKey, fetchAllCustomDrillsForVideoLookup, fetchPracticeEmailReminder, savePracticeEmailReminder } from '../../firebase/db'
import type { SavedPlanWithKey, PlanBlock, Player, GroupKey, WellnessData, AttendanceRecord, CancelledSession } from '../../types'
import { openFacilityDirections, type ScheduledSession, getGroupColor } from '../../data/schedule'
import { canSignInOnPracticeDay } from '../../utils/practiceSessionUtils'
import { WellnessModal } from './WellnessModal'
import { ProfileEditModal } from '../Auth/ProfileEditModal'

interface Props {
  user: User
  player: Player
  sessions: ScheduledSession[]
  cancellations: Record<string, CancelledSession>
  onSignOut: () => void
  onProfileUpdated: () => void
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatSessionLabel(s: { date: string; facility: string; time: string; duration: string }) {
  const d = new Date(s.date + 'T12:00:00')
  return `${DAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()} · ${s.facility} · ${s.time} · ${parseInt(s.duration)/60}h`
}

function ScoreDot({ value, color }: { value: number; color: string }) {
  const opacity = ['', 'opacity-20', 'opacity-40', 'opacity-60', 'opacity-80', 'opacity-100']
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} ${opacity[value]}`} />
  )
}

function WellnessBadge({ w }: { w: WellnessData }) {
  const avg = Math.round((w.physical + w.mental + w.sleep) / 3)
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']
  const labels = ['', 'Low', 'Below avg', 'Okay', 'Good', 'Great']
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${colors[avg]}`}>
      {labels[avg]}
    </span>
  )
}

export function PlayerDashboard({ user, player, sessions, cancellations, onSignOut, onProfileUpdated }: Props) {
  const group = player.group as GroupKey | null
  const colors = group ? getGroupColor(group) : { bg: 'bg-gray-600', text: 'text-white' }

  const today = new Date().toISOString().split('T')[0]

  const mySessions = sessions
    .filter(s => s.group === group)
    .sort((a, b) => a.date.localeCompare(b.date))

  // Only the single next upcoming practice
  const nextSession = mySessions.find(s => s.date >= today) ?? null

  const [tab,             setTab]             = useState<'home' | 'schedule'>('home')
  const [showMenu,        setShowMenu]        = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [signedInKey,  setSignedInKey]  = useState<string | null>(null)
  const [myRecord,     setMyRecord]     = useState<AttendanceRecord | null>(null)
  const [showWellness, setShowWellness] = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [history,      setHistory]      = useState<Array<{ sessionKey: string; record: AttendanceRecord }>>([])
  const [showHistory,   setShowHistory]   = useState(false)
  const [sessionPlan,   setSessionPlan]   = useState<SavedPlanWithKey | null>(null)
  const [showPlan,      setShowPlan]      = useState(false)
  const [drillModal,    setDrillModal]    = useState<PlanBlock | null>(null)
  const [drillVideoLookup, setDrillVideoLookup] = useState<Record<string, string>>({})

  /** Video: `customDrills` (first row per mod:name wins) + legacy `drillEdits` overlay. */
  useEffect(() => {
    Promise.all([fetchAllCustomDrillsForVideoLookup(), fetchDrillEdits()])
      .then(([customList, edits]) => {
        const m: Record<string, string> = {}
        for (const d of customList) {
          const k = `${d.mod}:${d.name}`
          if (d.videoUrl && !m[k]) m[k] = d.videoUrl
        }
        for (const d of customList) {
          const key = drillEditKey(d.mod, d.name)
          const u = edits[key]?.videoUrl
          if (u) m[`${d.mod}:${d.name}`] = u
        }
        setDrillVideoLookup(m)
      })
      .catch(() => {})
  }, [])
  /** Only `unavailable` is used in the UI; legacy `available`/`maybe` from DB still load for migration. */
  const [myAvailability, setMyAvailability] = useState<'unavailable' | null>(null)
  const [unavailReason,  setUnavailReason]  = useState('')
  const [savingAvail,    setSavingAvail]    = useState(false)
  const [availError,     setAvailError]     = useState<string | null>(null)

  const [emailRemindersOn, setEmailRemindersOn] = useState(false)
  const [emailReminderSaving, setEmailReminderSaving] = useState(false)
  const [emailReminderError, setEmailReminderError] = useState<string | null>(null)

  const nextSessionKey = nextSession ? `${nextSession.date}_${nextSession.group}` : null
  const canSignInToday = !!(nextSession && canSignInOnPracticeDay(nextSession))
  const nextIsCancelled = nextSession ? !!cancellations[nextSession.id] : false
  const nextCancellation = nextSession ? (cancellations[nextSession.id] ?? null) : null

  const handleSubmitCantAttend = async () => {
    if (!nextSession || !nextSessionKey) return
    setAvailError(null)
    setSavingAvail(true)
    try {
      const trimmed = unavailReason.trim()
      await setAvailability(nextSessionKey, user.uid, {
        status:      'unavailable',
        displayName: player.displayName,
        photoURL:    player.photoURL,
        reason:      trimmed || undefined,
        updatedAt:   Date.now(),
      })
      setMyAvailability('unavailable')
    } catch (err) {
      console.error(err)
      setAvailError(err instanceof Error ? err.message : 'Could not save. Check your connection and try again.')
    } finally {
      setSavingAvail(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchPracticeEmailReminder(user.uid)
      .then(data => {
        if (!cancelled) setEmailRemindersOn(!!data?.enabled)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user.uid])

  const handleToggleEmailReminders = async (next: boolean) => {
    setEmailReminderError(null)
    setEmailReminderSaving(true)
    try {
      await savePracticeEmailReminder(user.uid, next)
      setEmailRemindersOn(next)
    } catch (err) {
      console.error(err)
      setEmailReminderError(err instanceof Error ? err.message : 'Could not save reminder preference.')
    } finally {
      setEmailReminderSaving(false)
    }
  }

  const handleClearAvailability = async () => {
    if (!nextSessionKey) return
    setAvailError(null)
    setSavingAvail(true)
    try {
      await removeAvailability(nextSessionKey, user.uid)
      setMyAvailability(null)
      setUnavailReason('')
    } catch (err) {
      console.error(err)
      setAvailError(err instanceof Error ? err.message : 'Could not clear. Try again.')
    } finally {
      setSavingAvail(false)
    }
  }

  // Fetch attendance, wellness history, and practice plan for next session
  useEffect(() => {
    if (!nextSession) {
      setLoading(false)
      return
    }
    setLoading(true)
    const key = `${nextSession.date}_${nextSession.group}`
    Promise.all([
      fetchAttendance(key),
      fetchPlayerWellnessHistory(user.uid),
      fetchAllPlans(),
      fetchAvailability(key),
    ]).then(([att, hist, plans, avail]) => {
      if (att[user.uid]) {
        setSignedInKey(key)
        setMyRecord(att[user.uid])
      }
      const ar = avail[user.uid]
      if (ar?.status === 'unavailable') {
        setMyAvailability('unavailable')
        setUnavailReason(ar.reason ?? '')
      } else {
        setMyAvailability(null)
        setUnavailReason('')
      }
      setHistory(hist)
      const plan = plans.find(p => p.date === nextSession.date && p.group === nextSession.group) ?? null
      setSessionPlan(plan)
      setLoading(false)
    })
  }, [nextSession?.date, nextSession?.group, user.uid])

  const handleSignInClick = () => {
    if (signedInKey) {
      // Already signed in — allow cancelling any day
      void handleCancel()
      return
    }
    if (!nextSession) return
    if (!canSignInOnPracticeDay(nextSession)) return
    setShowWellness(true)
  }

  const handleWellnessConfirm = async (wellness: WellnessData) => {
    if (!nextSession) return
    if (!canSignInOnPracticeDay(nextSession)) return
    const key = `${nextSession.date}_${nextSession.group}`
    const record: AttendanceRecord = {
      displayName: player.displayName,
      photoURL:    player.photoURL,
      signedAt:    Date.now(),
      present:     true,
      wellness,
    }
    await signInForSession(key, user.uid, record)
    setSignedInKey(key)
    setMyRecord(record)
    setShowWellness(false)
    // Refresh history
    const hist = await fetchPlayerWellnessHistory(user.uid)
    setHistory(hist)
  }

  const handleCancel = async () => {
    if (!nextSession || !signedInKey) return
    await removeAttendance(signedInKey, user.uid)
    setSignedInKey(null)
    setMyRecord(null)
  }

  const pastWithWellness = history.filter(h => h.record.wellness && h.sessionKey !== (nextSession ? `${nextSession.date}_${nextSession.group}` : ''))

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Top bar */}
      <header className="bg-bg2 border-b border-white/7 px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <span className="font-condensed text-xl font-black flex-shrink-0">
          Practice<span className="text-accent">Builder</span>
        </span>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-bg3/60 p-1 rounded-lg border border-white/7 ml-1 flex-shrink-0">
          <button
            onClick={() => setTab('home')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${tab === 'home' ? 'bg-accent text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            🏠 Home
          </button>
          <button
            onClick={() => setTab('schedule')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${tab === 'schedule' ? 'bg-accent text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            📅 Schedule
          </button>
        </div>

        <div className="flex-1" />

        {/* Avatar menu — tapping opens dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-white/10 hover:border-accent/60 transition-all overflow-hidden flex-shrink-0"
            title={player.displayName}
          >
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              : <div className={`w-full h-full ${colors.bg} flex items-center justify-center text-sm font-bold text-white`}>
                  {player.displayName[0]}
                </div>
            }
          </button>

          {/* Dropdown */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-50 bg-bg2 border border-white/10 rounded-xl shadow-2xl w-52 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/7">
                  <p className="text-sm font-semibold truncate">{player.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {group ?? 'No group'}{player.position ? ` · ${player.position}` : ''}{player.jersey ? ` · #${player.jersey}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => { setShowMenu(false); setShowEditProfile(true) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-bg3 transition-colors flex items-center gap-2"
                >
                  <span className="text-base">✎</span> Edit Profile
                </button>
                <button
                  onClick={() => { setShowMenu(false); onSignOut() }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-bg3 transition-colors flex items-center gap-2 border-t border-white/5"
                >
                  <span>↩</span> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 w-full max-w-lg mx-auto px-5 py-6 space-y-6" style={{ display: tab === 'schedule' ? 'none' : undefined }}>

        {/* Player card */}
        <div className={`rounded-xl p-4 border border-white/10 ${colors.bg} bg-opacity-10`}>
          <div className="flex items-center gap-3">
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" />
              : <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg">
                  {player.displayName[0]}
                </div>
            }
            <div>
              <p className="font-semibold text-white">{player.displayName}</p>
              <p className="text-sm text-gray-400">
                {group ?? 'No group assigned yet'}
                {player.position ? ` · ${player.position}` : ''}
                {player.jersey   ? ` · #${player.jersey}`   : ''}
              </p>
            </div>
          </div>
        </div>

        {!group ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-semibold mb-2">Waiting for group assignment</p>
            <p className="text-sm">The coach will assign you to a group soon.</p>
          </div>
        ) : loading ? (
          <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
        ) : (
          <>
            {/* Email reminder (RTDB + scheduled Cloud Function + Resend) */}
            <div className="rounded-xl border border-white/10 bg-bg2/80 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Email before practice</p>
                <p className="text-[10px] text-gray-600 leading-snug mt-0.5">
                  The <strong>day before</strong> your practice, around <strong>4:00 PM (16:00) Toronto</strong>, if your group has a session. Sent to <span className="text-gray-500">{player.email}</span>.
                </p>
                {emailReminderError && (
                  <p className="text-xs text-red-400 mt-1">{emailReminderError}</p>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailRemindersOn}
                aria-label="Email reminder day before practice at 4 PM Toronto"
                disabled={emailReminderSaving}
                onClick={() => void handleToggleEmailReminders(!emailRemindersOn)}
                className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                  emailRemindersOn ? 'bg-accent' : 'bg-white/15'
                } ${emailReminderSaving ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    emailRemindersOn ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Next practice card */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-3">Next Practice</h2>
              {!nextSession ? (
                <p className="text-gray-500 text-sm">No upcoming sessions scheduled.</p>
              ) : (
                <div className={`bg-bg2 border rounded-2xl p-5 transition-all ${
                  nextIsCancelled ? 'border-red-500/30' : signedInKey ? 'border-green-500/40' : 'border-white/10'
                }`}>
                  {/* Date + Facility */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-condensed text-3xl font-black leading-none">
                        {MONTH_SHORT[new Date(nextSession.date + 'T12:00:00').getMonth()]}{' '}
                        {new Date(nextSession.date + 'T12:00:00').getDate()}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {DAY_SHORT[new Date(nextSession.date + 'T12:00:00').getDay()]}
                        {' · '}{nextSession.time}
                        {' · '}{parseInt(nextSession.duration)/60}h
                      </p>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => openFacilityDirections(nextSession.facility)}
                        className="font-semibold text-white hover:text-accent hover:underline inline-flex items-center gap-1"
                      >
                        📍 {nextSession.facility}
                      </button>
                      <p className="text-xs text-gray-500">{nextSession.group}</p>
                    </div>
                  </div>

                  {/* Wellness summary (if already signed in) */}
                  {signedInKey && myRecord?.wellness && (
                    <div className="mb-4 bg-bg3 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your wellness check-in</p>
                      {[
                        { label: 'Physical', val: myRecord.wellness.physical },
                        { label: 'Mental',   val: myRecord.wellness.mental   },
                        { label: 'Sleep',    val: myRecord.wellness.sleep    },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16">{label}</span>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(n => (
                              <span key={n} className={`w-6 h-6 rounded-md text-xs flex items-center justify-center font-bold ${
                                n <= val
                                  ? n <= 2 ? 'bg-red-500 text-white' : n === 3 ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                                  : 'bg-white/5 text-gray-700'
                              }`}>{n}</span>
                            ))}
                          </div>
                          <WellnessBadge w={{ ...myRecord.wellness, physical: val as WellnessData['physical'], mental: val as WellnessData['mental'], sleep: val as WellnessData['sleep'] }} />
                        </div>
                      ))}
                      {myRecord.wellness.concerns && (
                        <p className="text-xs text-gray-400 italic pt-1 border-t border-white/5">"{myRecord.wellness.concerns}"</p>
                      )}
                    </div>
                  )}

                  {/* Cancelled banner */}
                  {nextIsCancelled && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">🚫</span>
                      <div>
                        <p className="text-sm font-bold text-red-400">This session has been cancelled</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          By {nextCancellation?.cancelledByName} · {nextCancellation ? new Date(nextCancellation.cancelledAt).toLocaleDateString() : ''}
                        </p>
                        {nextCancellation?.reason && (
                          <p className="text-xs text-gray-400 mt-1 italic">"{nextCancellation.reason}"</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Can't attend — single path: reason + submit (coaches see this under Schedule → tap practice) */}
                  {!nextIsCancelled && (
                    <div className="mb-4">
                      {myAvailability === 'unavailable' ? (
                        <div className="rounded-xl border border-red-500/35 bg-red-500/5 p-4 space-y-3">
                          <p className="text-sm font-semibold text-red-300">You told coaches you can&apos;t attend this practice.</p>
                          <label className="block text-xs text-gray-500 font-medium">Reason / details</label>
                          <textarea
                            value={unavailReason}
                            onChange={e => setUnavailReason(e.target.value)}
                            rows={3}
                            placeholder="e.g. sick, family trip, exam week…"
                            className="w-full bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 placeholder:text-gray-600 resize-y min-h-[72px]"
                          />
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              disabled={savingAvail}
                              onClick={() => void handleSubmitCantAttend()}
                              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-all disabled:opacity-50"
                            >
                              {savingAvail ? 'Saving…' : 'Update message'}
                            </button>
                            <button
                              type="button"
                              disabled={savingAvail}
                              onClick={() => void handleClearAvailability()}
                              className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm text-gray-300 hover:bg-white/5 transition-all disabled:opacity-50"
                            >
                              I&apos;m coming after all
                            </button>
                          </div>
                          {availError && <p className="text-xs text-red-400">{availError}</p>}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/10 bg-bg3/30 p-4 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Can&apos;t make this practice?</p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Add a short reason, then tap the button so your coaches see it on the schedule (same place as sign-ins).
                          </p>
                          <label className="block text-xs text-gray-500 font-medium">Reason</label>
                          <textarea
                            value={unavailReason}
                            onChange={e => setUnavailReason(e.target.value)}
                            rows={3}
                            placeholder="Required so coaches know what’s going on…"
                            className="w-full bg-bg2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent placeholder:text-gray-600 resize-y min-h-[72px]"
                          />
                          <button
                            type="button"
                            disabled={savingAvail || !unavailReason.trim()}
                            onClick={() => void handleSubmitCantAttend()}
                            className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {savingAvail ? 'Sending…' : "Notify coach — I can't attend"}
                          </button>
                          {availError && <p className="text-xs text-red-400">{availError}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sign in / cancel / reminders — hidden when session is cancelled */}
                  {!nextIsCancelled && (
                    signedInKey ? (
                      <button
                        type="button"
                        onClick={() => void handleSignInClick()}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                          'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                        }`}
                      >
                        ✓ Signed in — tap to cancel
                      </button>
                    ) : canSignInToday ? (
                      <button
                        type="button"
                        onClick={() => void handleSignInClick()}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${colors.bg} text-white hover:opacity-90`}
                      >
                        Sign in for this practice
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-500 text-center leading-relaxed px-1">
                          Wellness sign-in opens on the <span className="text-gray-300 font-semibold">same calendar day</span> as practice (today is not that day yet).
                        </p>
                      </div>
                    )
                  )}

                  {/* Practice plan */}
                  {sessionPlan && sessionPlan.blocks.length > 0 && (
                    <div className="mt-3 border-t border-white/7 pt-3">
                      <button
                        onClick={() => setShowPlan(v => !v)}
                        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <span>📋 Practice Plan ({sessionPlan.blocks.length} drills · {sessionPlan.blocks.reduce((s, b) => s + b.mins, 0)} min)</span>
                        <span>{showPlan ? '▲' : '▼'}</span>
                      </button>
                      {showPlan && (
                        <div className="mt-3 space-y-1.5">
                          {sessionPlan.blocks.map((block, i) => {
                            const modColors: Record<string, string> = {
                              WU: 'bg-blue-500/20 text-blue-300',
                              M1: 'bg-violet-500/20 text-violet-300',
                              M2: 'bg-amber-500/20 text-amber-300',
                              M3: 'bg-green-500/20 text-green-300',
                              GS: 'bg-pink-500/20 text-pink-300',
                              CD: 'bg-gray-500/20 text-gray-400',
                            }
                            return (
                              <button
                                key={block.id}
                                type="button"
                                onClick={() => setDrillModal(block)}
                                className="w-full flex items-center gap-2 bg-bg3 hover:bg-bg3/80 hover:border-white/10 border border-transparent rounded-lg px-3 py-2 transition-all text-left"
                              >
                                <span className="text-xs text-gray-600 w-4 flex-shrink-0">{i + 1}</span>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${modColors[block.mod] ?? 'bg-white/10 text-gray-400'}`}>
                                  {block.mod}
                                </span>
                                <span className="text-sm font-medium flex-1 truncate">{block.name}</span>
                                <span className="text-xs text-gray-500 flex-shrink-0">{block.mins} min</span>
                                <span className="text-xs text-gray-700 flex-shrink-0">ⓘ</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wellness history */}
            {pastWithWellness.length > 0 && (
              <div>
                <button
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-400 transition-colors w-full mb-3"
                >
                  <span>Wellness History ({pastWithWellness.length} sessions)</span>
                  <span className="ml-auto">{showHistory ? '▲' : '▼'}</span>
                </button>

                {showHistory && (
                  <div className="space-y-2">
                    {pastWithWellness.slice().reverse().map(({ sessionKey, record }) => {
                      const [date] = sessionKey.split('_')
                      const d = new Date(date + 'T12:00:00')
                      const w = record.wellness!
                      const avg = (w.physical + w.mental + w.sleep) / 3
                      return (
                        <div key={sessionKey} className="bg-bg2 border border-white/7 rounded-xl px-4 py-3 flex items-center gap-3">
                          <div className="text-center w-10">
                            <p className="text-xs text-gray-600">{MONTH_SHORT[d.getMonth()]}</p>
                            <p className="font-condensed text-xl font-black leading-none">{d.getDate()}</p>
                          </div>
                          <div className="flex gap-1.5 flex-1">
                            <ScoreDot value={w.physical} color="bg-blue-400"   />
                            <ScoreDot value={w.mental}   color="bg-violet-400" />
                            <ScoreDot value={w.sleep}    color="bg-amber-400"  />
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                            avg >= 4.5 ? 'bg-green-500' : avg >= 3.5 ? 'bg-lime-500' : avg >= 2.5 ? 'bg-yellow-500' : avg >= 1.5 ? 'bg-orange-500' : 'bg-red-500'
                          }`}>
                            {avg.toFixed(1)}
                          </span>
                          {w.concerns && (
                            <span className="text-xs text-gray-600 truncate max-w-[100px]" title={w.concerns}>
                              "{w.concerns}"
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Schedule tab ── */}
      {tab === 'schedule' && (
        <div className="flex-1 w-full max-w-lg mx-auto px-5 py-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-4">
            {group ? `${group} · Full Season Schedule` : 'Full Season Schedule'}
          </h2>

          {!group ? (
            <p className="text-gray-500 text-sm text-center py-12">Waiting for group assignment.</p>
          ) : (
            <div className="space-y-2">
              {mySessions.map(s => {
                const key = `${s.date}_${s.group}`
                const d = new Date(s.date + 'T12:00:00')
                const isPast = s.date < today
                const isNext = nextSession?.date === s.date && nextSession?.group === s.group
                const wasSignedIn = history.some(h => h.sessionKey === key)
                const isSignedInNow = signedInKey === key
                const isCancelled = !!cancellations[s.id]

                return (
                  <div
                    key={key}
                    className={`rounded-xl px-4 py-3 border transition-all ${
                      isCancelled
                        ? 'bg-red-900/10 border-red-500/20 opacity-70'
                        : isNext
                        ? 'bg-bg2 border-accent/40'
                        : isPast
                        ? 'bg-bg2/40 border-white/5 opacity-50'
                        : 'bg-bg2 border-white/7'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Date badge */}
                      <div className="text-center w-10 flex-shrink-0">
                        <p className="text-xs text-gray-600">{MONTH_SHORT[d.getMonth()]}</p>
                        <p className="font-condensed text-2xl font-black leading-none">{d.getDate()}</p>
                        <p className="text-xs text-gray-600">{DAY_SHORT[d.getDay()]}</p>
                      </div>

                      {/* Session info */}
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => openFacilityDirections(s.facility)}
                          className="text-sm font-semibold text-white hover:text-accent hover:underline inline-flex items-center gap-1"
                        >
                          📍 {s.facility}
                        </button>
                        <p className="text-xs text-gray-500">{s.time} · {parseInt(s.duration) / 60}h</p>
                      </div>

                      {/* Status badge */}
                      {isCancelled && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-red-500/20 text-red-400">Cancelled</span>
                      )}
                      {!isCancelled && isPast && wasSignedIn && (
                        <span className="text-xs font-semibold text-green-400 flex-shrink-0">✓ attended</span>
                      )}
                      {!isCancelled && isPast && !wasSignedIn && (
                        <span className="text-xs text-gray-700 flex-shrink-0">missed</span>
                      )}
                      {!isCancelled && isNext && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isSignedInNow ? 'bg-green-500/20 text-green-400' : 'bg-accent/20 text-accent'
                        }`}>
                          {isSignedInNow ? '✓ signed in' : 'next'}
                        </span>
                      )}
                      {!isCancelled && !isPast && !isNext && (
                        <span className="text-xs text-gray-700 flex-shrink-0">upcoming</span>
                      )}
                    </div>

                    {/* Next session actions (same as home tab) */}
                    {isNext && (
                      <div className="mt-3 pt-3 border-t border-white/7 space-y-2">
                        {isSignedInNow ? (
                          <button
                            type="button"
                            onClick={() => { setTab('home') }}
                            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all bg-green-500/15 text-green-400 border border-green-500/30"
                          >
                            ✓ Signed in — go to home
                          </button>
                        ) : canSignInOnPracticeDay(s) ? (
                          <button
                            type="button"
                            onClick={() => { setTab('home') }}
                            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${colors.bg} text-white hover:opacity-90`}
                          >
                            Sign in for this practice →
                          </button>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-1">Sign-in opens on practice day only.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Drill detail modal */}
      {drillModal && (() => {
        const modColors: Record<string, string> = {
          WU: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
          M1: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
          M2: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
          M3: 'bg-green-500/20 text-green-300 border-green-500/20',
          GS: 'bg-pink-500/20 text-pink-300 border-pink-500/20',
          CD: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
        }
        const videoUrl = drillModal.videoUrl ?? drillVideoLookup[`${drillModal.mod}:${drillModal.name}`]
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setDrillModal(null)}>
            <div
              className={`bg-bg2 border border-white/10 rounded-2xl w-full shadow-2xl overflow-hidden ${videoUrl ? 'max-w-xl' : 'max-w-md'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-white/7">
                <span className={`text-xs font-black px-2 py-1 rounded border ${modColors[drillModal.mod] ?? 'bg-white/10 text-gray-400 border-white/10'} flex-shrink-0 mt-0.5`}>
                  {drillModal.mod}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base leading-tight">{drillModal.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{drillModal.obj} · {drillModal.mins} min</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrillModal(null)}
                  className="text-gray-600 hover:text-white transition-colors text-xl leading-none flex-shrink-0 mt-0.5"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Video */}
                {videoUrl && (
                  <div className="rounded-xl overflow-hidden aspect-video bg-black">
                    <iframe
                      src={videoUrl.includes('youtube.com') ? `${videoUrl}?rel=0&modestbranding=1` : videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                      title={drillModal.name}
                    />
                  </div>
                )}

                {/* Description */}
                {drillModal.desc && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Description</p>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{drillModal.desc}</p>
                  </div>
                )}

                {/* Variations */}
                {drillModal.vars && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Variations</p>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{drillModal.vars}</p>
                  </div>
                )}

                {/* Coach notes */}
                {drillModal.notes && (
                  <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent/70 mb-1">Coach Notes</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{drillModal.notes}</p>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => setDrillModal(null)}
                  className="w-full py-2.5 rounded-xl bg-bg3 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Wellness modal */}
      {showWellness && nextSession && (
        <WellnessModal
          sessionLabel={formatSessionLabel(nextSession)}
          onConfirm={handleWellnessConfirm}
          onCancel={() => setShowWellness(false)}
        />
      )}

      {/* Profile edit modal */}
      {showEditProfile && (
        <ProfileEditModal
          user={user}
          player={player}
          onClose={() => setShowEditProfile(false)}
          onSaved={() => { setShowEditProfile(false); onProfileUpdated() }}
          onDeleted={() => { setShowEditProfile(false); onProfileUpdated() }}
        />
      )}
    </div>
  )
}
