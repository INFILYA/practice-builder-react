import type { SessionMeta } from '../../types'

interface Props {
  meta: SessionMeta
  onChange: (updates: Partial<SessionMeta>) => void
}

export function buildTitle(meta: SessionMeta): string {
  const date = meta.date
    ? new Date(meta.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''
  const duration = meta.duration === '120' ? '2h' : '3h'
  return [meta.group, date, duration, meta.facility].filter(Boolean).join(' · ')
}

export function SessionMetaBar({ meta, onChange }: Props) {
  const sel = "px-2 py-1.5 rounded-md border border-white/10 bg-bg3 text-gray-200 text-xs focus:border-accent outline-none transition-colors cursor-pointer"
  return (
    <div className="px-4 py-2.5 border-b border-white/7 bg-bg2 flex items-center gap-3 flex-wrap">
      <span className="font-condensed text-lg font-bold text-white flex-1 min-w-40 truncate">
        {buildTitle(meta)}
      </span>
      <select className={sel} value={meta.group} onChange={e => onChange({ group: e.target.value })}>
        {['16U Boys','17U Boys','18U Boys'].map(g => <option key={g}>{g}</option>)}
      </select>
      <input type="date" value={meta.date} onChange={e => onChange({ date: e.target.value })}
        className={sel + ' [color-scheme:dark]'} />
      <select className={sel} value={meta.duration} onChange={e => onChange({ duration: e.target.value as '120'|'180' })}>
        <option value="120">2h</option>
        <option value="180">3h</option>
      </select>
      <select className={sel} value={meta.facility} onChange={e => onChange({ facility: e.target.value })}>
        {['MPAC','Mount Joy','Coliseum'].map(f => <option key={f}>{f}</option>)}
      </select>
    </div>
  )
}
