import { useEffect, useState } from 'react'
import { fetchAttendance, removeAttendance, cancelSession, restoreSession, fetchAvailability } from '../../firebase/db'
import { getGroupColor, openFacilityDirections } from '../../data/schedule'
import type { ScheduledSession } from '../../data/schedule'
import type { AttendanceRecord, CancelledSession, AvailabilityRecord } from '../../types'
import type { User } from 'firebase/auth'
import type { Player } from '../../types'

interface Props {
  session: ScheduledSession
  hasPlan: boolean
  cancellation: CancelledSession | null
  canEditPlans: boolean
  currentUser: User | null
  currentPlayer: Player | null | undefined
  onOpenPlan: () => void
  onClose: () => void
  onCancellationChanged: () => void
}

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const SCORE_BG = ['','bg-red-500','bg-orange-500','bg-yellow-500','bg-lime-500','bg-green-500']

function avg(vals: number[]) {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

function scoreColor(v: number) {
  return v >= 4 ? 'text-green-400' : v >= 3 ? 'text-yellow-400' : v >= 2 ? 'text-orange-400' : 'text-red-400'
}

function AvgBar({ label, value }: { label: string; value: number }) {
  const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-bg3 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className={`text-sm font-black w-8 text-right ${scoreColor(value)}`}>{value.toFixed(1)}</span>
    </div>
  )
}

