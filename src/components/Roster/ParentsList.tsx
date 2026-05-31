import { useEffect, useMemo, useState } from 'react'
import {
  assignPlayerGroup,
  deletePlayerProfile,
  fetchPlayers,
  fetchAllPracticeEmailReminders,
  savePracticeEmailReminder,
} from '../../firebase/db'
import { getGroupColor } from '../../data/schedule'
import type { ScheduledSession } from '../../data/schedule'
import type { GroupKey, Player } from '../../types'

const LEGACY_GROUPS: GroupKey[] = ['18U Boys', '17U Boys', '16U Boys']

interface Props {
  sessions: ScheduledSession[]
  onToast?: (msg: string) => void
  onUnassignedChange?: (count: number) => void
}

function mergeAssignableGroups(sessions: ScheduledSession[]): GroupKey[] {
  const set = new Set<GroupKey>(LEGACY_GROUPS)
  for (const s of sessions) set.add(s.group as GroupKey)
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export function ParentsList({ sessions, onToast, onUnassignedChange }: Props) {
  const [parents, setParents] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningUid, setAssigningUid] = useState<string | null>(null)
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null)
  const [deletingUid, setDeletingUid] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState<GroupKey | 'all' | 'unassigned'>('all')
  /** uid → true means email reminders are ON for that parent (coach-controlled, opt-in) */
  const [emailOn, setEmailOn] = useState<Record<string, boolean>>({})
  const [emailBusyUid, setEmailBusyUid] = useState<string | null>(null)

  const assignableGroups = useMemo(() => mergeAssignableGroups(sessions), [sessions])

  const knownGroups = useMemo(() => {
    const set = new Set<GroupKey>(assignableGroups)
    for (const p of parents) if (p.group) set.add(p.group as GroupKey)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [parents, assignableGroups])

  const reload = async () => {
    try {
      const [all, reminders] = await Promise.all([
        fetchPlayers(),
        fetchAllPracticeEmailReminders().catch(() => ({} as Record<string, { optedOut?: boolean; updatedAt?: number }>)),
      ])
      const ps = all
        .filter(p => p.role === 'parent')
        .sort((a, b) => {
          const ag = a.group ?? ''
          const bg = b.group ?? ''
          if (ag !== bg) return ag ? (bg ? ag.localeCompare(bg) : -1) : 1
          return (a.displayName ?? '').localeCompare(b.displayName ?? '')
        })
      setParents(ps)
      const on: Record<string, boolean> = {}
      for (const p of ps) {
        const row = reminders[p.uid]
        on[p.uid] = row != null && row.optedOut === false
      }
      setEmailOn(on)
    } catch (e) {
      console.error('[ParentsList] reload failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void reload() }, [])

  const filtered = useMemo(() => {
    return parents.filter(p => {
      const matchSearch = !search || p.displayName.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
      const matchGroup =
        filterGroup === 'all' ? true
        : filterGroup === 'unassigned' ? !p.group
        : p.group === filterGroup
      return matchSearch && matchGroup
    })
  }, [parents, search, filterGroup])

  const unassignedCount = parents.filter(p => !p.group).length

  useEffect(() => { onUnassignedChange?.(unassignedCount) }, [unassignedCount, onUnassignedChange])

  const handleAssign = async (uid: string, group: GroupKey | null) => {
    setAssigningUid(uid)
    try {
      await assignPlayerGroup(uid, group)
      setParents(prev =>
        prev
          .map(p => (p.uid === uid ? { ...p, group } : p))
          .sort((a, b) => {
            const ag = a.group ?? ''
            const bg = b.group ?? ''
            if (ag !== bg) return ag ? (bg ? ag.localeCompare(bg) : -1) : 1
            return (a.displayName ?? '').localeCompare(b.displayName ?? '')
          }),
      )
      onToast?.(group ? `Parent assigned to ${group}` : 'Parent unassigned from group')
    } catch (e) {
      console.error('[ParentsList] assignPlayerGroup', e)
      onToast?.('Could not update group — try again.')
    } finally {
      setAssigningUid(null)
    }
  }

  const handleToggleEmail = async (uid: string) => {
    const next = !emailOn[uid]
    setEmailBusyUid(uid)
    try {
      await savePracticeEmailReminder(uid, next)
      setEmailOn(prev => ({ ...prev, [uid]: next }))
    } catch (e) {
      console.error('[ParentsList] savePracticeEmailReminder', e)
      onToast?.('Could not save email preference — try again.')
    } finally {
      setEmailBusyUid(null)
    }
  }

  const handleDelete = async (uid: string) => {
    setDeletingUid(uid)
    try {
      await deletePlayerProfile(uid)
      setParents(prev => prev.filter(p => p.uid !== uid))
      setConfirmDeleteUid(null)
      onToast?.('Parent account deleted.')
    } catch (e) {
      console.error('[ParentsList] deletePlayerProfile', e)
      onToast?.('Could not delete — try again.')
    } finally {
      setDeletingUid(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-condensed text-3xl font-black">Parents</h2>
          <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
            Assign each parent to one age group so they can view that team&apos;s schedule. Parents cannot pick a group themselves.
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {parents.length} parent{parents.length !== 1 ? 's' : ''}
          {unassignedCount > 0 && (
            <span className="text-amber-400/90"> · {unassignedCount} unassigned</span>
          )}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 bg-bg2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent placeholder:text-gray-600"
        />
        <div className="flex gap-1 bg-bg2 border border-white/10 rounded-lg p-1 flex-shrink-0 flex-wrap">
          <button
            onClick={() => setFilterGroup('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filterGroup === 'all' ? 'bg-bg3 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterGroup('unassigned')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filterGroup === 'unassigned' ? 'bg-amber-500/30 text-amber-300' : 'text-gray-500 hover:text-white'}`}
          >
            Unassigned
          </button>
          {knownGroups.map(g => {
            const c = getGroupColor(g)
            return (
              <button
                key={g}
                onClick={() => setFilterGroup(g)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filterGroup === g ? `${c.bg} text-white` : 'text-gray-500 hover:text-white'}`}
              >
                {g.replace(' Boys', '').replace(' Girls', '')}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm text-center py-12">Loading…</p>
      ) : parents.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">No parent accounts yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-12">No parents match your search.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(parent => (
            <ParentRow
              key={parent.uid}
              parent={parent}
              assignableGroups={assignableGroups}
              assigning={assigningUid === parent.uid}
              confirming={confirmDeleteUid === parent.uid}
              deleting={deletingUid === parent.uid}
              emailOn={!!emailOn[parent.uid]}
              emailBusy={emailBusyUid === parent.uid}
              onAssign={g => void handleAssign(parent.uid, g)}
              onRequestDelete={() => setConfirmDeleteUid(parent.uid)}
              onCancelDelete={() => setConfirmDeleteUid(null)}
              onConfirmDelete={() => void handleDelete(parent.uid)}
              onToggleEmail={() => void handleToggleEmail(parent.uid)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ParentRow({
  parent,
  assignableGroups,
  assigning,
  confirming,
  deleting,
  emailOn,
  emailBusy,
  onAssign,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onToggleEmail,
}: {
  parent: Player
  assignableGroups: GroupKey[]
  assigning: boolean
  confirming: boolean
  deleting: boolean
  emailOn: boolean
  emailBusy: boolean
  onAssign: (group: GroupKey | null) => void
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  onToggleEmail: () => void
}) {
  const colors = parent.group ? getGroupColor(parent.group) : null

  return (
    <div className="bg-bg2 border border-white/7 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      {parent.photoURL
        ? <img src={parent.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
        : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold flex-shrink-0">
            {parent.displayName[0]}
          </div>
      }

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">{parent.displayName}</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400">Parent</span>
          {parent.group && colors && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.bg} text-white font-medium`}>
              {parent.group.replace(' Boys', '').replace(' Girls', '')}
            </span>
          )}
          {!parent.group && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Unassigned</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{parent.email}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
        {/* Group select */}
        <div className="sm:min-w-[190px]">
          <label className="sr-only" htmlFor={`parent-group-${parent.uid}`}>Age group</label>
          <select
            id={`parent-group-${parent.uid}`}
            value={parent.group ?? ''}
            disabled={assigning || deleting}
            onChange={e => {
              const v = e.target.value
              onAssign(v ? (v as GroupKey) : null)
            }}
            className="w-full bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-50"
          >
            <option value="">— assign age group —</option>
            {assignableGroups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Email reminder toggle — coach-controlled, opt-in only for parents */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs hidden sm:block ${emailOn ? 'text-green-400' : 'text-gray-600'}`}>
            {emailOn ? 'Email on' : 'No email'}
          </span>
          <button
            type="button"
            onClick={onToggleEmail}
            disabled={emailBusy || deleting}
            title={emailOn ? 'Turn off practice-day emails for this parent' : 'Send practice-day emails to this parent'}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
              emailOn ? 'bg-green-500' : 'bg-white/15'
            } ${emailBusy ? 'opacity-60' : ''}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${emailOn ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        {/* Delete */}
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onCancelDelete}
              className="px-2 py-1 rounded text-xs border border-white/10 text-gray-400 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmDelete}
              disabled={deleting}
              className="px-2 py-1 rounded text-xs bg-red-500 text-white font-medium hover:bg-red-400 transition-all disabled:opacity-50"
            >
              {deleting ? '…' : 'Confirm'}
            </button>
          </div>
        ) : (
          <button
            onClick={onRequestDelete}
            disabled={assigning || deleting}
            className="px-2 py-1 rounded text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
