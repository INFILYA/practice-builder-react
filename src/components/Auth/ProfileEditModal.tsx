import { useState } from 'react'
import type { User } from 'firebase/auth'
import { savePlayer, deletePlayerProfile, COACH_PASSWORD, PARENT_PASSWORD, isAdminEmail } from '../../firebase/db'
import type { Player } from '../../types'

interface Props {
  user: User
  player: Player
  onSaved: () => void
  onDeleted: () => void
  onClose: () => void
}

const POSITIONS = ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero', 'Defensive Specialist']

function initialRole(player: Player): Player['role'] {
  if (player.role === 'coach') return 'coach'
  if (player.role === 'parent') return 'parent'
  return 'player'
}

export function ProfileEditModal({ user, player, onSaved, onDeleted, onClose }: Props) {
  const isAdmin = isAdminEmail(user.email)

  const [displayName, setDisplayName] = useState(player.displayName)
  const [position,    setPosition]    = useState(player.position ?? '')
  const [jersey,      setJersey]      = useState(player.jersey != null ? String(player.jersey) : '')
  const [dob,         setDob]         = useState(player.dateOfBirth ?? '')
  const [selectedRole, setSelectedRole] = useState<Player['role']>(initialRole(player))
  const [coachPwd,    setCoachPwd]    = useState('')
  const [parentPwd,   setParentPwd]   = useState('')
  const [pwdError,    setPwdError]    = useState<'coach' | 'parent' | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [saveError,   setSaveError]   = useState('')

  const nextRole: Player['role'] = isAdmin ? 'coach' : selectedRole
  const showPlayerFields = !isAdmin && nextRole === 'player'

  const handleSave = async () => {
    setPwdError(null)
    setSaveError('')

    if (!isAdmin && nextRole === 'coach' && player.role !== 'coach') {
      if (coachPwd.trim() !== COACH_PASSWORD) {
        setPwdError('coach')
        return
      }
    }

    if (!isAdmin && nextRole === 'parent' && player.role !== 'parent') {
      if (parentPwd.trim() !== PARENT_PASSWORD) {
        setPwdError('parent')
        return
      }
    }

    if (showPlayerFields && !position.trim()) {
      setSaveError('Please choose your position.')
      return
    }

    setSaving(true)
    try {
      const digits = jersey.replace(/\D/g, '')
      const jerseyNum = digits ? parseInt(digits, 10) : undefined
      let canEditPlans = player.canEditPlans
      if (!isAdmin) {
        if (nextRole === 'player' || nextRole === 'parent') {
          canEditPlans = false
        } else {
          canEditPlans = player.role === 'coach' ? (player.canEditPlans ?? false) : false
        }
      }
      const updated: Player = {
        ...player,
        displayName: displayName.trim() || player.displayName,
        role:        nextRole,
        position:    nextRole === 'player' ? (position.trim() || undefined) : undefined,
        jersey:      nextRole === 'player' ? (Number.isFinite(jerseyNum) ? jerseyNum : undefined) : undefined,
        dateOfBirth: nextRole === 'player' ? (dob || undefined) : undefined,
        canEditPlans,
      }
      await savePlayer(updated)
      onSaved()
    } catch (err) {
      console.error(err)
      setSaveError('Could not save — try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deletePlayerProfile(user.uid)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg2 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/7">
          {user.photoURL
            ? <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
            : <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">
                {player.displayName[0]}
              </div>
          }
          <div className="flex-1 min-w-0">
            <h2 className="font-condensed text-xl font-black">Edit profile</h2>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold flex-shrink-0">Admin</span>
          )}
          {player.role === 'parent' && !isAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-400 text-xs font-bold flex-shrink-0">Parent</span>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none ml-2">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Display name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
          </div>

          {/* Role — hidden for admin (always coach) */}
          {!isAdmin && (
            <div className="bg-bg3 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Role</p>
              <div className="flex gap-2">
                {(['player', 'parent', 'coach'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role)
                      setCoachPwd('')
                      setParentPwd('')
                      setPwdError(null)
                      setSaveError('')
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border capitalize ${
                      selectedRole === role ? 'bg-accent text-black border-accent' : 'border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {nextRole === 'coach' && player.role !== 'coach' && (
                <div className="mt-3">
                  <label className="block text-xs text-gray-400 mb-1">Coach access code</label>
                  <input
                    type="password"
                    value={coachPwd}
                    onChange={e => { setCoachPwd(e.target.value); setPwdError(null) }}
                    placeholder="Enter code provided by your coach"
                    className={`w-full bg-bg2 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${
                      pwdError === 'coach' ? 'border-red-500' : 'border-white/10 focus:border-accent'
                    }`}
                  />
                  {pwdError === 'coach' && <p className="text-xs text-red-400 mt-1">Incorrect access code</p>}
                </div>
              )}

              {nextRole === 'parent' && player.role !== 'parent' && (
                <div className="mt-3">
                  <label className="block text-xs text-gray-400 mb-1">Parent access code</label>
                  <input
                    type="password"
                    value={parentPwd}
                    onChange={e => { setParentPwd(e.target.value); setPwdError(null) }}
                    placeholder="Enter parent code"
                    className={`w-full bg-bg2 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${
                      pwdError === 'parent' ? 'border-red-500' : 'border-white/10 focus:border-accent'
                    }`}
                  />
                  {pwdError === 'parent' && <p className="text-xs text-red-400 mt-1">Incorrect parent code</p>}
                </div>
              )}

              {nextRole === 'parent' && (
                <p className="text-[11px] text-gray-600 mt-3 leading-snug">
                  Parents can view the team schedule only. Your coach assigns you to an age group — you cannot pick one yourself.
                </p>
              )}
            </div>
          )}

          {/* Volleyball details — players only */}
          {showPlayerFields && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Position <span className="text-red-400">*</span>
                </label>
                <select
                  value={position}
                  onChange={e => { setPosition(e.target.value); setSaveError('') }}
                  className={`w-full bg-bg3 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent ${
                    saveError ? 'border-red-500' : 'border-white/10'
                  }`}
                >
                  <option value="">— select —</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="rounded-lg border border-white/7 bg-bg3/40 px-3 py-2.5">
                <p className="text-[11px] text-gray-500 mb-3 leading-snug">
                  Optional details — add or update whenever you like.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Jersey number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={jersey}
                      onChange={e => setJersey(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 7"
                      className="w-full bg-bg2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Date of birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-bg2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {saveError && <p className="text-xs text-red-400 text-center">{saveError}</p>}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !displayName.trim()}
            className="w-full py-2.5 rounded-lg bg-accent text-black font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Danger zone */}
        <div className="px-6 pb-6">
          <div className="border border-red-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Danger zone</p>
            {!confirmDel ? (
              <button
                onClick={() => setConfirmDel(true)}
                className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all"
              >
                Delete my profile
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">This will permanently remove your profile and all your data. Are you sure?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDel(false)}
                    className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-400 transition-all disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