export function SessionWellnessModal({ session, hasPlan, cancellation, canEditPlans, currentUser, currentPlayer, onOpenPlan, onClose, onCancellationChanged }: Props) {
  const [records,       setRecords]       = useState<Record<string, AttendanceRecord>>({})
  const [availability,  setAvailability]  = useState<Record<string, AvailabilityRecord>>({})
  const [loading,       setLoading]       = useState(true)
  const [confirmRem,    setConfirmRem]    = useState<string | null>(null)
  const [removing,      setRemoving]      = useState<string | null>(null)
  const [cancelReason,  setCancelReason]  = useState('')
  const [showCancelBox, setShowCancelBox] = useState(false)
  const [cancelling,    setCancelling]    = useState(false)
  const [restoring,     setRestoring]     = useState(false)

  const handleRemove = async (uid: string) => {
    setRemoving(uid)
    await removeAttendance(sessionKey, uid)
    setRecords(prev => { const next = { ...prev }; delete next[uid]; return next })
    setConfirmRem(null)
    setRemoving(null)
  }

  const handleCancel = async () => {
    if (!currentUser || !currentPlayer) return
    setCancelling(true)
    await cancelSession(session, currentUser.uid, currentPlayer.displayName, cancelReason.trim() || undefined)
    setCancelling(false)
    setShowCancelBox(false)
    onCancellationChanged()
    onClose()
  }

  const handleRestore = async () => {
    setRestoring(true)
    await restoreSession(session.id)
    setRestoring(false)
    onCancellationChanged()
    onClose()
  }

  const sessionKey = `${session.date}_${session.group}`
  const c = getGroupColor(session.group)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchAttendance(sessionKey).catch(() => ({} as Record<string, AttendanceRecord>)),
      fetchAvailability(sessionKey).catch(() => ({} as Record<string, AvailabilityRecord>)),
    ]).then(([att, avail]) => {
      setRecords(att)
      setAvailability(avail)
      setLoading(false)
    })
  }, [sessionKey])

  const d = new Date(session.date + 'T12:00:00')
  const dateLabel = `${DAY[d.getDay()]} ${MONTH[d.getMonth()]} ${d.getDate()}`

  const entries = Object.entries(records).sort(([, a], [, b]) => a.signedAt - b.signedAt)
  const withW   = entries.filter(([, r]) => r.wellness)
  const physicals = withW.map(([, r]) => r.wellness!.physical)
  const mentals   = withW.map(([, r]) => r.wellness!.mental)
  const sleeps    = withW.map(([, r]) => r.wellness!.sleep)
  const avgPhys   = avg(physicals)
  const avgMent   = avg(mentals)
  const avgSlp    = avg(sleeps)
  const overall   = withW.length ? avg([avgPhys, avgMent, avgSlp]) : 0

  const concerns = withW.filter(([, r]) => r.wellness?.concerns)

  const loadLevel = overall === 0 ? null
    : overall >= 4   ? { label: 'Team is fresh', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: '💪' }
    : overall >= 3   ? { label: 'Normal load', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: '⚡' }
    : overall >= 2   ? { label: 'Consider reducing load', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: '⚠️' }
    :                  { label: 'HIGH FATIGUE — reduce intensity', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '🚨' }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg2 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className={`px-5 py-4 border-b border-white/7 flex items-start gap-3 rounded-t-2xl ${c.bg} bg-opacity-10`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${c.bg} flex-shrink-0`} />
              <h2 className="font-condensed text-xl font-black">{session.group}</h2>
            </div>
            <p className="text-sm text-gray-300">{dateLabel} · {session.time} · {parseInt(session.duration)/60}h</p>
            <button
              type="button"
              onClick={() => openFacilityDirections(session.facility)}
              className="text-xs text-gray-500 mt-0.5 hover:text-accent hover:underline inline-flex items-center gap-1"
            >
              📍 {session.facility}
            </button>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none mt-0.5">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin">

          {/* Cancellation banner */}
          {cancellation && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <span className="text-xl flex-shrink-0">🚫</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-red-400">Session Cancelled</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  By {cancellation.cancelledByName} · {new Date(cancellation.cancelledAt).toLocaleDateString()}
                </p>
                {cancellation.reason && (
                  <p className="text-xs text-gray-400 mt-1 italic">"{cancellation.reason}"</p>
                )}
              </div>
            </div>
          )}

          {/* Availability summary */}
          {(() => {
            const avEntries = Object.values(availability)
            if (avEntries.length === 0) return null
            const avail   = avEntries.filter(r => r.status === 'available').length
            const maybe   = avEntries.filter(r => r.status === 'maybe').length
            const unavail = avEntries.filter(r => r.status === 'unavailable').length
            const unavailList = Object.entries(availability).filter(([, r]) => r.status === 'unavailable')

            if (unavailList.length > 0) {
              return (
                <div className="bg-bg3 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Can&apos;t attend</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-sm font-bold text-red-400">
                      ❌ {unavail} player{unavail === 1 ? '' : 's'}
                    </span>
                    {(avail > 0 || maybe > 0) && (
                      <span className="text-[11px] text-gray-500">
                        (older Yes/Maybe: ✅ {avail} · ❓ {maybe})
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mt-1">
                    {unavailList.map(([uid, r]) => (
                      <div key={uid} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-red-400 flex-shrink-0">❌</span>
                        <span className="font-medium text-gray-300">{r.displayName}</span>
                        {r.reason && <span className="truncate italic text-gray-600">"{r.reason}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            if (avail > 0 || maybe > 0) {
              return (
                <div className="bg-bg3 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Earlier availability (legacy)</p>
                  <p className="text-xs text-gray-500">
                    ✅ {avail} · ❓ {maybe} <span className="text-gray-600">— players now only send &quot;can&apos;t attend&quot; with a reason.</span>
                  </p>
                </div>
              )
            }

            return null
          })()}

          {loading ? (
            <p className="text-gray-500 text-sm text-center py-6">Loading…</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-gray-600 text-sm">No players signed in yet for this session.</p>
              {Object.keys(availability).length === 0 && (
                <p className="text-xs text-gray-500 px-1 leading-relaxed max-w-xs mx-auto">
                  When players use <span className="text-gray-400">Can&apos;t make this practice?</span> on their home screen (reason + notify), it appears above.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Load recommendation banner */}
              {loadLevel && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${loadLevel.bg}`}>
                  <span className="text-xl">{loadLevel.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${loadLevel.color}`}>{loadLevel.label}</p>
                    {overall > 0 && (
                      <p className="text-xs text-gray-500">
                        Team avg readiness: <span className={`font-bold ${loadLevel.color}`}>{overall.toFixed(1)}/5</span>
                        {' '}· {withW.length}/{entries.length} wellness submitted
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Wellness averages */}
              {withW.length > 0 && (
                <div className="bg-bg3 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Team averages</p>
                  <AvgBar label="Physical"  value={avgPhys} />
                  <AvgBar label="Mental"    value={avgMent} />
                  <AvgBar label="Sleep"     value={avgSlp}  />
                </div>
              )}

              {/* Concerns */}
              {concerns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Player concerns</p>
                  <div className="space-y-1.5">
                    {concerns.map(([uid, r]) => (
                      <div key={uid} className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        {r.photoURL
                          ? <img src={r.photoURL} alt="" className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
                          : <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {r.displayName[0]}
                            </div>
                        }
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-amber-300">{r.displayName}</p>
                          <p className="text-xs text-gray-400 truncate">"{r.wellness!.concerns}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-player scores */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Players ({entries.length} signed in)
                </p>
                <div className="space-y-1">
                  {entries.map(([uid, r]) => {
                    const w = r.wellness
                    const rowAvg = w ? (w.physical + w.mental + w.sleep) / 3 : 0
                    const isConfirming = confirmRem === uid
                    return (
                      <div key={uid} className="flex items-center gap-2 bg-bg3 rounded-lg px-3 py-2">
                        {r.photoURL
                          ? <img src={r.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                          : <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {r.displayName[0]}
                            </div>
                        }
                        <span className="text-sm font-medium flex-1 truncate">{r.displayName}</span>
                        {w ? (
                          <>
                            <div className="flex items-center gap-1">
                              {(['physical','mental','sleep'] as const).map(k => (
                                <span key={k} className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold text-white ${SCORE_BG[w[k]]}`}>
                                  {w[k]}
                                </span>
                              ))}
                            </div>
                            <span className={`text-xs font-black w-7 text-right ${scoreColor(rowAvg)}`}>{rowAvg.toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-600">no wellness</span>
                        )}
                        {/* Remove from sign-in */}
                        {isConfirming ? (
                          <div className="flex gap-1 flex-shrink-0 ml-1">
                            <button
                              onClick={() => setConfirmRem(null)}
                              className="px-1.5 py-0.5 text-xs rounded border border-white/10 text-gray-400 hover:text-white leading-none"
                            >✕</button>
                            <button
                              onClick={() => handleRemove(uid)}
                              disabled={removing === uid}
                              className="px-1.5 py-0.5 text-xs rounded bg-red-500 text-white font-bold hover:bg-red-400 disabled:opacity-50 leading-none"
                            >{removing === uid ? '…' : 'Remove'}</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRem(uid)}
                            className="ml-1 flex-shrink-0 w-6 h-6 rounded text-gray-700 hover:text-red-400 transition-colors text-xs flex items-center justify-center"
                            title="Remove from sign-in"
                          >✕</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Cancel session confirm box */}
        {showCancelBox && (
          <div className="px-5 pb-3 space-y-2 border-t border-white/7 pt-3">
            <p className="text-xs text-gray-400">Reason for cancellation <span className="text-gray-600">(optional)</span></p>
            <input
              type="text"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. No permit, weather, rescheduled…"
              className="w-full bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 placeholder:text-gray-600"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCancelBox(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-white/7 flex gap-2 flex-shrink-0 flex-wrap">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-bg3 transition-all"
          >
            Close
          </button>
          {!cancellation && !showCancelBox && (
            <button
              onClick={() => { onClose(); onOpenPlan() }}
              className="flex-1 py-2 rounded-lg bg-accent text-black text-sm font-semibold hover:opacity-90 transition-all"
            >
              {hasPlan ? 'Open Plan ✓' : 'Build Plan'}
            </button>
          )}
          {canEditPlans && !showCancelBox && (
            cancellation ? (
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="flex-1 py-2 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
              >
                {restoring ? 'Restoring…' : '↩ Restore Session'}
              </button>
            ) : (
              <button
                onClick={() => setShowCancelBox(true)}
                className="py-2 px-3 rounded-lg border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-all"
              >
                🚫 Cancel session
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
