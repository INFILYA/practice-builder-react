import { initializeApp, getApps } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineSecret } from 'firebase-functions/params'

if (!getApps().length) initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')

/** Override in Cloud Functions env (GCP console) or local `functions/.env` — must match a verified domain in Resend for production. */
const DEFAULT_RESEND_FROM = 'Practice Builder <onboarding@resend.dev>'

type PlayerRow = {
  email?: string
  displayName?: string
  role?: string
  group?: string | null
}

type ScheduledSession = {
  id: string
  date: string
  group: string
  facility: string
  time: string
  duration: string
}

function dateInToronto(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const y = parts.find(p => p.type === 'year')?.value
  const m = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  if (!y || !m || !day) throw new Error('dateInToronto: missing parts')
  return `${y}-${m}-${day}`
}

/** Next Gregorian calendar day after `ymd` (YYYY-MM-DD). Used with Toronto “today” for “practice tomorrow”. */
function nextCalendarDateYmd(ymd: string): string {
  const [y, mo, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, mo - 1, d + 1))
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

async function sendResend(opts: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
}): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend ${res.status}: ${text}`)
  }
}

/**
 * Daily 16:00 America/Toronto: players with `practiceEmailReminders/{uid}.enabled`
 * get one email if their group has a (non-cancelled) session on the **next** calendar day
 * (i.e. the day **before** that practice — reminder at 4 PM Toronto).
 */
export const sendPracticeDayReminders = onSchedule(
  {
    schedule: '0 16 * * *',
    timeZone: 'America/Toronto',
    secrets: [resendApiKey],
    memory: '256MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db = getDatabase()
    const runDateToronto = dateInToronto()
    const practiceDayYmd = nextCalendarDateYmd(runDateToronto)
    const apiKey = resendApiKey.value()
    const from = process.env.RESEND_FROM?.trim() || DEFAULT_RESEND_FROM

    const [remSnap, sessionsSnap, cancelSnap] = await Promise.all([
      db.ref('practiceEmailReminders').get(),
      db.ref('schedule/sessions').get(),
      db.ref('schedule/cancellations').get(),
    ])

    if (!remSnap.exists()) {
      console.log('[sendPracticeDayReminders] no practiceEmailReminders tree')
      return
    }

    const reminders = remSnap.val() as Record<string, { enabled?: boolean } | null>
    const sessions: ScheduledSession[] = sessionsSnap.exists()
      ? Object.values(sessionsSnap.val() as Record<string, ScheduledSession>)
      : []
    const cancellations: Record<string, unknown> = cancelSnap.exists()
      ? (cancelSnap.val() as Record<string, unknown>)
      : {}

    const sessionsByGroupForPracticeDay = new Map<string, ScheduledSession[]>()
    for (const s of sessions) {
      if (s.date !== practiceDayYmd) continue
      const list = sessionsByGroupForPracticeDay.get(s.group) ?? []
      list.push(s)
      sessionsByGroupForPracticeDay.set(s.group, list)
    }

    if (sessionsByGroupForPracticeDay.size === 0) {
      console.log('[sendPracticeDayReminders] no sessions on practice day', practiceDayYmd, '(run date Toronto:', runDateToronto, ')')
      return
    }

    let sent = 0
    let skipped = 0

    for (const [uid, row] of Object.entries(reminders)) {
      if (!row?.enabled) {
        skipped++
        continue
      }

      const playerSnap = await db.ref(`players/${uid}`).get()
      if (!playerSnap.exists()) {
        console.warn('[sendPracticeDayReminders] no player for uid', uid)
        skipped++
        continue
      }

      const player = playerSnap.val() as PlayerRow
      if (player.role !== 'player') {
        skipped++
        continue
      }

      const email = (player.email ?? '').trim()
      if (!email) {
        console.warn('[sendPracticeDayReminders] no email for uid', uid)
        skipped++
        continue
      }

      const group = (player.group ?? '').trim()
      if (!group) {
        skipped++
        continue
      }

      const upcoming = (sessionsByGroupForPracticeDay.get(group) ?? []).filter(s => !cancellations[s.id])
      if (upcoming.length === 0) {
        skipped++
        continue
      }

      const name = (player.displayName ?? 'there').trim() || 'there'
      const lines = upcoming
        .map(s => {
          const hours = Math.round(Number.parseInt(s.duration, 10) / 60) || Number.parseInt(s.duration, 10) / 60
          return `<li><strong>${s.time}</strong> · ${s.facility} · ${hours}h <span style="color:#666">(${s.group})</span></li>`
        })
        .join('')

      const subject =
        upcoming.length === 1
          ? `Practice tomorrow — ${upcoming[0].time} @ ${upcoming[0].facility}`
          : `Practice tomorrow — ${upcoming.length} sessions`

      const html = `
        <p>Hi ${escapeHtml(name)},</p>
        <p>You have <strong>practice tomorrow</strong> (${escapeHtml(practiceDayYmd)} · Toronto):</p>
        <ul>${lines}</ul>
        <p style="font-size:14px;margin-top:14px"><strong>Please open Practice Builder</strong>, sign in for practice, and complete your <strong>wellness</strong> check before you arrive.</p>
        <p style="color:#666;font-size:13px;margin-top:12px">You’re receiving this because email reminders are turned on in Practice Builder.</p>
      `.trim()

      try {
        await sendResend({ apiKey, from, to: email, subject, html })
        sent++
        console.log('[sendPracticeDayReminders] sent to', email)
      } catch (e) {
        console.error('[sendPracticeDayReminders] Resend failed for', email, e)
      }
    }

    console.log('[sendPracticeDayReminders] done', { runDateToronto, practiceDayYmd, sent, skipped })
  },
)

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
