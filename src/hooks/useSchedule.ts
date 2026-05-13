import { useEffect, useState, useCallback } from 'react'
import { fetchSessions, seedScheduleIfEmpty, fetchGroupColors, fetchCancellations } from '../firebase/db'
import { SUMMER_SCHEDULE } from '../data/schedule'
import type { ScheduledSession, GroupColorConfig } from '../data/schedule'
import type { CancelledSession } from '../types'

export function useSchedule() {
  const [sessions,      setSessions]      = useState<ScheduledSession[]>(SUMMER_SCHEDULE)
  const [groupColors,   setGroupColors]   = useState<Record<string, GroupColorConfig>>({})
  const [cancellations, setCancellations] = useState<Record<string, CancelledSession>>({})

  const load = useCallback(async () => {
    try {
      const [fetched, colors, cancelled] = await Promise.all([
        fetchSessions(),
        fetchGroupColors(),
        fetchCancellations(),
      ])
      if (fetched.length === 0) {
        seedScheduleIfEmpty(SUMMER_SCHEDULE).catch(console.warn)
      } else {
        setSessions(fetched)
      }
      setGroupColors(colors)
      setCancellations(cancelled)
    } catch (err) {
      console.warn('Could not load schedule from Firebase, using local data:', err)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { sessions, groupColors, cancellations, refresh: load }
}
