import { ref, push, set, get, remove } from 'firebase/database'
import { db } from './config'
import type { Drill, ModuleKey, CustomDrill, SavedPlan, SavedPlanWithKey, Player, AttendanceRecord, AvailabilityRecord, CancelledSession, PracticeEmailReminder } from '../types'
import { DRILLS } from '../data/drills'
import type { ScheduledSession, GroupColorConfig } from '../data/schedule'

/** Coach gate for profile setup; override in `.env` as `VITE_COACH_PASSWORD=...` if needed. */
const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env
export const COACH_PASSWORD = (viteEnv?.VITE_COACH_PASSWORD?.trim() || 'practice2026')

// Emails that always get coach/admin access regardless of password
export const ADMIN_EMAILS = ['infilya89@gmail.com']

export function isAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes((email ?? '').toLowerCase())
}

/** Firebase RTDB rejects `undefined` anywhere in the payload. */
function omitUndefined<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined),
  ) as T
}

// ── Players ──────────────────────────────────────────────────────────────────

export async function savePlayer(player: Player): Promise<void> {
  // Admin emails always get coach role
  const resolved: Player = isAdminEmail(player.email)
    ? { ...player, role: 'coach' }
    : player
  const prevSnap = await get(ref(db, `players/${player.uid}`))
  const prev = prevSnap.exists() ? (prevSnap.val() as Player) : null
  const prevGroup = prev?.group ?? null
  const nextGroup = resolved.group ?? null

  await set(ref(db, `players/${player.uid}`), omitUndefined(resolved as unknown as Record<string, unknown>))

  if (prevGroup && prevGroup !== nextGroup) {
    await removeAvailabilityForGroupSessions(resolved.uid, prevGroup)
  }
}

// ── Practice-day email reminders (RTDB + Cloud Function + Resend) ─────────

export async function savePracticeEmailReminder(uid: string, enabled: boolean): Promise<void> {
  const row: PracticeEmailReminder = { enabled, updatedAt: Date.now() }
  await set(ref(db, `practiceEmailReminders/${uid}`), row)
}

export async function fetchPracticeEmailReminder(uid: string): Promise<PracticeEmailReminder | null> {
  const snap = await get(ref(db, `practiceEmailReminders/${uid}`))
  if (!snap.exists()) return null
  return snap.val() as PracticeEmailReminder
}

export async function fetchPlayer(uid: string): Promise<Player | null> {
  const snap = await get(ref(db, `players/${uid}`))
  return snap.exists() ? (snap.val() as Player) : null
}

export async function fetchPlayers(): Promise<Player[]> {
  const snap = await get(ref(db, 'players'))
  if (!snap.exists()) return []
  return Object.values(snap.val() as Record<string, Player>)
    .sort((a, b) => (a.displayName ?? '').localeCompare(b.displayName ?? ''))
}

export async function assignPlayerGroup(uid: string, group: Player['group']): Promise<void> {
  const prevSnap = await get(ref(db, `players/${uid}/group`))
  const prevGroup = prevSnap.exists() ? ((prevSnap.val() as string | null) ?? null) : null
  const nextGroup = group ?? null

  await set(ref(db, `players/${uid}/group`), nextGroup)

  if (prevGroup && prevGroup !== nextGroup) {
    await removeAvailabilityForGroupSessions(uid, prevGroup)
  }
}

export async function setCanEditPlans(uid: string, value: boolean): Promise<void> {
  await set(ref(db, `players/${uid}/canEditPlans`), value)
}

export async function deletePlayerProfile(uid: string): Promise<void> {
  await removeAllAvailabilityForPlayer(uid)
  await remove(ref(db, `players/${uid}`))
}

// ── Attendance ────────────────────────────────────────────────────────────────

// key format: "2026-06-02_18U Boys"
export async function signInForSession(
  sessionKey: string,
  uid: string,
  record: AttendanceRecord,
): Promise<void> {
  await set(ref(db, `attendance/${sessionKey}/${uid}`), record)
}

export async function removeAttendance(sessionKey: string, uid: string): Promise<void> {
  await remove(ref(db, `attendance/${sessionKey}/${uid}`))
}

export async function fetchAttendance(sessionKey: string): Promise<Record<string, AttendanceRecord>> {
  const snap = await get(ref(db, `attendance/${sessionKey}`))
  return snap.exists() ? (snap.val() as Record<string, AttendanceRecord>) : {}
}

