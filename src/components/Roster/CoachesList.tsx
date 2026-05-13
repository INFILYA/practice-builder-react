import { useEffect, useState } from 'react'
import { fetchPlayers, setCanEditPlans, deletePlayerProfile, isAdminEmail } from '../../firebase/db'
import type { Player } from '../../types'

interface Props {
  currentUserUid: string
}

export function CoachesList({ currentUserUid }: Props) {
  const [coaches,     setCoaches]     = useState<Player[]>([])
  const [loading,     setLoading]     = useState(true)
  const [togglingUid, setTogglingUid] = useState<string | null>(null)
  const [removingUid, setRemovingUid] = useState<string | null>(null)
  const [confirmUid,  setConfirmUid]  = useState<string | null>(null)

  useEffect(() => {
    fetchPlayers().then(all => {
      setCoaches(all.filter(p => p.role === 'coach'))
      setLoading(false)
    })
  }, [])

  const handleToggleEdit = async (coach: Player) => {
    if (isAdminEmail(coach.email)) return
    setTogglingUid(coach.uid)
    const newVal = !coach.canEditPlans
    await setCanEditPlans(coach.uid, newVal)
    setCoaches(prev => prev.map(c => c.uid === coach.uid ? { ...c, canEditPlans: newVal } : c))
    setTogglingUid(null)
  }

  const handleRemove = async (uid: string) => {
    setRemovingUid(uid)
    await deletePlayerProfile(uid)
    setCoaches(prev => prev.filter(c => c.uid !== uid))
    setConfirmUid(null)
    setRemovingUid(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-condensed text-3xl font-black">Coaches</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage coach access — toggle plan editing rights or remove accounts
          </p>
        </div>
        <span className="text-sm text-gray-500">{coaches.length} coach{coaches.length !== 1 ? 'es' : ''}</span>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm text-center py-12">Loading…</p>
      ) : coaches.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">No coaches registered yet.</p>
      ) : (
        <div className="space-y-2">
          {coaches.map(coach => {
            const isAdmin   = isAdminEmail(coach.email)
            const isSelf    = coach.uid === currentUserUid
            const canEdit   = isAdmin || !!coach.canEditPlans
            const toggling  = togglingUid === coach.uid
            const removing  = removingUid === coach.uid
            const confirming = confirmUid === coach.uid

            return (
              <div
                key={coach.uid}
                className={`bg-bg2 border rounded-xl px-4 py-3 transition-all ${
                  isSelf ? 'border-accent/30' : 'border-white/7'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {coach.photoURL
                    ? <img src={coach.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent flex-shrink-0">
                        {coach.displayName[0]}
                      </div>
                  }

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{coach.displayName}</p>
                      {isSelf  && <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400">You</span>}
                      {isAdmin && <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-bold">Admin</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{coach.email}</p>
                  </div>

                  {/* Actions — disabled for self and for admin accounts */}
                  {!isSelf && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Edit plans toggle */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs hidden sm:block ${canEdit ? 'text-green-400' : 'text-gray-600'}`}>
                          {canEdit ? 'Can edit' : 'View only'}
                        </span>
                        <button
                          onClick={() => handleToggleEdit(coach)}
                          disabled={isAdmin || toggling}
                          title={isAdmin ? 'Admin always has full access' : canEdit ? 'Revoke edit access' : 'Grant edit access'}
                          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                            isAdmin ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                          } ${canEdit ? 'bg-green-500' : 'bg-white/15'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                            canEdit ? 'left-6' : 'left-1'
                          } ${toggling ? 'opacity-60' : ''}`} />
                        </button>
                      </div>

                      {/* Remove button */}
                      {!isAdmin && (
                        confirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setConfirmUid(null)}
                              className="px-2 py-1 rounded text-xs border border-white/10 text-gray-400 hover:text-white transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRemove(coach.uid)}
                              disabled={removing}
                              className="px-2 py-1 rounded text-xs bg-red-500 text-white font-medium hover:bg-red-400 transition-all disabled:opacity-50"
                            >
                              {removing ? '…' : 'Confirm'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmUid(coach.uid)}
                            className="px-2 py-1 rounded text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            Remove
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Role description row */}
                <div className="mt-2 ml-13 pl-0.5">
                  <p className="text-xs text-gray-600">
                    {isAdmin
                      ? 'Full admin access · can create, edit and delete any plan'
                      : canEdit
                      ? 'Can view all sessions, attendance, and edit practice plans'
                      : 'View only · can see sessions and attendance but cannot edit plans'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
