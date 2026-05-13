import { useState, useEffect, useMemo, useCallback } from 'react'
import type { User } from 'firebase/auth'
import { MODULE_COLORS } from '../../data/drills'
import {
  fetchDrillEdits,
  drillEditKey,
  fetchCustomDrillsForBuilder,
  saveCustomDrill,
  deleteCustomDrill,
  isAdminEmail,
} from '../../firebase/db'
import type { Drill, ModuleKey, CustomDrill } from '../../types'

interface Props {
  user: User | null
  canEditPlans?: boolean
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

const EMPTY_FORM = { name: '', obj: '', desc: '', vars: '', defaultMin: 10, mod: 'M1' as ModuleKey, videoUrl: '' }

type DrillEdits = Record<string, Partial<Drill>>

function storedToDrill(c: CustomDrill): Drill {
  return {
    name: c.name,
    obj: c.obj,
    desc: c.desc,
    vars: c.vars,
    defaultMin: c.defaultMin,
    videoUrl: c.videoUrl,
    createdBy: c.createdBy,
    createdByUid: c.createdByUid,
  }
}

function toEmbedUrl(url: string): string {
  if (!url) return ''
  if (url.includes('/embed/')) return url
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return `https://www.youtube.com/embed/${short[1]}`
  const watch = url.match(/[?&]v=([^?&]+)/)
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`
  const drive = url.match(/\/d\/([^/]+)/)
  if (drive && url.includes('drive.google.com')) return `https://drive.google.com/file/d/${drive[1]}/preview`
  return url
}

export function DrillLibrary({ user, canEditPlans, onAddDrill }: Props) {
  const isAdminUser = isAdminEmail(user?.email)
  const [source,        setSource]        = useState<'mine' | 'all'>('mine')
  const [activeMod,     setActiveMod]     = useState<ModuleKey>('WU')
  const [drills,        setDrills]        = useState<CustomDrill[]>([])
  const [loadingDrills, setLoadingDrills] = useState(true)
  const [loadError,    setLoadError]     = useState<string | null>(null)
  const [drillEdits,    setDrillEdits]    = useState<DrillEdits>({})

  const reloadDrills = useCallback(() => {
    if (!user?.uid) {
      setDrills([])
      setLoadingDrills(false)
      setLoadError(null)
      return
    }
    setLoadingDrills(true)
    setLoadError(null)
    const label = user.displayName ?? user.email ?? 'Coach'
    fetchCustomDrillsForBuilder(user.uid, user.email, label)
      .then(rows => {
        setDrills(rows)
      })
      .catch(err => {
        console.error('[DrillLibrary]', err)
        setDrills([])
        setLoadError(err instanceof Error ? err.message : 'Could not load drills')
      })
      .finally(() => setLoadingDrills(false))
  }, [user?.uid, user?.email, user?.displayName])

  useEffect(() => {
    fetchDrillEdits().then(edits => {
      const merged: DrillEdits = {}
      Object.entries(edits).forEach(([k, v]) => { merged[k] = v })
      setDrillEdits(merged)
    })
  }, [])

  useEffect(() => {
    reloadDrills()
  }, [reloadDrills])

  const canEdit = !!canEditPlans && !!user

  const displayDrill = (c: CustomDrill): Drill => {
    const base = storedToDrill(c)
    const key = drillEditKey(c.mod, c.name)
    const ed = drillEdits[key]
    return ed ? { ...base, ...ed } : base
  }

  const mineForMod = useMemo(
    () => drills.filter(d => d.createdByUid === user?.uid && d.mod === activeMod),
    [drills, user?.uid, activeMod],
  )

  const coachFolders = useMemo(() => {
    if (!isAdminUser || source !== 'all') return [] as Array<{ key: string; label: string; drills: CustomDrill[] }>
    const by = new Map<string, CustomDrill[]>()
    for (const d of drills.filter(x => x.mod === activeMod)) {
      const arr = by.get(d.createdByUid) ?? []
      arr.push(d)
      by.set(d.createdByUid, arr)
    }
    return Array.from(by.entries())
      .map(([uid, list]) => {
        const sorted = list.slice().sort((a, b) => a.obj.localeCompare(b.obj) || a.name.localeCompare(b.name))
        const label = sorted[0]?.createdBy ?? uid
        return { key: uid, label, drills: sorted }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [drills, activeMod, isAdminUser, source])

  const groupedMine = useMemo(() => {
    return mineForMod.reduce<Record<string, CustomDrill[]>>((acc, c) => {
      acc[c.obj] = acc[c.obj] ?? []
      acc[c.obj].push(c)
      return acc
    }, {})
  }, [mineForMod])

  const countForMod = (mod: ModuleKey) => {
    if (!user) return 0
    if (source === 'mine') return drills.filter(d => d.createdByUid === user.uid && d.mod === mod).length
    return drills.filter(d => d.mod === mod).length
  }

  const mineCount = user ? drills.filter(d => d.createdByUid === user.uid).length : 0

  // ── Drag / modal / create ────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, c: CustomDrill) => {
    const drill = displayDrill(c)
    e.dataTransfer.setData('application/json', JSON.stringify({ drill, mod: c.mod }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const [modal, setModal] = useState<{ stored: CustomDrill } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Drill>>({})
  const [saving, setSaving] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [savingCustom, setSavingCustom] = useState(false)
  const [confirmDelId, setConfirmDelId] = useState<string | null>(null)

  const openModal = (c: CustomDrill) => {
    setModal({ stored: c })
    setIsEditing(false)
    setEditForm({})
  }

  const startEditing = () => {
    if (!modal) return
    const d = displayDrill(modal.stored)
    setIsEditing(true)
    setEditForm({
      name: d.name,
      desc: d.desc,
      vars: d.vars,
      defaultMin: d.defaultMin,
      obj: d.obj,
      videoUrl: d.videoUrl ?? '',
    })
  }

  const handleSaveModalEdit = async () => {
    if (!modal || !user) return
    setSaving(true)
    try {
      const rawUrl = editForm.videoUrl?.trim() ?? ''
      const videoUrl = rawUrl ? toEmbedUrl(rawUrl) : undefined
      await saveCustomDrill(
        {
          id:          modal.stored.id,
          mod:         modal.stored.mod,
          name:        (editForm.name ?? modal.stored.name).trim(),
          obj:         (editForm.obj ?? '').trim() || 'Custom',
          desc:        (editForm.desc ?? '').trim(),
          vars:        (editForm.vars ?? '').trim(),
          defaultMin:  editForm.defaultMin ?? modal.stored.defaultMin,
          videoUrl,
          createdBy:   modal.stored.createdBy,
          createdByUid: modal.stored.createdByUid,
        },
        user.uid,
        isAdminUser,
      )
      reloadDrills()
      setModal(null)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, mod: activeMod })
    setShowCreate(true)
  }

  const handleSaveCustom = async () => {
    if (!user || !form.name.trim()) return
    setSavingCustom(true)
    try {
      const embed = form.videoUrl?.trim() ? toEmbedUrl(form.videoUrl.trim()) : undefined
      await saveCustomDrill(
        {
          mod: form.mod,
          name: form.name.trim(),
          obj: form.obj.trim() || 'Custom',
          desc: form.desc.trim(),
          vars: form.vars.trim(),
          defaultMin: form.defaultMin || 10,
          videoUrl: embed,
          createdBy: user.displayName ?? user.email ?? 'Coach',
          createdByUid: user.uid,
        },
        user.uid,
        isAdminUser,
      )
      reloadDrills()
      setShowCreate(false)
    } finally {
      setSavingCustom(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    await deleteCustomDrill(id, user.uid, isAdminUser)
    reloadDrills()
    setConfirmDelId(null)
    setModal(m => (m?.stored.id === id ? null : m))
  }

  const inp = "w-full px-2.5 py-1.5 text-xs rounded-md border border-white/10 bg-bg text-gray-200 placeholder-gray-600 focus:border-accent outline-none transition-colors resize-none"

  const canMutateStored = (c: CustomDrill) => canEdit && (c.createdByUid === user?.uid || isAdminUser)

  return (
    <>
      <aside className="w-full sm:w-72 sm:flex-shrink-0 border-b sm:border-b-0 sm:border-r border-white/7 bg-bg2 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-white/7 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-condensed text-base font-bold">Drills</h3>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent text-xs font-bold hover:bg-accent/25"
            >
              + New
            </button>
          )}
        </div>

        <div className="px-3 py-2 border-b border-white/7 flex gap-1 bg-bg3/40">
          <button
            type="button"
            onClick={() => setSource('mine')}
            className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${source === 'mine' ? 'bg-accent text-black' : 'text-gray-500 hover:text-white'}`}
          >
            My drills
            {mineCount > 0 && (
              <span className={`ml-1 opacity-90 tabular-nums ${source === 'mine' ? 'text-black/70' : ''}`}>{mineCount}</span>
            )}
          </button>
          {isAdminUser && (
            <button
              type="button"
              onClick={() => setSource('all')}
              className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${source === 'all' ? 'bg-bg2 text-white border border-white/15' : 'text-gray-500 hover:text-white'}`}
            >
              All coaches
            </button>
          )}
        </div>

        <div className="flex border-b border-white/7">
          {MODULES.map(mod => {
            const mc = MODULE_COLORS[mod]
            const n = countForMod(mod)
            return (
              <button
                key={mod}
                type="button"
                onClick={() => setActiveMod(mod)}
                className={`flex-1 py-2 text-xs font-black font-condensed tracking-wider uppercase transition-all border-b-2 relative
                  ${activeMod === mod ? `${mc.text} border-current` : 'text-gray-600 border-transparent hover:text-gray-400'}`}
              >
                {mod}
                {n > 0 && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {loadingDrills ? (
            <p className="text-gray-600 text-xs text-center py-10">Loading…</p>
          ) : loadError ? (
            <div className="text-rose-400 text-xs text-center py-6 px-2 space-y-2">
              <p className="font-semibold">Could not load drills</p>
              <p className="text-gray-500 break-words">{loadError}</p>
              <p className="text-gray-600">Check RTDB rules for <code className="text-gray-400">customDrills</code>.</p>
            </div>
          ) : source === 'mine' ? (
            mineForMod.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-10 px-2">No drills for this module yet. Use + New or wait for sync.</p>
            ) : (
              Object.entries(groupedMine).map(([obj, list]) => (
                <div key={obj} className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 px-1.5 py-1">{obj}</p>
                  {list.map(c => {
                    const d = displayDrill(c)
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={e => handleDragStart(e, c)}
                        onClick={e => {
                          if ((e.target as HTMLElement).closest('button')) return
                          openModal(c)
                        }}
                        className="w-full text-left p-2.5 mb-1 rounded-md border border-transparent bg-bg3 hover:border-white/10 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`inline-flex items-center justify-center text-xs font-black px-1.5 py-0.5 rounded font-condensed text-white ${MODULE_BG[c.mod]}`}>
                              {c.mod}
                            </span>
                            <p className="text-xs font-semibold text-white truncate">{d.name}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={ev => { ev.stopPropagation(); onAddDrill(d, c.mod) }}
                              className={`w-6 h-5 rounded text-xs font-bold ${MODULE_COLORS[c.mod].text} border ${MODULE_COLORS[c.mod].border}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate">by {c.createdBy}</p>
                      </div>
                    )
                  })}
                </div>
              ))
            )
          ) : (
            coachFolders.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-10">No drills in this module.</p>
            ) : (
              coachFolders.map(folder => (
                <div key={folder.key} className="mb-4 border border-white/10 rounded-lg overflow-hidden bg-bg3/30">
                  <div className="px-2.5 py-2 bg-bg3/80 border-b border-white/10 flex items-center gap-2">
                    <span className="text-lg leading-none" aria-hidden>📁</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{folder.label}</p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">{folder.key}</p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {folder.drills.map(c => {
                      const d = displayDrill(c)
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={e => handleDragStart(e, c)}
                          onClick={e => {
                            if ((e.target as HTMLElement).closest('button')) return
                            openModal(c)
                          }}
                          className="p-2 rounded border border-white/7 bg-bg hover:border-white/15 cursor-grab"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white truncate">{d.name}</span>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={ev => { ev.stopPropagation(); onAddDrill(d, c.mod) }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent border border-accent/30"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-0.5 truncate">{c.obj}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </aside>

      {/* Info / edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setModal(null); setIsEditing(false) }}>
          <div
            className={`bg-bg2 border border-white/10 rounded-xl p-6 w-full shadow-2xl ${
              displayDrill(modal.stored).videoUrl && !isEditing ? 'max-w-xl' : 'max-w-md'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex text-sm font-black px-2 py-1 rounded font-condensed text-white ${MODULE_BG[modal.stored.mod]}`}>
                  {modal.stored.mod}
                </span>
                <h3 className="font-condensed text-xl font-bold">
                  {isEditing ? 'Edit drill' : displayDrill(modal.stored).name}
                </h3>
              </div>
              <button type="button" className="text-gray-500 hover:text-white text-xl" onClick={() => { setModal(null); setIsEditing(false) }} aria-label="Close">×</button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <input className={inp} value={editForm.name ?? ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Name" />
                <input className={inp} value={editForm.obj ?? ''} onChange={e => setEditForm(p => ({ ...p, obj: e.target.value }))} placeholder="Objective" />
                <textarea className={inp + ' h-20'} value={editForm.desc ?? ''} onChange={e => setEditForm(p => ({ ...p, desc: e.target.value }))} />
                <textarea className={inp + ' h-16'} value={editForm.vars ?? ''} onChange={e => setEditForm(p => ({ ...p, vars: e.target.value }))} />
                <input className={inp} value={editForm.videoUrl ?? ''} onChange={e => setEditForm(p => ({ ...p, videoUrl: e.target.value }))} placeholder="Video URL" />
                <input type="number" min={1} max={60} className={inp + ' w-24'} value={editForm.defaultMin ?? 10} onChange={e => setEditForm(p => ({ ...p, defaultMin: parseInt(e.target.value, 10) || 10 }))} />
                <div className="flex gap-2">
                  <button type="button" disabled={saving} onClick={handleSaveModalEdit} className="flex-1 py-2 rounded-md bg-accent text-black text-sm font-bold disabled:opacity-50">Save</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-md border border-white/10 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-gray-300">{displayDrill(modal.stored).obj}</p>
                <p className="text-gray-300 leading-relaxed">{displayDrill(modal.stored).desc}</p>
                {displayDrill(modal.stored).vars && <p className="text-gray-400 text-xs leading-relaxed">{displayDrill(modal.stored).vars}</p>}
                {displayDrill(modal.stored).videoUrl && (() => {
                  const vu = displayDrill(modal.stored).videoUrl!
                  const src = vu.includes('youtube.com') ? `${vu}${vu.includes('?') ? '&' : '?'}rel=0&modestbranding=1` : vu
                  return (
                  <div className="rounded-lg overflow-hidden bg-black aspect-video">
                    <iframe
                      src={src}
                      title={displayDrill(modal.stored).name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  )
                })()}
                <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-white/10">
                  <span className="text-xs text-gray-500">{modal.stored.createdBy}</span>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {canMutateStored(modal.stored) && (
                      <>
                        <button type="button" onClick={startEditing} className="text-xs px-3 py-1.5 rounded border border-white/10 hover:border-white/20">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelId(modal.stored.id)}
                          className="text-xs px-3 py-1.5 rounded border border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => { onAddDrill(displayDrill(modal.stored), modal.stored.mod); setModal(null) }} className="text-xs px-3 py-1.5 rounded bg-accent text-black font-bold">+ Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / edit drawer modal */}
      {showCreate && user && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-bg2 border border-white/10 rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h4 className="font-condensed font-bold text-base mb-3">New drill</h4>
            <div className="space-y-2 text-xs">
              <select className={inp} value={form.mod} onChange={e => setForm(f => ({ ...f, mod: e.target.value as ModuleKey }))}>
                {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input className={inp} placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className={inp} placeholder="Objective" value={form.obj} onChange={e => setForm(f => ({ ...f, obj: e.target.value }))} />
              <textarea className={inp + ' h-16'} placeholder="Description" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
              <textarea className={inp + ' h-16'} placeholder="Variations" value={form.vars} onChange={e => setForm(f => ({ ...f, vars: e.target.value }))} />
              <input className={inp} placeholder="Video URL" value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} />
              <input type="number" className={inp + ' w-24'} min={1} max={60} value={form.defaultMin} onChange={e => setForm(f => ({ ...f, defaultMin: parseInt(e.target.value, 10) || 10 }))} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" disabled={savingCustom} onClick={handleSaveCustom} className="flex-1 py-2 rounded-lg bg-accent text-black text-xs font-bold">Save</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs border border-white/10 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelId && user && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setConfirmDelId(null)}>
          <div className="bg-bg2 border border-white/10 rounded-lg p-4 max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-white mb-3">Delete this drill from Firebase?</p>
            <div className="flex gap-2 justify-end">
              <button type="button" className="text-xs text-gray-400 px-3 py-1.5" onClick={() => setConfirmDelId(null)}>Cancel</button>
              <button type="button" className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded" onClick={() => handleDelete(confirmDelId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