// Fetch the entire attendance tree — used by coach for bulk stats
export async function fetchAllAttendance(): Promise<Record<string, Record<string, AttendanceRecord>>> {
  const snap = await get(ref(db, 'attendance'))
  return snap.exists() ? (snap.val() as Record<string, Record<string, AttendanceRecord>>) : {}
}

// Fetch ALL attendance records for a player across all sessions (for wellness history)
export async function fetchPlayerWellnessHistory(uid: string): Promise<
  Array<{ sessionKey: string; record: AttendanceRecord }>
> {
  const snap = await get(ref(db, 'attendance'))
  if (!snap.exists()) return []
  const all = snap.val() as Record<string, Record<string, AttendanceRecord>>
  const result: Array<{ sessionKey: string; record: AttendanceRecord }> = []
  for (const [sessionKey, players] of Object.entries(all)) {
    if (players[uid]) result.push({ sessionKey, record: players[uid] })
  }
  return result.sort((a, b) => a.sessionKey.localeCompare(b.sessionKey))
}

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
    .map(([key, val]) => ({ ...val, key, blocks: val.blocks ?? [] }))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}

export async function deletePlan(key: string): Promise<void> {
  await remove(ref(db, `plans/${key}`))
}

// ── Availability ─────────────────────────────────────────────────────────────

// sessionKey safe = spaces/special chars → underscores, e.g. "2026-06-02_18U Boys" → "2026-06-02_18U_Boys"
function availKey(sessionKey: string) { return sessionKey.replace(/[^a-zA-Z0-9_-]/g, '_') }

export async function setAvailability(sessionKey: string, uid: string, record: AvailabilityRecord): Promise<void> {
  await set(ref(db, `availability/${availKey(sessionKey)}/${uid}`), record)
}

export async function removeAvailability(sessionKey: string, uid: string): Promise<void> {
  await remove(ref(db, `availability/${availKey(sessionKey)}/${uid}`))
}

export async function fetchAvailability(sessionKey: string): Promise<Record<string, AvailabilityRecord>> {
  const snap = await get(ref(db, `availability/${availKey(sessionKey)}`))
  return snap.exists() ? (snap.val() as Record<string, AvailabilityRecord>) : {}
}

/** Remove this player's availability row under every session bucket (profile deleted). */
export async function removeAllAvailabilityForPlayer(uid: string): Promise<void> {
  const snap = await get(ref(db, 'availability'))
  if (!snap.exists()) return
  const encKeys = Object.keys(snap.val() as Record<string, unknown>)
  await Promise.all(encKeys.map(enc => remove(ref(db, `availability/${enc}/${uid}`))))
}

/** Remove availability only for sessions that belonged to `groupName` (player moved or unassigned). */
async function removeAvailabilityForGroupSessions(uid: string, groupName: string): Promise<void> {
  if (!groupName) return
  const sessions = await fetchSessions()
  const keys = sessions.filter(s => s.group === groupName).map(s => `${s.date}_${s.group}`)
  await Promise.all(keys.map(k => removeAvailability(k, uid)))
}

// ── Session Cancellations ─────────────────────────────────────────────────────

export async function cancelSession(session: { id: string; date: string; group: string }, uid: string, name: string, reason?: string): Promise<void> {
  const record: CancelledSession = {
    sessionId:        session.id,
    sessionKey:       `${session.date}_${session.group}`,
    cancelledAt:      Date.now(),
    cancelledByUid:   uid,
    cancelledByName:  name,
    reason,
  }
  await set(ref(db, `schedule/cancellations/${session.id}`), record)
}

export async function restoreSession(sessionId: string): Promise<void> {
  await remove(ref(db, `schedule/cancellations/${sessionId}`))
}

export async function fetchCancellations(): Promise<Record<string, CancelledSession>> {
  const snap = await get(ref(db, 'schedule/cancellations'))
  return snap.exists() ? (snap.val() as Record<string, CancelledSession>) : {}
}

// ── Schedule (practice sessions) ─────────────────────────────────────────────

export async function fetchSessions(): Promise<ScheduledSession[]> {
  const snap = await get(ref(db, 'schedule/sessions'))
  if (!snap.exists()) return []
  return Object.values(snap.val() as Record<string, ScheduledSession>)
    .sort((a, b) => a.date.localeCompare(b.date) || a.group.localeCompare(b.group))
}

export async function seedScheduleIfEmpty(sessions: ScheduledSession[]): Promise<void> {
  const snap = await get(ref(db, 'schedule/sessions'))
  if (snap.exists()) return
  const updates: Record<string, ScheduledSession> = {}
  for (const s of sessions) updates[s.id] = s
  await set(ref(db, 'schedule/sessions'), updates)
}

