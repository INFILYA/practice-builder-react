import { MODULE_COLORS } from '../../data/drills'
import type { PlanBlock as PlanBlockType } from '../../types'

interface Props {
  block: PlanBlockType
  onRemove: () => void
  onUpdate: (updates: Partial<PlanBlockType>) => void
}

export function PlanBlock({ block, onRemove, onUpdate }: Props) {
  const mc = MODULE_COLORS[block.mod] ?? MODULE_COLORS.M1
  return (
    <div className="border border-white/7 rounded-md bg-bg2 mb-1.5 overflow-hidden hover:border-white/12 transition-colors">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/7 bg-bg3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded font-condensed tracking-wide flex-shrink-0 ${mc.badge}`}>
          {block.mod}
        </span>
        <span className="text-sm font-semibold flex-1 text-white truncate">{block.name}</span>
        <button onClick={onRemove} className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none px-1">×</button>
      </div>
      <div className="px-3 py-2 flex flex-wrap gap-3 items-start">
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="text-xs text-gray-400">Min:</label>
          <input
            type="number" min={1} max={120} value={block.mins}
            onChange={e => onUpdate({ mins: parseInt(e.target.value) || 0 })}
            className="w-14 px-2 py-1 text-center text-xs rounded-md border border-white/10 bg-bg focus:border-accent outline-none transition-colors"
          />
        </div>
        <p className="text-xs text-gray-400 leading-relaxed flex-1 min-w-32">{block.vars || block.desc}</p>
      </div>
      <div className="px-3 pb-2">
        <textarea
          value={block.notes} placeholder="Coaching cues / notes..."
          onChange={e => onUpdate({ notes: e.target.value })}
          className="w-full text-xs px-2 py-1.5 rounded-md border border-white/7 bg-bg text-gray-300 placeholder-gray-600 resize-none h-8 focus:border-accent outline-none transition-colors"
        />
      </div>
    </div>
  )
}
