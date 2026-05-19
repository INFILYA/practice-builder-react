import { useEffect, useMemo, useState } from 'react'
import type { ScheduledSession } from '../../data/schedule'
import { getPracticeStartMs, startOfLocalDayFromYmd } from '../../utils/practiceSessionUtils'

function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return '0:00:00'
  const secsTotal = Math.floor(remainingMs / 1000)
  const h = Math.floor(secsTotal / 3600)
  const m = Math.floor((secsTotal % 3600) / 60)
  const s = secsTotal % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ringFractionRemaining(nowMs: number, practiceStartMs: number, practiceDateYmd: string): number {
  const dayStartMs = startOfLocalDayFromYmd(practiceDateYmd).getTime()
  const windowMs = Math.max(60_000, practiceStartMs - dayStartMs)
  const remaining = practiceStartMs - nowMs
  if (remaining <= 0) return 0
  return Math.min(1, remaining / windowMs)
}

const R = 42
const CIRC = 2 * Math.PI * R

interface Props {
  session: ScheduledSession
  isCancelled: boolean
  /** Extra classes on root (e.g. `mt-3 mb-0` when nested in schedule card). */
  className?: string
}

export function PracticeCountdownBanner({ session, isCancelled, className }: Props) {
  const practiceStartMs = useMemo(() => getPracticeStartMs(session), [session.date, session.time])
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const remainingMs = practiceStartMs - nowMs
  const frac = isCancelled ? 0 : ringFractionRemaining(nowMs, practiceStartMs, session.date)
  const dash = frac * CIRC
  const countdownLabel = isCancelled ? '—' : formatCountdown(remainingMs)

  return (
    <div className={`rounded-xl overflow-hidden border border-white/10 ${className ?? 'mb-4'}`}>
      <div className="flex items-stretch gap-0 min-h-[120px] sm:min-h-[132px]">
        <div className="flex-1 flex flex-col justify-center px-4 py-3 sm:px-5 bg-[#0f2744]">
          <p className="font-condensed text-base sm:text-lg font-black text-white uppercase tracking-wide leading-tight">
            Next practice
            <br />
            <span className="text-accent">in</span>
          </p>
          {!isCancelled && remainingMs <= 0 ? (
            <p className="text-[11px] text-white/60 mt-2 leading-snug">Practice time — head in when you&apos;re ready.</p>
          ) : isCancelled ? (
            <p className="text-[11px] text-red-300/90 mt-2">Session cancelled</p>
          ) : (
            <p className="mt-2 font-condensed text-base sm:text-lg font-black text-white/85 uppercase tracking-wide">
              {session.group.replace(' Boys', '').replace(' Girls', '')}
            </p>
          )}
        </div>

        <div className="w-[42%] max-w-[148px] flex-shrink-0 bg-lime-400 flex items-center justify-center p-3">
          <div className="relative w-[92px] h-[92px] sm:w-[104px] sm:h-[104px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="5" />
              {!isCancelled && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke="#166534"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${CIRC}`}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-condensed text-base sm:text-lg font-black text-neutral-900 tabular-nums tracking-tight">
                {countdownLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
