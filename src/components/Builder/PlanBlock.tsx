import { useState } from 'react'
import { MODULE_COLORS } from '../../data/drills'
import type { PlanBlock as PlanBlockType } from '../../types'

interface Props {
  block: PlanBlockType
  onRemove: () => void
  onUpdate: (updates: Partial<PlanBlockType>) => void
}

const MODULE_BG: Record<string, string> = {
  WU: 'bg-orange-500',
  M1: 'bg-blue-600',
  M2: 'bg-violet-600',
  M3: 'bg-rose-600',
  GS: 'bg-emerald-500',
  CD: 'bg-teal-500',
}

const MODULE_LABEL: Record<string, string> = {
  WU: 'Warm-Up',
  M1: 'Individual',
  M2: 'Partner',
  M3: 'Team',
  GS: 'Game Sim',
  CD: 'Cool-Down',
}

export function PlanBlock({ block, onRemove, onUpdate }: Props) {
  const [showInfo, setShowInfo] = useState(false)
  const mc = MODULE_COLORS[block.mod] ?? MODULE_COLORS.M1
  const bgClass = MODULE_BG[block.mod] ?? 'bg-gray-500'

  return (
    <>
      <div className="border border-white/7 rounded-md bg-bg2 mb-1.5 overflow-hidden hover:border-white/12 transition-colors">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className={`flex flex-col items-center justify-center px-2 py-1 rounded-md flex-shrink-0 text-white ${bgClass} min-w-[40px]`}>
            <span className="text-xs font-black font-condensed tracking-wide leading-none">{block.mod}</span>
            <span className="text-xs leading-none opacity-80 font-medium" style={{ fontSize: '9px' }}>{MODULE_LABEL[block.mod] ?? ''}</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {block.obj && (
              <span className="text-xs text-gray-500 leading-none mb-0.5 truncate uppercase tracking-wide" style={{ fontSize: '10px' }}>{block.obj}</span>
            )}
            <span className="text-sm font-semibold text-white truncate">{block.name}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              type="number" min={1} max={120} value={block.mins}
              onChange={e => onUpdate({ mins: parseInt(e.target.value) || 1 })}
              className="w-12 px-1.5 py-0.5 text-center text-xs rounded border border-white/10 bg-bg focus:border-accent outline-none transition-colors"
            />
            <span className="text-xs text-gray-600">m</span>
            {(block.desc || block.vars) && (
              <button
                onClick={() => setShowInfo(true)}
                className={`px-2 py-0.5 rounded text-xs border ${mc.border} ${mc.text} hover:opacity-80 transition-all ml-1`}
              >
                Info
              </button>
            )}
            <button onClick={onRemove} className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none px-1 ml-1">×</button>
          </div>
        </div>
        <div className="px-3 pb-2">
          <textarea
            value={block.notes} placeholder="Coaching cues / notes..."
            onChange={e => onUpdate({ notes: e.target.value })}
            className="w-full text-xs px-2 py-1.5 rounded-md border border-white/7 bg-bg text-gray-300 placeholder-gray-600 resize-none h-8 focus:border-accent outline-none transition-colors"
          />
        </div>
      </div>

      {/* Read-only Info modal */}
      {showInfo && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-bg2 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex flex-col items-center text-sm font-black px-2 py-1 rounded font-condensed tracking-wide text-white ${bgClass}`}>
                  <span>{block.mod}</span>
                  <span className="font-medium opacity-80" style={{ fontSize: '9px' }}>{MODULE_LABEL[block.mod]}</span>
                </span>
                <h3 className="font-condensed text-xl font-bold">{block.name}</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-500 hover:text-white transition-colors text-lg leading-none mt-0.5 flex-shrink-0"
              >✕</button>
            </div>
            <div className="space-y-3 text-sm">
              {block.obj && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Objective</p>
                  <p className="text-gray-300">{block.obj}</p>
                </div>
              )}
              {block.desc && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-gray-300 leading-relaxed">{block.desc}</p>
                </div>
              )}
              {block.vars && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Variations</p>
                  <p className="text-gray-400 leading-relaxed text-xs">{block.vars}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
