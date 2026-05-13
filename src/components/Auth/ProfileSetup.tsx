import { useState } from 'react'
import type { User } from 'firebase/auth'
import { savePlayer, COACH_PASSWORD, isAdminEmail } from '../../firebase/db'
import type { Player } from '../../types'

interface Props {
  user: User
  onComplete: (player: Player) => void
}

const POSITIONS = ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero', 'Defensive Specialist']

export function ProfileSetup({ user, onComplete }: Props) {
  const isAdmin = isAdminEmail(user.email)

  const [displayName, setDisplayName] = useState(user.displayName ?? '')
  const [position,    setPosition]    = useState('')
  const [coachPwd,    setCoachPwd]    = useState('')
  const [pwdError,    setPwdError]    = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [saving,      setSaving]      = useState(false)

  const handleSubmit = async () => {
    setPwdError(false)
    setSaveError('')

    const name = displayName.trim()
    if (!name) { setSaveError('Please enter your name.'); return }

    // Admin email = always coach, no password needed
    const isCoach = isAdmin || coachPwd.trim() !== ''
    if (!isAdmin && coachPwd.trim() !== '' && coachPwd.trim() !== COACH_PASSWORD) {
      setPwdError(true)
      return
    }

    if (!isCoach && !position.trim()) {
      setSaveError('Please choose your position on the court.')
      return
    }

    setSaving(true)
    try {
      const player: Player = {
        uid:         user.uid,
        displayName: name || user.displayName || 'Player',
        email:       user.email ?? '',
        photoURL:    user.photoURL ?? undefined,
        role:        isCoach ? 'coach' : 'player',
        group:       null,
        position:    isCoach ? undefined : position.trim(),
        createdAt:   Date.now(),
      }
      await savePlayer(player)
      onComplete(player)
    } catch (err) {
      console.error('Profile save error:', err)
      setSaveError('Something went wrong — please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg2 border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          {user.photoURL
            ? <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full mb-3" />
            : <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                <span className="text-accent text-2xl font-bold">{(user.displayName ?? 'P')[0]}</span>
              </div>
          }
          <h2 className="font-condensed text-2xl font-black">Create your profile</h2>
          <p className="text-xs text-gray-500 mt-1">Summer 2026</p>
          {isAdmin && (
            <span className="mt-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold">
              Admin · Coach access granted
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Name — only truly required field */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Display name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className={`w-full bg-bg3 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent ${
                !displayName.trim() && saveError ? 'border-red-500' : 'border-white/10'
              }`}
            />
          </div>

          {/* Coach password — hidden for admins */}
          {!isAdmin && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Coach access code <span className="text-gray-600">(enter only if you are a coach)</span>
              </label>
              <input
                type="password"
                value={coachPwd}
                onChange={e => { setCoachPwd(e.target.value); setPwdError(false); setSaveError('') }}
                placeholder="Coach code — leave blank for player signup"
                className={`w-full bg-bg3 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${
                  pwdError ? 'border-red-500' : 'border-white/10 focus:border-accent'
                }`}
              />
              {pwdError && <p className="text-xs text-red-400 mt-1">Incorrect access code — leave blank to register as a player</p>}
            </div>
          )}

          {/* Player only: volleyball position (jersey & age can be added later from profile icon) */}
          {!isAdmin && coachPwd.trim() === '' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Your position <span className="text-red-400">*</span>
              </label>
              <select
                value={position}
                onChange={e => { setPosition(e.target.value); setSaveError('') }}
                className={`w-full bg-bg3 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent ${
                  saveError.includes('position') ? 'border-red-500' : 'border-white/10'
                }`}
              >
                <option value="">— choose your role on the court —</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <p className="text-[11px] text-gray-600 mt-1.5 leading-snug">
                Jersey number and date of birth can be added anytime after signup — tap your profile icon.
              </p>
            </div>
          )}

          {saveError && (
            <p className="text-xs text-red-400 text-center">{saveError}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              saving
              || !displayName.trim()
              || (!isAdmin && coachPwd.trim() === '' && !position.trim())
            }
            className="w-full py-2.5 rounded-lg bg-accent text-black font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 mt-2"
          >
            {saving ? 'Saving…' : 'Create profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
