import { useEffect, useState } from 'react'
import { fetchAttendance } from '../../firebase/db'
import type { AttendanceRecord } from '../../types'

interface Props {
  sessionKey: string
  group: string
  date: string
}

const SCORE_BG = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']
const SCORE_LABEL = ['', '1', '2', '3', '4', '5']

function avg(vals: number[]) {
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function AvgBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-gray-500 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-bg3 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-6 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

export function AttendancePanel({ sessionKey, group, date }: Props) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchAttendance(sessionKey).then(data => {
      setAttendance(data)
      setLoading(false)
    })
  }, [sessionKey])

  const entries = Object.entries(attendance).sort(([, a], [, b]) => a.signedAt - b.signedAt)
  const count   = entries.length

  const wellnessEntries = entries.filter(([, r]) => r.wellness)
  const physicals = wellnessEntries.map(([, r]) => r.wellness!.physical)
  const mentals   = wellnessEntries.map(([, r]) => r.wellness!.mental)
  const sleeps    = wellnessEntries.map(([, r]) => r.wellness!.sleep)
  const avgPhys   = avg(physicals)
  const avgMent   = avg(mentals)
  const avgSlp    = avg(sleeps)
  const overallAvg = wellnessEntries.length
    ? avg([avgPhys, avgMent, avgSlp])
    : 0

  if (loading) return null
  if (count === 0) return (
    <div className="px-4 py-2 border-b border-white/7 bg-bg2 text-xs text-gray-600">
      No sign-ins yet · {group} · {date}
    </div>
  )

  const alertColor = overallAvg > 0
    ? overallAvg >= 4 ? 'text-green-400' : overallAvg >= 3 ? 'text-yellow-400' : 'text-red-400'
    : 'text-gray-400'

  return (
    <div className="border-b border-white/7 bg-bg2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-2 text-xs hover:bg-white/3 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        <span className="font-semibold text-green-400">{count} signed in</span>
        <span className="text-gray-600">{group} · {date}</span>
        {overallAvg > 0 && (
          <span className={`ml-1 font-bold ${alertColor}`}>
            avg wellness {overallAvg.toFixed(1)}/5
            {overallAvg < 3 && ' — LOAD CAUTION'}
          </span>
        )}
        <span className="ml-auto text-gray-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Group averages */}
          {wellnessEntries.length > 0 && (
            <div className="bg-bg3 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Group wellness averages ({wellnessEntries.length}/{count} submitted)
              </p>
              <AvgBar label="Physical" value={avgPhys} />
              <AvgBar label="Mental"   value={avgMent} />
              <AvgBar label="Sleep"    value={avgSlp}  />
            </div>
          )}

          {/* Per-player list */}
          <div className="space-y-2">
            {entries.map(([uid, rec]) => {
              const w = rec.wellness
              return (
                <div key={uid} className="flex items-start gap-2 bg-bg3 rounded-lg px-3 py-2">
                  {rec.photoURL
                    ? <img src={rec.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" />
                    : <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {rec.displayName[0]}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{rec.displayName}</p>
                    {w ? (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {/* Physical */}
                        <span className="text-xs text-gray-600">P</span>
                        <span className={`text-xs w-5 h-5 rounded flex items-center justify-center font-bold text-white ${SCORE_BG[w.physical]}`}>
                          {SCORE_LABEL[w.physical]}
                        </span>
                        {/* Mental */}
                        <span className="text-xs text-gray-600 ml-1">M</span>
                        <span className={`text-xs w-5 h-5 rounded flex items-center justify-center font-bold text-white ${SCORE_BG[w.mental]}`}>
                          {SCORE_LABEL[w.mental]}
                        </span>
                        {/* Sleep */}
                        <span className="text-xs text-gray-600 ml-1">S</span>
                        <span className={`text-xs w-5 h-5 rounded flex items-center justify-center font-bold text-white ${SCORE_BG[w.sleep]}`}>
                          {SCORE_LABEL[w.sleep]}
                        </span>
                        {w.concerns && (
                          <span className="text-xs text-amber-400 ml-1 truncate max-w-[120px]" title={w.concerns}>
                            ⚠ {w.concerns}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 mt-0.5">No wellness submitted</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
