import { useEffect, useMemo, useState } from 'react'
import { fetchPlayers, fetchAllAttendance, deletePlayerProfile } from '../../firebase/db'
import { getGroupColor } from '../../data/schedule'
import { PlayerDetailModal } from './PlayerDetailModal'
import { SeasonWellnessChart } from '../Analytics/SeasonWellnessChart'
import type { Player, AttendanceRecord, GroupKey } from '../../types'

const GROUPS: GroupKey[] = ['18U Boys', '17U Boys', '16U Boys']

interface WellnessEntry { sessionKey: string; record: AttendanceRecord }

interface PlayerStats {
  player: Player
  history: WellnessEntry[]
  avgPhysical: number
  avgMental:   number
  avgSleep:    number
  overallAvg:  number
  sessions:    number
}

function avg(vals: number[]) {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

function ScoreChip({ value }: { value: number }) {
  const formatted = value > 0 ? value.toFixed(1) : '—'
  const color = value === 0
    ? 'bg-white/5 text-gray-600'
    : value >= 4 ? 'bg-green-500/20 text-green-400'
    : value >= 3 ? 'bg-yellow-500/20 text-yellow-400'
    : 'bg-red-500/20 text-red-400'
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color}`}>{formatted}</span>
  )
}

function MiniTrend({ history }: { history: WellnessEntry[] }) {
  const last5 = history.filter(h => h.record.wellness).slice(-5)
  if (!last5.length) return <span className="text-xs text-gray-700">no data</span>
  return (
    <div className="flex gap-0.5 items-end h-5">
      {last5.map(({ sessionKey, record }) => {
        const w = record.wellness!
        const a = (w.physical + w.mental + w.sleep) / 3
        const h = Math.max(2, Math.round((a / 5) * 20))
        const color = a >= 4 ? 'bg-green-500' : a >= 3 ? 'bg-yellow-500' : 'bg-red-500'
        return <div key={sessionKey} className={`w-2 rounded-sm ${color}`} style={{ height: `${h}px` }} />
      })}
    </div>
  )
}

interface Props { isAdmin: boolean }

export function PlayerList({ isAdmin }: Props) {
  const [stats,      setStats]      = useState<PlayerStats[]>([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState<PlayerStats | null>(null)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState<GroupKey | 'all'>('all')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [showChart,  setShowChart]  = useState(false)

  useEffect(() => {
    Promise.all([fetchPlayers(), fetchAllAttendance()]).then(([players, allAtt]) => {
      // Build per-uid history from full attendance tree
      const historyByUid: Record<string, WellnessEntry[]> = {}
      for (const [sessionKey, records] of Object.entries(allAtt)) {
        for (const [uid, record] of Object.entries(records)) {
          historyByUid[uid] = historyByUid[uid] ?? []
          historyByUid[uid].push({ sessionKey, record })
        }
      }
      // Sort each player's history chronologically
      for (const uid in historyByUid) {
        historyByUid[uid].sort((a, b) => a.sessionKey.localeCompare(b.sessionKey))
      }

      const computed: PlayerStats[] = players
        .filter(p => p.role === 'player')
        .map(player => {
          const history = historyByUid[player.uid] ?? []
          const withW   = history.filter(h => h.record.wellness)
          const physicals = withW.map(h => h.record.wellness!.physical)
          const mentals   = withW.map(h => h.record.wellness!.mental)
          const sleeps    = withW.map(h => h.record.wellness!.sleep)
          const avgP = avg(physicals)
          const avgM = avg(mentals)
          const avgS = avg(sleeps)
          return {
            player,
            history,
            avgPhysical: avgP,
            avgMental:   avgM,
            avgSleep:    avgS,
            overallAvg:  withW.length ? avg([avgP, avgM, avgS]) : 0,
            sessions:    history.length,
          }
        })
        .sort((a, b) => (b.overallAvg || 0) - (a.overallAvg || 0))

      setStats(computed)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (uid: string) => {
    setDeleting(uid)
    await deletePlayerProfile(uid)
    setStats(prev => prev.filter(s => s.player.uid !== uid))
    setConfirmDel(null)
    setDeleting(null)
    if (selected?.player.uid === uid) setSelected(null)
  }

  const knownGroups = useMemo(() => {
    const set = new Set<GroupKey>(GROUPS)
    for (const s of stats) {
      if (s.player.group) set.add(s.player.group as GroupKey)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [stats])

  const filtered = stats.filter(s => {
    const matchGroup  = filter === 'all' || s.player.group === filter
    const matchSearch = !search || s.player.displayName.toLowerCase().includes(search.toLowerCase())
    return matchGroup && matchSearch
  })

  const grouped: Record<string, PlayerStats[]> = {}
  const groups = filter === 'all' ? knownGroups : [filter as GroupKey]
  for (const g of groups) {
    grouped[g] = filtered.filter(s => s.player.group === g)
  }
  const unassigned = filtered.filter(s => !s.player.group)

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-condensed text-3xl font-black">Players</h2>
          <p className="text-xs text-gray-500 mt-0.5">Click any player to see detailed wellness history</p>
        </div>
        <span className="text-sm text-gray-500">{stats.filter(s => s.player.role === 'player').length} registered</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search player…"
          className="flex-1 bg-bg2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent placeholder:text-gray-600"
        />
        <div className="flex gap-1 bg-bg2 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === 'all' ? 'bg-bg3 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            All
          </button>
          {knownGroups.map(g => {
            const c = getGroupColor(g)
            return (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === g ? `${c.bg} text-white` : 'text-gray-500 hover:text-white'}`}
              >
                {g.replace(' Boys', '')}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm text-center py-12">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">No players found.</p>
      ) : (
        <div className="space-y-8">
          {groups.map(g => {
            const list = grouped[g]
            if (!list?.length) return null
            const c = getGroupColor(g)
            const groupAvg = avg(list.filter(s => s.overallAvg > 0).map(s => s.overallAvg))
            return (
              <div key={g}>
                {/* Group header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-3 h-3 rounded-sm ${c.bg} flex-shrink-0`} />
                  <h3 className="font-condensed text-xl font-bold">{g}</h3>
                  <span className="text-sm text-gray-600">{list.length} players</span>
                  {groupAvg > 0 && (
                    <span className={`text-xs font-bold ml-auto ${
                      groupAvg >= 4 ? 'text-green-400' : groupAvg >= 3 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      group avg {groupAvg.toFixed(1)}/5
                    </span>
                  )}
                </div>

                {/* Column headers */}
                <div className={`grid ${isAdmin ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]'} sm:grid-none gap-x-3 px-3 mb-1 text-xs text-gray-600 font-medium`}>
                  <span>Player</span>
                  {/* Desktop-only columns */}
                  <span className="hidden sm:block text-center w-8">Phys</span>
                  <span className="hidden sm:block text-center w-8">Ment</span>
                  <span className="hidden sm:block text-center w-8">Sleep</span>
                  <span className="hidden sm:block text-center w-12">Trend</span>
                  <span className="text-center w-8">Avg</span>
                  {isAdmin && <span className="w-7" />}
                </div>

                <div className="space-y-1">
                  {list.map(s => (
                    <div
                      key={s.player.uid}
                      className="flex items-center bg-bg2 border border-white/7 rounded-xl px-3 py-2.5 hover:border-white/20 hover:bg-bg3 transition-all cursor-pointer gap-x-3"
                      onClick={() => setSelected(s)}
                    >
                      {/* Name — always visible */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {s.player.photoURL
                          ? <img src={s.player.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                          : <div className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                              {s.player.displayName[0]}
                            </div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{s.player.displayName}</p>
                          <p className="text-xs text-gray-600 truncate">
                            {s.player.position ?? ''}
                            {s.player.jersey ? ` #${s.player.jersey}` : ''}
                            {s.sessions > 0 ? ` · ${s.sessions}×` : ' · no sign-ins'}
                          </p>
                        </div>
                      </div>

                      {/* Desktop-only metric columns */}
                      <div className="hidden sm:flex w-8 justify-center flex-shrink-0"><ScoreChip value={s.avgPhysical} /></div>
                      <div className="hidden sm:flex w-8 justify-center flex-shrink-0"><ScoreChip value={s.avgMental} /></div>
                      <div className="hidden sm:flex w-8 justify-center flex-shrink-0"><ScoreChip value={s.avgSleep} /></div>
                      <div className="hidden sm:flex w-12 justify-center flex-shrink-0"><MiniTrend history={s.history} /></div>

                      {/* Avg — always visible */}
                      <div className="w-8 flex justify-center flex-shrink-0">
                        {s.overallAvg > 0
                          ? <span className={`text-sm font-black ${
                              s.overallAvg >= 4 ? 'text-green-400' : s.overallAvg >= 3 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{s.overallAvg.toFixed(1)}</span>
                          : <span className="text-xs text-gray-700">—</span>
                        }
                      </div>

                      {/* Delete — inside row, last column */}
                      {isAdmin && (
                        <div className="w-7 flex justify-center" onClick={e => e.stopPropagation()}>
                          {confirmDel === s.player.uid ? (
                            <div className="flex gap-1">
                              <button onClick={() => setConfirmDel(null)} className="px-1.5 py-1 text-xs rounded border border-white/10 text-gray-400 hover:text-white leading-none">✕</button>
                              <button onClick={() => handleDelete(s.player.uid)} disabled={deleting === s.player.uid} className="px-1.5 py-1 text-xs rounded bg-red-500 text-white font-bold hover:bg-red-400 disabled:opacity-50 leading-none">
                                {deleting === s.player.uid ? '…' : '✓'}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDel(s.player.uid)} className="w-6 h-6 rounded text-gray-700 hover:text-red-400 transition-colors text-sm flex items-center justify-center" title="Delete player">
                              🗑
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Unassigned */}
          {unassigned.length > 0 && (
            <div>
              <h3 className="font-condensed text-lg font-bold text-gray-600 mb-2">Pending assignment ({unassigned.length})</h3>
              <div className="space-y-1">
                {unassigned.map(s => (
                  <button
                    key={s.player.uid}
                    onClick={() => setSelected(s)}
                    className="w-full flex items-center gap-3 bg-bg2 border border-white/5 rounded-xl px-3 py-2.5 hover:border-white/15 transition-all text-left opacity-60 hover:opacity-100"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                      {s.player.displayName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{s.player.displayName}</p>
                      <p className="text-xs text-gray-600">{s.player.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Season fatigue curve — collapsible, below player list */}
      <div className="mt-8 border border-white/7 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowChart(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-bg2 hover:bg-bg3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">📈</span>
            <div className="text-left">
              <p className="text-sm font-semibold">Season Fatigue Curve</p>
              <p className="text-xs text-gray-500">Average wellness scores across all practices</p>
            </div>
          </div>
          <span className={`text-gray-500 text-sm transition-transform duration-200 ${showChart ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showChart && (
          <div className="border-t border-white/7">
            <SeasonWellnessChart />
          </div>
        )}
      </div>

      {selected && (
        <PlayerDetailModal
          player={selected.player}
          history={selected.history}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
