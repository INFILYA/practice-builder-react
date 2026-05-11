import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { DRILLS, MODULE_COLORS } from '../../data/drills'
import { saveDrillEdit, fetchDrillEdits, drillEditKey } from '../../firebase/db'
import type { Drill, ModuleKey } from '../../types'

interface Props {
  user: User | null
  onAddDrill: (drill: Drill, mod: ModuleKey) => void
}

const MODULES: ModuleKey[] = ['WU', 'M1', 'M2', 'M3', 'GS']

const MODULE_BG: Record<ModuleKey, string> = {
  WU: 'bg-orange-500',
  M1: 'bg-blue-600',
  M2: 'bg-violet-600',
  M3: 'bg-rose-600',
  GS: 'bg-emerald-500',
}

type DrillEdits = Record<string, Partial<Drill>>

export function DrillLibrary({ user, onAddDrill }: Props) {
  const [activeMod, setActiveMod] = useState<ModuleKey>('WU')
  const [modalDrill, setModalDrill] = useState<{ drill: Drill; mod: ModuleKey } | null>(null)
  const [drillEdits, setDrillEdits] = useState<DrillEdits>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Drill>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDrillEdits().then(edits => {
      const merged: DrillEdits = {}
      Object.entries(edits).forEach(([k, v]) => { merged[k] = v })
      setDrillEdits(merged)
    })
  }, [])

  const getEffectiveDrill = (drill: Drill, mod: ModuleKey): Drill => {
    const key = drillEditKey(mod, drill.name)
    const edit = drillEdits[key]
    return edit ? { ...drill, ...edit } : drill
  }

  const drills = DRILLS[activeMod].map(d => getEffectiveDrill(d, activeMod))
  const grouped = drills.reduce<Record<string, Drill[]>>((acc, d) => {
    acc[d.obj] = acc[d.obj] ?? []
    acc[d.obj].push(d)
    return acc
  }, {})

  const handleDragStart = (e: React.DragEvent, drill: Drill, mod: ModuleKey) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ drill, mod }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const openModal = (drill: Drill, mod: ModuleKey) => {
    setModalDrill({ drill, mod })
    setIsEditing(false)
    setEditForm({})
  }

  const startEditing = (drill: Drill) => {
    setIsEditing(true)
    setEditForm({
      name: drill.name,
      desc: drill.desc,
      vars: drill.vars,
      defaultMin: drill.defaultMin,
      obj: drill.obj,
    })
  }

  const handleSaveEdit = async () => {
    if (!modalDrill || !user) return
    setSaving(true)
    try {
      await saveDrillEdit(modalDrill.mod, modalDrill.drill.name, editForm, user.displayName ?? user.email ?? 'Unknown')
      const key = drillEditKey(modalDrill.mod, modalDrill.drill.name)
      setDrillEdits(prev => ({ ...prev, [key]: editForm }))
      setModalDrill({ drill: { ...modalDrill.drill, ...editForm }, mod: modalDrill.mod })
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const inp = "w-full px-2.5 py-1.5 text-xs rounded-md border border-white/10 bg-bg text-gray-200 placeholder-gray-600 focus:border-accent outline-none transition-colors resize-none"

  return (
    <>
      <aside className="w-72 flex-shrink-0 border-r border-white/7 bg-bg2 flex flex-col">
        <div className="px-4 py-3 border-b border-white/7">
          <h3 className="font-condensed text-base font-bold">Drill Library</h3>
          <p className="text-xs text-gray-500 mt-0.5">Drag or click + to add · Info for details</p>
        </div>

        <div className="flex border-b border-white/7">
          {MODULES.map(mod => {
            const mc = MODULE_COLORS[mod]
            return (
              <button key={mod} onClick={() => setActiveMod(mod)}
                className={`flex-1 py-2 text-xs font-black font-condensed tracking-wider uppercase transition-all border-b-2
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
            </div>
          ) : Object.entries(grouped).map(([obj, list]) => (
            <div key={obj} className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 px-1.5 py-1">{obj}</p>
              {list.map(drill => (
                <div
                  key={drill.name}
                  draggable
                  onDragStart={(e) => handleDragStart(e, drill, activeMod)}
                  className="w-full text-left p-2.5 mb-1 rounded-md border border-transparent bg-bg3 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-flex items-center justify-center text-xs font-black px-1.5 py-0.5 rounded font-condensed tracking-wide flex-shrink-0 text-white ${MODULE_BG[activeMod]}`}>
                        {activeMod}
                      </span>
                      <p className="text-xs font-semibold text-white truncate">{drill.name}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal(drill, activeMod) }}
                        className="px-2 py-0.5 rounded text-xs border border-white/10 text-gray-500 hover:text-white hover:bg-bg2 transition-all"
                      >
                        Info
                      </button>
                      <button
                        onClick={() => onAddDrill(drill, activeMod)}
                        className={`w-6 h-5 rounded text-xs font-bold ${MODULE_COLORS[activeMod].text} border ${MODULE_COLORS[activeMod].border} hover:opacity-80 transition-all`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    by {drill.createdBy ?? 'Unity Volleyball'}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {modalDrill && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setModalDrill(null); setIsEditing(false) }}
        >
          <div
            className={`bg-bg2 border border-white/10 rounded-xl p-6 w-full shadow-2xl ${modalDrill.drill.videoUrl && !isEditing ? 'max-w-xl' : 'max-w-md'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center text-sm font-black px-2 py-1 rounded font-condensed tracking-wide text-white ${MODULE_BG[modalDrill.mod]}`}>
                  {modalDrill.mod}
                </span>
                <h3 className="font-condensed text-xl font-bold">
                  {isEditing ? 'Edit Drill' : modalDrill.drill.name}
                </h3>
              </div>
              <button
                onClick={() => { setModalDrill(null); setIsEditing(false) }}
                className="text-gray-500 hover:text-white transition-colors text-lg leading-none mt-0.5 flex-shrink-0"
              >✕</button>
            </div>

            {isEditing ? (
              /* Edit form */
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Name</label>
                  <input className={inp} value={editForm.name ?? ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Objective / Category</label>
                  <input className={inp} value={editForm.obj ?? ''} onChange={e => setEditForm(p => ({ ...p, obj: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                  <textarea className={inp + ' h-20'} value={editForm.desc ?? ''} onChange={e => setEditForm(p => ({ ...p, desc: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Variations</label>
                  <textarea className={inp + ' h-20'} value={editForm.vars ?? ''} onChange={e => setEditForm(p => ({ ...p, vars: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Default Minutes</label>
                  <input type="number" min={1} max={60} className={inp + ' w-20'} value={editForm.defaultMin ?? ''} onChange={e => setEditForm(p => ({ ...p, defaultMin: parseInt(e.target.value) || 10 }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-2 rounded-md text-sm font-semibold bg-accent text-black hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-md text-sm border border-white/10 text-gray-400 hover:text-white hover:bg-bg3 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Objective</p>
                  <p className="text-gray-300">{modalDrill.drill.obj}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-gray-300 leading-relaxed">{modalDrill.drill.desc}</p>
                </div>
                {modalDrill.drill.vars && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Variations</p>
                    <p className="text-gray-400 leading-relaxed text-xs">{modalDrill.drill.vars}</p>
                  </div>
                )}
                {modalDrill.drill.videoUrl && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Video</p>
                    <div className="rounded-lg overflow-hidden bg-black aspect-video w-full">
                      <iframe
                        src={
                          modalDrill.drill.videoUrl.includes('youtube.com')
                            ? `${modalDrill.drill.videoUrl}?rel=0&modestbranding=1`
                            : modalDrill.drill.videoUrl
                        }
                        title={modalDrill.drill.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-white/7">
                  <p className="text-xs text-gray-600">
                    by <span className="text-gray-400">{modalDrill.drill.createdBy ?? 'Unity Volleyball'}</span>
                  </p>
                  {user && (
                    <button
                      onClick={() => startEditing(modalDrill.drill)}
                      className="px-3 py-1.5 rounded-md text-xs border border-white/10 text-gray-300 hover:text-white hover:bg-bg3 transition-all"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => { onAddDrill(modalDrill.drill, modalDrill.mod); setModalDrill(null) }}
                    className="px-4 py-2 rounded-md text-sm font-semibold bg-accent text-black hover:opacity-90 transition-all"
                  >
                    + Add to Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
