import type { Player, AttendanceRecord } from '../../types'
import { getGroupColor } from '../../data/schedule'

interface WellnessEntry {
  sessionKey: string
  record: AttendanceRecord
}

interface Props {
  player: Player
  history: WellnessEntry[]
  onClose: () => void
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const SCORE_BG    = ['','bg-red-500','bg-orange-500','bg-yellow-500','bg-lime-500','bg-green-500']

function scoreColor(v: number) {
  return v >= 4.5 ? 'text-green-400' : v >= 3.5 ? 'text-lime-400' : v >= 2.5 ? 'text-yellow-400' : v >= 1.5 ? 'text-orange-400' : 'text-red-400'
}

function avgOf(vals: number[]) {
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function MiniBar({ value, max = 5 }: { value: number; max?: number }) {
  const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex-1 h-1.5 bg-bg3 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}

export function PlayerDetailModal({ player, history, onClose }: Props) {
  const withWellness = history.filter(h => h.record.wellness)
  const physicals = withWellness.map(h => h.record.wellness!.physical)
  const mentals   = withWellness.map(h => h.record.wellness!.mental)
  const sleeps    = withWellness.map(h => h.record.wellness!.sleep)
  const avgPhys   = avgOf(physicals)
  const avgMent   = avgOf(mentals)
  const avgSlp    = avgOf(sleeps)
  const overallAvg = withWellness.length ? avgOf([avgPhys, avgMent, avgSlp]) : 0

  const groupColors = player.group ? getGroupColor(player.group) : { bg: 'bg-gray-600', text: 'text-white' }

  const concerns = withWellness.filter(h => h.record.wellness?.concerns)

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg2 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/7 flex-shrink-0">
          {player.photoURL
            ? <img src={player.photoURL} alt="" className="w-12 h-12 rounded-full" />
            : <div className={`w-12 h-12 rounded-full ${groupColors.bg} flex items-center justify-center font-bold text-lg text-white`}>
                {player.displayName[0]}
              </div>
          }
          <div className="flex-1 min-w-0">
            <h2 className="font-condensed text-xl font-black truncate">{player.displayName}</h2>
            <p className="text-xs text-gray-500">
              {player.group ?? 'No group'}
              {player.position ? ` · ${player.position}` : ''}
              {player.jersey   ? ` · #${player.jersey}`   : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-6">

          {withWellness.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No wellness data submitted yet.</p>
          ) : (
            <>
              {/* Season averages */}
              <div className="bg-bg3 rounded-xl p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Season averages</p>
                  <span className={`font-condensed text-2xl font-black ${scoreColor(overallAvg)}`}>
                    {overallAvg.toFixed(1)}<span className="text-sm text-gray-600">/5</span>
                  </span>
                </div>
                {[
                  { label: 'Physical', val: avgPhys, vals: physicals },
                  { label: 'Mental',   val: avgMent, vals: mentals   },
                  { label: 'Sleep',    val: avgSlp,  vals: sleeps    },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-gray-500 w-16">{label}</span>
                    <MiniBar value={val} />
                    <span className={`text-xs font-bold w-8 text-right ${scoreColor(val)}`}>{val.toFixed(1)}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-600 mt-2">{withWellness.length} sessions with wellness data · {history.length} total sign-ins</p>
              </div>

              {/* Trend chart (sparkline via colored dots) */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Wellness trend</p>
                <div className="overflow-x-auto">
                  <div className="flex gap-1.5 min-w-0 pb-2">
                    {withWellness.slice(-20).map(({ sessionKey, record }) => {
                      const w = record.wellness!
                      const rowAvg = (w.physical + w.mental + w.sleep) / 3
                      const [date] = sessionKey.split('_')
                      const d = new Date(date + 'T12:00:00')
                      return (
                        <div key={sessionKey} className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          <div
                            className={`w-5 h-8 rounded flex items-end justify-center pb-0.5 ${SCORE_BG[Math.round(rowAvg)]}`}
                            title={`${MONTH_SHORT[d.getMonth()]} ${d.getDate()} — Avg ${rowAvg.toFixed(1)}`}
                          >
                            <span className="text-xs text-white font-bold leading-none">{rowAvg.toFixed(0)}</span>
                          </div>
                          <span className="text-xs text-gray-700 leading-none">{d.getDate()}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Concerns log */}
              {concerns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Concerns log</p>
                  <div className="space-y-2">
                    {concerns.map(({ sessionKey, record }) => {
                      const [date] = sessionKey.split('_')
                      const d = new Date(date + 'T12:00:00')
                      return (
                        <div key={sessionKey} className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                          <p className="text-xs text-amber-400 font-semibold mb-0.5">
                            {DAY_SHORT[d.getDay()]} {MONTH_SHORT[d.getMonth()]} {d.getDate()}
                          </p>
                          <p className="text-xs text-gray-300">"{record.wellness!.concerns}"</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Session-by-session history */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Session history</p>
                <div className="space-y-1.5">
                  {withWellness.slice().reverse().map(({ sessionKey, record }) => {
                    const w = record.wellness!
                    const [date] = sessionKey.split('_')
                    const d = new Date(date + 'T12:00:00')
                    const rowAvg = (w.physical + w.mental + w.sleep) / 3
                    return (
                      <div key={sessionKey} className="flex items-center gap-3 bg-bg3 rounded-lg px-3 py-2">
                        <div className="w-14 flex-shrink-0">
                          <p className="text-xs text-gray-600 leading-none">{MONTH_SHORT[d.getMonth()]} {d.getDate()}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          {(['physical','mental','sleep'] as const).map(k => (
                            <span key={k} className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold text-white ${SCORE_BG[w[k]]}`}>
                              {w[k]}
                            </span>
                          ))}
                        </div>
                        <span className={`text-xs font-bold ${scoreColor(rowAvg)}`}>{rowAvg.toFixed(1)}</span>
                        {w.concerns && <span className="text-xs text-amber-400 truncate max-w-[80px]" title={w.concerns}>⚠</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
