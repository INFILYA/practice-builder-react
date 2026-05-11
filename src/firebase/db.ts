import { ref, push, set, get, remove } from 'firebase/database'
import { db } from './config'
import type { SavedPlan, SavedPlanWithKey } from '../types'

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
