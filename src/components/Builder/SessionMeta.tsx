import type { SessionMeta } from '../../types'

interface Props {
  meta: SessionMeta
  onChange?: (updates: Partial<SessionMeta>) => void
}

export function buildTitle(meta: SessionMeta): string {
  const date = meta.date
    ? new Date(meta.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''
  const duration = meta.duration === '120' ? '2h' : '3h'
  return [meta.group, date, duration, meta.facility].filter(Boolean).join(' · ')
}

export function SessionMetaBar({ meta }: Props) {
  return (
    <div className="px-4 py-2.5 border-b border-white/7 bg-bg2 flex items-center gap-2 flex-wrap">
      <span className="font-condensed text-lg font-bold text-white truncate">
        {buildTitle(meta) || 'No session selected'}
      </span>
      {meta.date && (
        <span className="text-xs text-gray-500 ml-auto">
          {parseInt(meta.duration) / 60}h · {meta.facility}
        </span>
      )}
    </div>
  )
}
