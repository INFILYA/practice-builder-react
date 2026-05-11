export type ModuleKey = 'M1' | 'M2' | 'M3' | 'GS'

export interface Drill {
  obj: string
  name: string
  desc: string
  vars: string
  defaultMin: number
}

export interface PlanBlock {
  id: string
  mod: ModuleKey | 'WU' | 'CD'
  obj: string
  name: string
  desc: string
  vars: string
  mins: number
  notes: string
}

export interface SessionMeta {
  title: string
  group: string
  date: string
  duration: '120' | '180'
  facility: string
}

export interface SavedPlan extends SessionMeta {
  blocks: PlanBlock[]
  authorUid: string
  authorName: string
  updatedAt: number
}

export interface SavedPlanWithKey extends SavedPlan {
  key: string
}
