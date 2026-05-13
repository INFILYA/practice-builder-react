import { useState } from 'react'
import type { WellnessData } from '../../types'

interface Props {
  sessionLabel: string  // e.g. "Jun 2 · MPAC · 3h"
  onConfirm: (wellness: WellnessData) => void
  onCancel: () => void
}

const CATEGORIES = [
  {
    key: 'physical' as const,
    label: 'Physical readiness',
    desc: 'How does your body feel today?',
    low: 'Very sore / injured',
    high: 'Feeling great',
    colors: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'],
  },
  {
    key: 'mental' as const,
    label: 'Mental state',
    desc: 'How are you feeling mentally?',
    low: 'Stressed / anxious',
    high: 'Focused / motivated',
    colors: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'],
  },
  {
    key: 'sleep' as const,
    label: 'Sleep last night',
    desc: 'How was your sleep?',
    low: 'Poor (< 5h)',
    high: 'Excellent (8h+)',
    colors: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'],
  },
]

function ScoreRow({
  category,
  value,
  onChange,
}: {
  category: typeof CATEGORIES[0]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-white">{category.label}</p>
        <p className="text-xs text-gray-500">{category.desc}</p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-lg font-bold text-sm transition-all border-2 ${
              value === n
                ? `${category.colors[n - 1]} text-white border-white/30 scale-105`
                : 'bg-bg3 text-gray-500 border-transparent hover:border-white/20 hover:text-white'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{category.low}</span>
        <span>{category.high}</span>
      </div>
    </div>
  )
}

export function WellnessModal({ sessionLabel, onConfirm, onCancel }: Props) {
  const [physical, setPhysical] = useState<number>(0)
  const [mental,   setMental]   = useState<number>(0)
  const [sleep,    setSleep]    = useState<number>(0)
  const [concerns, setConcerns] = useState('')
  const [error,    setError]    = useState('')

  const missing = [
    physical === 0 && 'Physical',
    mental   === 0 && 'Mental',
    sleep    === 0 && 'Sleep',
  ].filter(Boolean) as string[]

  const handleSubmit = () => {
    if (missing.length > 0) {
      setError(`Please rate: ${missing.join(', ')}`)
      return
    }
    setError('')
    const trimmed = concerns.trim()
    const wellness: WellnessData = {
      physical: physical as WellnessData['physical'],
      mental:   mental   as WellnessData['mental'],
      sleep:    sleep    as WellnessData['sleep'],
    }
    if (trimmed) wellness.concerns = trimmed
    onConfirm(wellness)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-bg2 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/7 flex-shrink-0">
          <h2 className="font-condensed text-2xl font-black">Wellness Check-in</h2>
          <p className="text-xs text-gray-500 mt-0.5">{sessionLabel}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {CATEGORIES.map(cat => (
            <ScoreRow
              key={cat.key}
              category={cat}
              value={cat.key === 'physical' ? physical : cat.key === 'mental' ? mental : sleep}
              onChange={cat.key === 'physical' ? setPhysical : cat.key === 'mental' ? setMental : setSleep}
            />
          ))}

          {/* Concerns — truly optional, no validation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-white">Concerns or notes</label>
              <span className="text-xs text-gray-600 bg-bg3 px-2 py-0.5 rounded-full">optional — can leave blank</span>
            </div>
            <textarea
              value={concerns}
              onChange={e => setConcerns(e.target.value)}
              rows={2}
              required={false}
              placeholder="Any injuries, soreness, or things the coach should know…"
              className="w-full bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-accent placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-white/7">
          {error && (
            <p className="text-xs text-red-400 font-medium mb-2 text-center">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-bg3 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                missing.length === 0
                  ? 'bg-accent text-black hover:opacity-90'
                  : 'bg-accent/40 text-black/60'
              }`}
            >
              {missing.length === 0 ? 'Sign in for practice ✓' : 'Sign in for practice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
