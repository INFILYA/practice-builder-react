import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchAllAttendance } from '../../firebase/db'
import { getGroupColor } from '../../data/schedule'
import { useSchedule } from '../../hooks/useSchedule'
import type { GroupKey } from '../../types'

const GROUPS: GroupKey[] = ['18U Boys', '17U Boys', '16U Boys']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface DataPoint {
  date:     string
  group:    GroupKey
  physical: number
  mental:   number
  sleep:    number
  count:    number
  sessions: number
}

interface Tooltip {
  x: number
  y: number
  pt: DataPoint
  metric: 'physical' | 'mental' | 'sleep'
}

const METRIC_COLORS = {
  physical: '#3b82f6',   // blue
  mental:   '#a855f7',   // purple
  sleep:    '#f59e0b',   // amber
} as const

const METRIC_LABELS = {
  physical: 'Physical',
  mental:   'Mental',
  sleep:    'Sleep',
} as const

function avg(vals: number[]) {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const cpx  = (prev.x + curr.x) / 2
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
  }
  return d
}

// Chart for a single group with 3 metric lines
function GroupChart({ group, data, sessions }: { group: GroupKey; data: DataPoint[]; sessions: { date: string; group: string }[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const W = 760
  const H = 220
  const PAD = { top: 16, right: 16, bottom: 36, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom

  const allDates  = Array.from(new Set(sessions.filter(s => s.group === group).map(s => s.date))).sort()
  const dateIndex = Object.fromEntries(allDates.map((d, i) => [d, i]))
  const xScale    = (d: string) => (dateIndex[d] / Math.max(allDates.length - 1, 1)) * innerW
  const yScale    = (v: number) => innerH - ((v - 1) / 4) * innerH

  const monthBoundaries: { x: number; label: string }[] = []
  let lastMonth = -1
  for (const d of allDates) {
    const m = parseInt(d.split('-')[1]) - 1
    if (m !== lastMonth) {
      monthBoundaries.push({ x: xScale(d), label: MONTH_SHORT[m] })
      lastMonth = m
    }
  }

  const metrics = (['physical', 'mental', 'sleep'] as const)

  if (!data.length) {
    return (
      <div className="h-20 flex items-center justify-center text-gray-700 text-sm">
        No wellness data yet for this group.
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 400 }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={`zone-${group.replace(/[^a-zA-Z0-9_-]/g, '_')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.07" />
            <stop offset="50%"  stopColor="#eab308" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.09" />
          </linearGradient>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Zone background */}
          <rect x={0} y={0} width={innerW} height={innerH} fill={`url(#zone-${group.replace(/[^a-zA-Z0-9_-]/g, '_')})`} rx={4} />
          <rect x={0} y={0}                 width={innerW} height={innerH * (1/4)} fill="#22c55e" fillOpacity={0.03} />
          <rect x={0} y={innerH * (1/4)}    width={innerW} height={innerH * (2/4)} fill="#eab308" fillOpacity={0.03} />
          <rect x={0} y={innerH * (3/4)}    width={innerW} height={innerH * (1/4)} fill="#ef4444" fillOpacity={0.05} />

          {/* Grid lines */}
          {[2, 3, 4].map(v => (
            <line key={v} x1={0} y1={yScale(v)} x2={innerW} y2={yScale(v)}
              stroke="white" strokeOpacity={0.07} strokeDasharray="4 4" />
          ))}

          {/* Month boundaries */}
          {monthBoundaries.map(({ x, label }) => (
            <g key={label}>
              <line x1={x} y1={0} x2={x} y2={innerH} stroke="white" strokeOpacity={0.06} />
              <text x={x + 3} y={innerH + 26} fill="#6b7280" fontSize={10} fontWeight={600}>{label}</text>
            </g>
          ))}

          {/* Y axis */}
          {[1, 2, 3, 4, 5].map(v => (
            <text key={v} x={-7} y={yScale(v) + 4} fill="#6b7280" fontSize={9} textAnchor="end">{v}</text>
          ))}

          {/* 3 metric lines */}
          {metrics.map(metric => {
            const pts = data.map(p => ({ x: xScale(p.date), y: yScale(p[metric]), pt: p }))
            if (pts.length < 1) return null
            const color = METRIC_COLORS[metric]
            return (
              <g key={metric}>
                {pts.length > 1 && (
                  <path
                    d={smoothPath(pts.map(p => ({ x: p.x, y: p.y })))}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={0.9}
                  />
                )}
                {pts.map(({ x, y, pt }, i) => {
                  const isHovered = tooltip?.pt === pt && tooltip?.metric === metric
                  return (
                    <circle
                      key={i}
                      cx={x} cy={y}
                      r={isHovered ? 5.5 : 3.5}
                      fill={color}
                      fillOpacity={isHovered ? 1 : 0.8}
                      stroke="white"
                      strokeWidth={isHovered ? 1.5 : 0.5}
                      style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                      onMouseEnter={() => setTooltip({ x: x + PAD.left, y: y + PAD.top, pt, metric })}
                    />
                  )
                })}
              </g>
            )
          })}

          {/* X axis base */}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="white" strokeOpacity={0.08} />
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (() => {
        const d = new Date(tooltip.pt.date + 'T12:00:00')
        const tW = 160
        const svgEl = svgRef.current
        const svgW  = svgEl?.clientWidth ?? W
        const scale = svgW / W
        const tx    = tooltip.x * scale
        const ty    = tooltip.y * scale
        const left  = tx + tW + 10 > svgW ? tx - tW - 8 : tx + 10
        const color = METRIC_COLORS[tooltip.metric]
        return (
          <div
            className="absolute pointer-events-none z-10 bg-bg3 border border-white/15 rounded-xl px-3 py-2.5 shadow-xl text-xs"
            style={{ top: ty - 10, left, width: tW }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="font-bold text-white">{METRIC_LABELS[tooltip.metric]}</span>
              <span className="text-gray-500 ml-auto">{MONTH_SHORT[d.getMonth()]} {d.getDate()}</span>
            </div>
            <div className="space-y-1">
              {metrics.map(m => (
                <div key={m} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: METRIC_COLORS[m] }} />
                  <span className="text-gray-400 flex-1">{METRIC_LABELS[m]}</span>
                  <span className={`font-bold ${
                    tooltip.pt[m] >= 4 ? 'text-green-400' : tooltip.pt[m] >= 3 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{tooltip.pt[m].toFixed(1)}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-600 mt-2">{tooltip.pt.count} wellness · {tooltip.pt.sessions} signed in</p>
          </div>
        )
      })()}
    </div>
  )
}

export function SeasonWellnessChart() {
  const [data,    setData]    = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [active,  setActive]  = useState<GroupKey>('18U Boys')
  const { sessions } = useSchedule()

  const chartGroups = useMemo(() => {
    const u = Array.from(new Set(sessions.map(s => s.group))).sort((a, b) => a.localeCompare(b))
    return (u.length ? u : GROUPS) as GroupKey[]
  }, [sessions])

  useEffect(() => {
    if (!chartGroups.includes(active)) {
      setActive(chartGroups[0] ?? '18U Boys')
    }
  }, [chartGroups, active])

  useEffect(() => {
    fetchAllAttendance().then(allAtt => {
      const pts: DataPoint[] = []
      for (const s of sessions) {
        const key     = `${s.date}_${s.group}`
        const records = allAtt[key] ?? {}
        const withW   = Object.values(records).filter(r => r.wellness)
        if (!withW.length) continue
        pts.push({
          date:     s.date,
          group:    s.group as GroupKey,
          physical: avg(withW.map(r => r.wellness!.physical)),
          mental:   avg(withW.map(r => r.wellness!.mental)),
          sleep:    avg(withW.map(r => r.wellness!.sleep)),
          count:    withW.length,
          sessions: Object.keys(records).length,
        })
      }
      pts.sort((a, b) => a.date.localeCompare(b.date))
      setData(pts)
      setLoading(false)
    })
  }, [sessions])

  const groupData = data.filter(p => p.group === active)
  const c = getGroupColor(active)

  return (
    <div className="p-5 space-y-4">
      {/* Header row: legend left, group switcher right */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Metric legend */}
        <div className="flex items-center gap-4 flex-wrap">
          {(['physical', 'mental', 'sleep'] as const).map(m => (
            <div key={m} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: METRIC_COLORS[m] }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: METRIC_COLORS[m] }} />
              <span className="text-xs text-gray-400">{METRIC_LABELS[m]}</span>
            </div>
          ))}
        </div>

        {/* Group switcher */}
        <div className="flex gap-1 bg-bg3/60 p-1 rounded-lg border border-white/7 flex-shrink-0">
          {chartGroups.map(g => {
            const gc = getGroupColor(g)
            return (
              <button
                key={g}
                onClick={() => setActive(g)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  active === g ? `${gc.bg} text-white` : 'text-gray-500 hover:text-white'
                }`}
              >
                {g.replace(' Boys', '')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Zone legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block opacity-60" /> Fresh (4–5)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block opacity-60" /> Normal (3–4)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block opacity-60" /> Fatigued (&lt;3)</span>
        <span className="flex items-center gap-1.5 ml-auto">
          <span className={`w-2 h-2 rounded-sm ${c.bg} inline-block`} />
          <span className="text-gray-400 font-medium">{active}</span>
          {!loading && <span className="text-gray-600">· {groupData.length} sessions with data</span>}
        </span>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center text-gray-600 text-sm">Loading wellness data…</div>
      ) : (
        <div className="bg-bg3/40 rounded-xl p-3">
          <GroupChart group={active} data={groupData} sessions={sessions} />
        </div>
      )}
    </div>
  )
}