export async function saveSession(session: ScheduledSession): Promise<void> {
  await set(ref(db, `schedule/sessions/${session.id}`), session)
}

export async function deleteSession(id: string): Promise<void> {
  await remove(ref(db, `schedule/sessions/${id}`))
}

// key = group name with special chars replaced, e.g. "18U Boys" → "18U_Boys"
function groupKey(name: string) { return name.replace(/[^a-zA-Z0-9]/g, '_') }

export async function fetchGroupColors(): Promise<Record<string, GroupColorConfig>> {
  const snap = await get(ref(db, 'schedule/groupColors'))
  if (!snap.exists()) return {}
  // Firebase keys are encoded, re-map back by reading the stored name field
  const raw = snap.val() as Record<string, GroupColorConfig & { name: string }>
  const result: Record<string, GroupColorConfig> = {}
  for (const val of Object.values(raw)) {
    result[val.name] = { bg: val.bg }
  }
  return result
}

export async function saveGroupColor(name: string, bg: string): Promise<void> {
  await set(ref(db, `schedule/groupColors/${groupKey(name)}`), { name, bg })
}

export async function deleteGroupAndSessions(name: string): Promise<void> {
  // Remove color config
  await remove(ref(db, `schedule/groupColors/${groupKey(name)}`))
  // Remove all sessions for this group
  const snap = await get(ref(db, 'schedule/sessions'))
  if (!snap.exists()) return
  const all = snap.val() as Record<string, ScheduledSession>
  await Promise.all(
    Object.entries(all)
      .filter(([, s]) => s.group === name)
      .map(([id]) => remove(ref(db, `schedule/sessions/${id}`)))
  )
}

// ── Custom drills (per-coach; admin sees all + gets static pack as own) ─────

const CUSTOM_DRILLS_PATH = 'customDrills'
const ALL_MODULE_KEYS: ModuleKey[] = ['WU', 'M1', 'M2', 'M3', 'GS']

function customDrillDedupeKey(d: CustomDrill): string {
  return `${d.createdByUid ?? ''}\t${d.mod}\t${d.name}`
}

/** Same coach + module + name: keep newest by `updatedAt`/`createdAt`, remove extra RTDB children. */
async function removeDuplicateCustomDrillRows(list: CustomDrill[]): Promise<CustomDrill[]> {
  const byKey = new Map<string, CustomDrill[]>()
  for (const d of list) {
    const k = customDrillDedupeKey(d)
    const arr = byKey.get(k)
    if (arr) arr.push(d)
    else byKey.set(k, [d])
  }
  const toRemove: string[] = []
  const kept: CustomDrill[] = []
  for (const group of byKey.values()) {
    if (group.length === 1) {
      kept.push(group[0])
      continue
    }
    const sorted = group.slice().sort((a, b) => {
      const ta = a.updatedAt ?? a.createdAt ?? 0
      const tb = b.updatedAt ?? b.createdAt ?? 0
      if (tb !== ta) return tb - ta
      return a.id.localeCompare(b.id)
    })
    kept.push(sorted[0])
    for (let i = 1; i < sorted.length; i++) toRemove.push(sorted[i].id)
  }
  if (toRemove.length === 0) return list
  try {
    await Promise.all(toRemove.map(id => remove(ref(db, `${CUSTOM_DRILLS_PATH}/${id}`))))
  } catch (e) {
    console.error('[db] removeDuplicateCustomDrillRows', e)
  }
  return kept
}

function parseCustomDrillEntries(raw: Record<string, Omit<CustomDrill, 'id'> & { id?: string }>): CustomDrill[] {
  return Object.entries(raw).map(([id, row]) => ({ ...row, id: row.id ?? id }))
}

/** All drills under `customDrills/`; drops duplicate RTDB rows (same uid+mod+name). */
export async function fetchAllCustomDrillsFromDb(): Promise<CustomDrill[]> {
  const snap = await get(ref(db, CUSTOM_DRILLS_PATH))
  if (!snap.exists()) return []
  const list = parseCustomDrillEntries(snap.val() as Record<string, Omit<CustomDrill, 'id'> & { id?: string }>)
  return removeDuplicateCustomDrillRows(list)
}

/** For players: stable order then first `mod:name` with a video wins. */
export async function fetchAllCustomDrillsForVideoLookup(): Promise<CustomDrill[]> {
  const list = await fetchAllCustomDrillsFromDb()
  return list.slice().sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
}

