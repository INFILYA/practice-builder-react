import { useState } from 'react'
import { saveSession, saveGroupColor } from '../../firebase/db'
import { COLOR_PALETTE } from '../../data/schedule'
import type { ScheduledSession } from '../../data/schedule'

interface SessionRow {
  date: string
  facility: string
  time: string
  duration: string
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

const FACILITIES = ['MPAC', 'Coliseum', 'Mount Joy', 'Other']
const TIMES = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']

function emptyRow(): SessionRow {
  return { date: '', facility: 'Coliseum', time: '18:00', duration: '120' }
}

export function AddGroupModal({ onClose, onSaved }: Props) {
  const [groupName, setGroupName]   = useState('')
  const [colorBg,   setColorBg]     = useState(COLOR_PALETTE[3].bg) // amber default
  const [rows,      setRows]        = useState<SessionRow[]>([emptyRow()])
  const [saving,    setSaving]      = useState(false)
  const [error,     setError]       = useState('')

  const updateRow = (i: number, field: keyof SessionRow, value: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    setError('')
    const name = groupName.trim()
    if (!name) { setError('Please enter a group name.'); return }

    const validRows = rows.filter(r => r.date)
    if (validRows.length === 0) { setError('Add at least one session with a date.'); return }

    setSaving(true)
    try {
      // Save group color config
      await saveGroupColor(name, colorBg)

      // Save each session
      await Promise.all(
        validRows.map((r, i) => {
          const session: ScheduledSession = {
            id:       `custom_${name.replace(/[^a-zA-Z0-9]/g, '_')}_${i}_${Date.now()}`,
            date:     r.date,
            group:    name,
            facility: r.facility,
            time:     r.time,
            duration: r.duration,
          }
          return saveSession(session)
        })
      )

      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Something went wrong — please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg2 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/7 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-condensed text-2xl font-black">Add Age Group</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create a new group and schedule their sessions</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Group name + color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Group name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. 15U Boys, 18U Girls…"
                className="w-full bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Group colour</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.bg}
                    type="button"
                    title={c.label}
                    onClick={() => setColorBg(c.bg)}
                    className={`w-7 h-7 rounded-full transition-all ${c.bg} ${
                      colorBg === c.bg ? 'ring-2 ring-white ring-offset-2 ring-offset-bg2 scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview badge */}
          {groupName.trim() && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${colorBg}`}>
                {groupName.trim()}
              </span>
              <span className="text-xs text-gray-600">preview</span>
            </div>
          )}

          {/* Sessions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Practice sessions</h3>
              <span className="text-xs text-gray-600">{rows.filter(r => r.date).length} / {rows.length} filled</span>
            </div>

            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 mb-1.5 text-xs text-gray-600 px-1">
              <span>Date</span>
              <span>Facility</span>
              <span>Time</span>
              <span>Duration</span>
              <span />
            </div>

            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                  <input
                    type="date"
                    value={row.date}
                    min="2026-01-01"
                    onChange={e => updateRow(i, 'date', e.target.value)}
                    className="bg-bg3 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                  />
                  <select
                    value={row.facility}
                    onChange={e => updateRow(i, 'facility', e.target.value)}
                    className="bg-bg3 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select
                    value={row.time}
                    onChange={e => updateRow(i, 'time', e.target.value)}
                    className="bg-bg3 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    value={row.duration}
                    onChange={e => updateRow(i, 'duration', e.target.value)}
                    className="bg-bg3 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="60">1h</option>
                    <option value="90">1.5h</option>
                    <option value="120">2h</option>
                    <option value="150">2.5h</option>
                    <option value="180">3h</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="w-6 h-6 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all flex items-center justify-center text-lg leading-none disabled:opacity-20"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 text-xs text-accent hover:text-white transition-colors"
            >
              <span className="text-base leading-none">+</span> Add session
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-white/7 flex-shrink-0">
          {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-bg3 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-accent text-black font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : `Save group${groupName.trim() ? ` · ${groupName.trim()}` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
