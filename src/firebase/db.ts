import { ref, push, set, get, remove } from 'firebase/database'
import { db } from './config'
import type { Drill, SavedPlan, SavedPlanWithKey } from '../types'

type DrillEdit = Partial<Drill> & { mod: string; originalName: string; editedBy: string; updatedAt: number }

function drillEditKey(mod: string, name: string) {
  return `${mod}_${name.replace(/[^a-zA-Z0-9]/g, '_')}`
}

export async function saveDrillEdit(mod: string, drillName: string, edits: Partial<Drill>, editedBy: string): Promise<void> {
  const key = drillEditKey(mod, drillName)
  await set(ref(db, `drillEdits/${key}`), { ...edits, mod, originalName: drillName, editedBy, updatedAt: Date.now() })
}

export async function fetchDrillEdits(): Promise<Record<string, DrillEdit>> {
  const snap = await get(ref(db, 'drillEdits'))
  return snap.exists() ? (snap.val() as Record<string, DrillEdit>) : {}
}

export { drillEditKey }

export async function savePlan(plan: SavedPlan, key?: string): Promise<string> {
  if (key) {
    await set(ref(db, `plans/${key}`), plan)
    return key
  }
  const newRef = push(ref(db, 'plans'))
  await set(newRef, plan)
  return newRef.key!
}

export async function fetchAllPlans(): Promise<SavedPlanWithKey[]> {
  const snap = await get(ref(db, 'plans'))
  if (!snap.exists()) return []
  const raw = snap.val() as Record<string, SavedPlan>
  return Object.entries(raw)
    .map(([key, val]) => ({ ...val, key }))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}

export async function deletePlan(key: string): Promise<void> {
  await remove(ref(db, `plans/${key}`))
}
