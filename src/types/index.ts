export type ModuleKey = 'M1' | 'M2' | 'M3' | 'GS' | 'WU'

export interface Drill {
  obj: string
  name: string
  desc: string
  vars: string
  defaultMin: number
  videoUrl?: string
  createdBy?: string
  createdByUid?: string
}

export interface PlanBlock {
  id: string
  mod: ModuleKey | 'CD'
  obj: string
  name: string
  desc: string
  vars: string
  mins: number
  notes: string
  videoUrl?: string
}

export interface SessionMeta {
  title: string
  group: string
  date: string
  duration: string
  facility: string
}

export interface SavedPlan extends SessionMeta {
  blocks: PlanBlock[]
  phase?: string        // SeasonPhase saved with the plan
  authorUid: string
  authorName: string
  updatedAt: number
}

export interface SavedPlanWithKey extends SavedPlan {
  key: string
}

export type GroupKey = string

export interface Player {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  role: 'coach' | 'player'
  group?: GroupKey | null
  position?: string
  jersey?: number
  dateOfBirth?: string     // "YYYY-MM-DD"
  createdAt: number
  canEditPlans?: boolean   // coach-only: allowed to create/edit/delete plans
}

export interface WellnessData {
  physical: 1 | 2 | 3 | 4 | 5   // body / physical readiness
  mental:   1 | 2 | 3 | 4 | 5   // mental / emotional state
  sleep:    1 | 2 | 3 | 4 | 5   // sleep quality last night
  concerns?: string              // optional free-text
}

export interface AttendanceRecord {
  displayName: string
  photoURL?: string
  signedAt: number
  present: true
  wellness?: WellnessData
}

export type AvailabilityStatus = 'available' | 'maybe' | 'unavailable'

export interface AvailabilityRecord {
  status: AvailabilityStatus
  displayName: string
  photoURL?: string
  reason?: string       // optional reason when unavailable
  updatedAt: number
}

export interface CancelledSession {
  sessionId: string     // matches ScheduledSession.id
  sessionKey: string    // "2026-06-02_18U Boys"
  cancelledAt: number
  cancelledByUid: string
  cancelledByName: string
  reason?: string
}

/** Stored under Realtime Database `practiceEmailReminders/{uid}` */
export interface PracticeEmailReminder {
  enabled: boolean
  updatedAt: number
}

/** Stored under Realtime Database `customDrills/{pushId}` */
export interface CustomDrill {
  id: string
  mod: ModuleKey
  name: string
  desc: string
  vars: string
  defaultMin: number
  obj: string
  videoUrl?: string
  createdBy: string
  createdByUid: string
  createdAt: number
  updatedAt: number
}
