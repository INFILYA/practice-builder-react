import { useState } from 'react'
import { DRILLS, MODULE_COLORS } from '../../data/drills'
import type { Drill, ModuleKey } from '../../types'

interface Props {
  onAddDrill: (drill: Drill, mod: ModuleKey) => void
}

const MODULES: ModuleKey[] = ['M1', 'M2', 'M3', 'GS']

export function DrillLibrary({ onAddDrill }: Props) {
  const [activeMod, setActiveMod] = useState<ModuleKey>('M1')
  const drills = DRILLS[activeMod]
  const grouped = drills.reduce<Record<string, Drill[]>>((acc, d) => {
    acc[d.obj] = acc[d.obj] ?? []
    acc[d.obj].push(d)
    return acc
  }, {})

  return (
    <aside className="w-72 flex-shrink-0 border-r border-white/7 bg-bg2 flex flex-col">
      <div className="px-4 py-3 border-b border-white/7">
        <h3 className="font-condensed text-base font-bold">Drill Library</h3>
        <p className="text-xs text-gray-500 mt-0.5">Click a drill to add it to the plan</p>
      </div>
      <div className="flex border-b border-white/7">
        {MODULES.map(mod => {
          const mc = MODULE_COLORS[mod]
          return (
            <button key={mod} onClick={() => setActiveMod(mod)}
              className={`flex-1 py-2 text-xs font-bold font-condensed tracking-wider uppercase transition-all border-b-2
                ${activeMod === mod ? `${mc.text} border-current` : 'text-gray-600 border-transparent hover:text-gray-400'}`}>
              {mod}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {drills.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-12">
            <p className="text-3xl mb-2">📋</p>
            <p>No drills yet</p>
            <p className="text-xs mt-1 text-gray-700">Add drills to this module</p>
          </div>
        ) : Object.entries(grouped).map(([obj, list]) => (
          <div key={obj} className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 px-1.5 py-1">{obj}</p>
            {list.map(drill => (
              <button key={drill.name} onClick={() => onAddDrill(drill, activeMod)}
                className="w-full text-left p-2.5 mb-1 rounded-md border border-transparent bg-bg3 hover:border-white/10 hover:translate-x-0.5 transition-all">
                <p className="text-xs font-semibold text-white">{drill.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{drill.desc}</p>
                <span className={`inline-block text-xs font-bold px-1.5 py-0.5 rounded mt-1.5 font-condensed tracking-wide ${MODULE_COLORS[activeMod].badge}`}>
                  {activeMod}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
