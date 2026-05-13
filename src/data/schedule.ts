export interface ScheduledSession {
  id: string
  date: string         // "2026-06-02"
  group: string        // e.g. "18U Boys", "17U Girls" — extensible
  facility: string
  time: string         // "19:00"
  duration: string     // minutes as string, e.g. "120" or "180"
}

export interface GroupColorConfig {
  bg: string           // Tailwind bg class, e.g. "bg-blue-600"
}

export const SUMMER_SCHEDULE: ScheduledSession[] = [
  // ── JUNE ──────────────────────────────────────────────────────
  { id: 'j01', date: '2026-06-02', group: '18U Boys', facility: 'MPAC',     time: '19:00', duration: '180' },
  { id: 'j02', date: '2026-06-03', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'j03', date: '2026-06-03', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'j04', date: '2026-06-04', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'j05', date: '2026-06-05', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'j06', date: '2026-06-05', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'j07', date: '2026-06-09', group: '18U Boys', facility: 'MPAC',     time: '19:00', duration: '180' },
  { id: 'j08', date: '2026-06-10', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'j09', date: '2026-06-10', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'j10', date: '2026-06-11', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'j11', date: '2026-06-12', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'j12', date: '2026-06-12', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'j13', date: '2026-06-16', group: '18U Boys', facility: 'MPAC',     time: '19:00', duration: '180' },
  { id: 'j14', date: '2026-06-17', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'j15', date: '2026-06-17', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'j16', date: '2026-06-18', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'j17', date: '2026-06-19', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'j18', date: '2026-06-19', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'j19', date: '2026-06-23', group: '18U Boys', facility: 'MPAC',     time: '19:00', duration: '180' },
  { id: 'j20', date: '2026-06-24', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'j21', date: '2026-06-24', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'j22', date: '2026-06-25', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'j23', date: '2026-06-26', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'j24', date: '2026-06-26', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'j25', date: '2026-06-30', group: '18U Boys', facility: 'MPAC',     time: '19:00', duration: '180' },

  // ── JULY ──────────────────────────────────────────────────────
  // July 1 = Canada Day (no permits)
  { id: 'u03', date: '2026-07-02', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'u04', date: '2026-07-03', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'u05', date: '2026-07-03', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'u06', date: '2026-07-07', group: '18U Boys', facility: 'MPAC',     time: '20:00', duration: '120' },
  { id: 'u07', date: '2026-07-07', group: '17U Boys', facility: 'MPAC',     time: '18:00', duration: '120' },
  { id: 'u08', date: '2026-07-08', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'u09', date: '2026-07-08', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'u10', date: '2026-07-09', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'u11', date: '2026-07-10', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'u12', date: '2026-07-14', group: '18U Boys', facility: 'MPAC',     time: '20:00', duration: '120' },
  { id: 'u13', date: '2026-07-14', group: '17U Boys', facility: 'MPAC',     time: '18:00', duration: '120' },
  { id: 'u14', date: '2026-07-15', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'u15', date: '2026-07-15', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'u16', date: '2026-07-16', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'u17', date: '2026-07-17', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'u18', date: '2026-07-21', group: '18U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'u19', date: '2026-07-22', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'u20', date: '2026-07-22', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'u21', date: '2026-07-23', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'u22', date: '2026-07-24', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'u23', date: '2026-07-24', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'u24', date: '2026-07-28', group: '18U Boys', facility: 'MPAC',     time: '20:00', duration: '120' },
  { id: 'u25', date: '2026-07-28', group: '17U Boys', facility: 'MPAC',     time: '18:00', duration: '120' },
  { id: 'u26', date: '2026-07-29', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'u27', date: '2026-07-29', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'u28', date: '2026-07-30', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'u30', date: '2026-07-31', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },

  // ── AUGUST ────────────────────────────────────────────────────
  { id: 'a01', date: '2026-08-04', group: '18U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a02', date: '2026-08-05', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a03', date: '2026-08-05', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'a04', date: '2026-08-06', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'a05', date: '2026-08-07', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a06', date: '2026-08-07', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'a07', date: '2026-08-11', group: '18U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a08', date: '2026-08-12', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a09', date: '2026-08-12', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'a10', date: '2026-08-13', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'a11', date: '2026-08-14', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a12', date: '2026-08-14', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'a13', date: '2026-08-18', group: '18U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a14', date: '2026-08-19', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a15', date: '2026-08-19', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'a16', date: '2026-08-20', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'a17', date: '2026-08-21', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a18', date: '2026-08-21', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'a19', date: '2026-08-25', group: '18U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a20', date: '2026-08-26', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a21', date: '2026-08-26', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
  { id: 'a22', date: '2026-08-27', group: '18U Boys', facility: 'Mount Joy',time: '20:00', duration: '120' },
  { id: 'a23', date: '2026-08-28', group: '17U Boys', facility: 'Coliseum', time: '20:00', duration: '120' },
  { id: 'a24', date: '2026-08-28', group: '16U Boys', facility: 'Coliseum', time: '18:00', duration: '120' },
]

// Default colors for the 3 original groups
export const GROUP_COLORS: Record<string, { bg: string; text: string }> = {
  '18U Boys': { bg: 'bg-blue-600',   text: 'text-white' },
  '17U Boys': { bg: 'bg-violet-600', text: 'text-white' },
  '16U Boys': { bg: 'bg-rose-600',   text: 'text-white' },
}

// Fallback palette for groups not in GROUP_COLORS
export const COLOR_PALETTE: { bg: string; label: string }[] = [
  { bg: 'bg-blue-600',    label: 'Blue'    },
  { bg: 'bg-violet-600',  label: 'Purple'  },
  { bg: 'bg-rose-600',    label: 'Red'     },
  { bg: 'bg-amber-500',   label: 'Amber'   },
  { bg: 'bg-green-600',   label: 'Green'   },
  { bg: 'bg-cyan-600',    label: 'Cyan'    },
  { bg: 'bg-pink-600',    label: 'Pink'    },
  { bg: 'bg-emerald-600', label: 'Emerald' },
  { bg: 'bg-orange-500',  label: 'Orange'  },
  { bg: 'bg-teal-600',    label: 'Teal'    },
]

const FALLBACK_COLORS = COLOR_PALETTE.map(c => c.bg)

// Destination queries for each known facility
const FACILITY_DESTINATIONS: Record<string, string> = {
  'MPAC':      'Markham Pan Am Centre, Richmond Hill, ON',
  'Coliseum':  'Markham Coliseum, Markham, ON',
  'Mount Joy': 'Mount Joy Community Centre, Markham, ON',
}

function buildMapsDirectionsUrl(destination: string, origin?: string): string {
  const base = 'https://www.google.com/maps/dir/?api=1'
  const d = `&destination=${encodeURIComponent(destination)}`
  const o = origin ? `&origin=${encodeURIComponent(origin)}` : ''
  return `${base}${o}${d}`
}

/** Opens Google Maps with a route from the user's current GPS location to the facility. */
export function openFacilityDirections(facility: string): void {
  const dest = FACILITY_DESTINATIONS[facility] ?? facility

  const open = (origin?: string) =>
    window.open(buildMapsDirectionsUrl(dest, origin), '_blank', 'noopener,noreferrer')

  if (!navigator.geolocation) { open(); return }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => open(`${coords.latitude},${coords.longitude}`),
    ()           => open(),   // permission denied or unavailable — Google Maps will ask
    { timeout: 6000, maximumAge: 60000 },
  )
}

export function getGroupColor(
  group: string,
  dynamicColors: Record<string, { bg: string }> = {},
): { bg: string; text: string } {
  if (dynamicColors[group]) return { ...dynamicColors[group], text: 'text-white' }
  if (GROUP_COLORS[group])  return GROUP_COLORS[group]
  // Deterministic fallback based on group name hash
  const idx = group.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % FALLBACK_COLORS.length
  return { bg: FALLBACK_COLORS[idx], text: 'text-white' }
}
