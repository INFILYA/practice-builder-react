import { useEffect, useState } from 'react'
import { fetchPlayers, assignPlayerGroup } from '../../firebase/db'
import { getGroupColor } from '../../data/schedule'
import type { Player, GroupKey } from '../../types'

function calcAge(dob?: string): number | null {
  if (!dob) return null
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

interface Props {
  group: GroupKey
  assignableGroups?: GroupKey[]
  onClose: () => void
}

function mergeAssignableGroups(current: GroupKey, fromSchedule?: GroupKey[]): GroupKey[] {
  const legacy: GroupKey[] = ['18U Boys', '17U Boys', '16U Boys']
  const set = new Set<GroupKey>()
  for (const g of fromSchedule?.length ? fromSchedule : legacy) set.add(g)
  set.add(current)
  return Array.from(set)
}

export function RosterModal({ group, assignableGroups, onClose }: Props) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  const reload = async () => {
    setLoading(true)
    setPlayers(await fetchPlayers())
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const handleAssign = async (uid: string, newGroup: GroupKey | null) => {
    setAssigning(uid)
    await assignPlayerGroup(uid, newGroup)
    await reload()
    setAssigning(null)
  }

  const inGroup   = players.filter(p => p.group === group)
  const pending   = players.filter(p => !p.group && p.role === 'player')
  const colors    = getGroupColor(group)
  const moveTargets = mergeAssignableGroups(group, assignableGroups)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg2 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/7">
          <span className={`w-3 h-3 rounded-sm ${colors.bg}`} />
          <h2 className="font-condensed text-2xl font-black flex-1">{group} Roster</h2>
          <span className="text-sm text-gray-500">{inGroup.length} players</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none ml-2">×</button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <p className="text-gray-500 text-sm p-6">Loading…</p>
          ) : (
            <>
              {/* Players in this group */}
              {inGroup.length === 0 ? (
                <p className="text-gray-600 text-sm px-6 py-4">No players assigned yet.</p>
              ) : (
                <div className="p-4 space-y-2">
                  {inGroup.map(p => (
                    <PlayerRow
                      key={p.uid}
                      player={p}
                      assigning={assigning === p.uid}
                      currentGroup={group}
                      moveTargets={moveTargets}
                      onAssign={(g) => handleAssign(p.uid, g)}
                    />
                  ))}
                </div>
              )}

              {/* Pending players (no group) — direct assign to current group */}
              {pending.length > 0 && (
                <>
                  <div className="px-6 py-2 border-t border-white/7">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Pending assignment ({pending.length})</p>
                  </div>
                  <div className="px-4 pb-4 space-y-2">
                    {pending.map(p => {
                      const age = calcAge(p.dateOfBirth)
                      return (
                        <div key={p.uid} className="flex items-center gap-3 bg-bg3 rounded-lg px-3 py-2.5">
                          {p.photoURL
                            ? <img src={p.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                            : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                {p.displayName[0]}
                              </div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{p.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {[
                                p.position,
                                age !== null ? `Age ${age}` : null,
                                p.jersey ? `#${p.jersey}` : null,
                              ].filter(Boolean).join(' · ') || p.email}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAssign(p.uid, group)}
                            disabled={assigning === p.uid}
                            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all disabled:opacity-50 ${colors.bg} text-white hover:opacity-90`}
                          >
                            {assigning === p.uid ? '…' : `Add to ${group.replace(' Boys', '')}`}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerRow({
  player,
  assigning,
  currentGroup,
  moveTargets,
  onAssign,
}: {
  player: Player
  assigning: boolean
  currentGroup: GroupKey | null
  moveTargets: GroupKey[]
  onAssign: (g: GroupKey | null) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="flex items-center gap-3 bg-bg3 rounded-lg px-3 py-2.5">
      {player.photoURL
        ? <img src={player.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
        : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-bold">
            {player.displayName[0]}
          </div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{player.displayName}</p>
        <p className="text-xs text-gray-500 truncate">
          {[player.position, player.jersey ? `#${player.jersey}` : ''].filter(Boolean).join(' · ') || player.email}
        </p>
      </div>

      {/* Group assign dropdown */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowMenu(v => !v)}
          disabled={assigning}
          className="text-xs px-2.5 py-1 rounded-md border border-white/10 text-gray-400 hover:text-white hover:bg-bg2 transition-all disabled:opacity-50"
        >
          {assigning ? '…' : currentGroup ? 'Move' : 'Assign'}
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 bg-bg3 border border-white/10 rounded-lg py-1 z-10 min-w-[140px] shadow-xl">
            {moveTargets.map(g => (
              <button
                key={g}
                onClick={() => { onAssign(g); setShowMenu(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${
                  g === currentGroup ? 'text-accent font-semibold' : 'text-gray-300'
                }`}
              >
                {g}
              </button>
            ))}
            {currentGroup && (
              <button
                onClick={() => { onAssign(null); setShowMenu(false) }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-white/5 transition-colors border-t border-white/7 mt-1 pt-1"
              >
                Remove from group
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