/** Inserts any static `DRILLS` row missing under this admin uid (idempotent by mod+name). */
export async function ensureAdminStandardDrillsInCustomDrills(adminUid: string, adminLabel: string): Promise<void> {
  const list = await fetchAllCustomDrillsFromDb()
  const mine = new Set(list.filter(d => d.createdByUid === adminUid).map(d => `${d.mod}\t${d.name}`))
  const now = Date.now()
  for (const mod of ALL_MODULE_KEYS) {
    for (const drill of DRILLS[mod]) {
      if (mine.has(`${mod}\t${drill.name}`)) continue
      const newRef = push(ref(db, CUSTOM_DRILLS_PATH))
      const id = newRef.key!
      const row: CustomDrill = {
        id,
        mod,
        name:         drill.name,
        obj:          drill.obj,
        desc:         drill.desc,
        vars:         drill.vars,
        defaultMin:   drill.defaultMin,
        videoUrl:     drill.videoUrl,
        createdBy:    adminLabel,
        createdByUid: adminUid,
        createdAt:    now,
        updatedAt:    now,
      }
      await set(newRef, omitUndefined(row as unknown as Record<string, unknown>))
      mine.add(`${mod}\t${drill.name}`)
    }
  }
}

/**
 * Coaches: only their rows. Admin: all rows + seeds former static catalog under admin uid first.
 */
export async function fetchCustomDrillsForBuilder(
  viewerUid: string,
  viewerEmail: string | null | undefined,
  viewerLabel: string,
): Promise<CustomDrill[]> {
  const isAdmin = isAdminEmail(viewerEmail)
  if (isAdmin) {
    await ensureAdminStandardDrillsInCustomDrills(viewerUid, (viewerLabel || 'Coach').trim() || 'Coach')
  }
  const all = await fetchAllCustomDrillsFromDb()
  const list = isAdmin ? all : all.filter(d => d.createdByUid === viewerUid)
  return list.slice().sort((a, b) => {
    const byObj = (a.obj ?? '').localeCompare(b.obj ?? '')
    if (byObj !== 0) return byObj
    return (a.name ?? '').localeCompare(b.name ?? '')
  })
}

export async function saveCustomDrill(
  payload: Partial<CustomDrill> & Pick<CustomDrill, 'mod' | 'name' | 'obj' | 'desc' | 'vars' | 'defaultMin'> & { id?: string },
  editorUid: string,
  isAdminUser: boolean,
): Promise<string> {
  const now = Date.now()
  if (payload.id) {
    const prevSnap = await get(ref(db, `${CUSTOM_DRILLS_PATH}/${payload.id}`))
    if (!prevSnap.exists()) throw new Error('Drill not found')
    const prevVal = prevSnap.val() as Omit<CustomDrill, 'id'>
    const prev: CustomDrill = { ...prevVal, id: payload.id }
    if (prev.createdByUid !== editorUid && !isAdminUser) throw new Error('Not allowed to edit this drill')
    const next: CustomDrill = {
      ...prev,
      mod:        payload.mod,
      name:       payload.name,
      obj:        payload.obj,
      desc:       payload.desc,
      vars:       payload.vars,
      defaultMin: payload.defaultMin,
      videoUrl:   payload.videoUrl,
      updatedAt:  now,
    }
    await set(ref(db, `${CUSTOM_DRILLS_PATH}/${payload.id}`), omitUndefined(next as unknown as Record<string, unknown>))
    return payload.id
  }
  const newRef = push(ref(db, CUSTOM_DRILLS_PATH))
  const id = newRef.key!
  const row: CustomDrill = {
    id,
    mod:          payload.mod,
    name:         payload.name,
    obj:          payload.obj,
    desc:         payload.desc,
    vars:         payload.vars,
    defaultMin:   payload.defaultMin,
    videoUrl:     payload.videoUrl,
    createdBy:    payload.createdBy || 'Coach',
    createdByUid: editorUid,
    createdAt:    now,
    updatedAt:    now,
  }
  await set(newRef, omitUndefined(row as unknown as Record<string, unknown>))
  return id
}

export async function deleteCustomDrill(id: string, editorUid: string, isAdminUser: boolean): Promise<void> {
  const prevSnap = await get(ref(db, `${CUSTOM_DRILLS_PATH}/${id}`))
  if (!prevSnap.exists()) return
  const prevVal = prevSnap.val() as Omit<CustomDrill, 'id'>
  const prev: CustomDrill = { ...prevVal, id }
  if (prev.createdByUid !== editorUid && !isAdminUser) throw new Error('Not allowed to delete this drill')
  await remove(ref(db, `${CUSTOM_DRILLS_PATH}/${id}`))
}
