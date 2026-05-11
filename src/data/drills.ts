import type { Drill, ModuleKey } from '../types'

export const DRILLS: Record<ModuleKey, Drill[]> = {
  M1: [
    {
      obj: 'Free Ball',
      name: 'All Around the World',
      desc: '6 players at net (1.5m back), rest move in circle passing to them. 1 full circle = 6 passes. Continuous cycling.',
      vars: '① Overhead 9m  ② Overhead 9→3→9→3m  ③ Underhand 9m  ④ Underhand 9→3→9→3m',
      defaultMin: 12,
    },
    {
      obj: 'Free Ball',
      name: 'Floor is Lava',
      desc: "Pairs pass while slowly moving forward. Designated 'lava' zone on court — cannot be stepped on.",
      vars: '① Lava center (6m gap)  ② Lava sidelines (3m corridor)  ③ Overhead  ④ Underhand  ⑤ Advanced: step both feet in lava after each pass then return',
      defaultMin: 10,
    },
    {
      obj: 'Free Ball',
      name: '3-Ball Rotation',
      desc: '3 players per side on 3m line in zones 4,3,2. 3 balls simultaneously. Each passes straight across net then shifts to next zone. Timed team challenge.',
      vars: '① Overhead  ② Underhand  Goal: keep all 3 balls in the air',
      defaultMin: 10,
    },
    {
      obj: 'Setting',
      name: 'Star Drill',
      desc: '6–8 players, 2 setters (★). Two balls in play simultaneously. Setters focus on delivery, others on free ball passes.',
      vars: '① 2 balls in play  ② Setter switch every 2 min  ③ Direction switch every 4 min (4→2 / 2→4)',
      defaultMin: 15,
    },
    {
      obj: 'Setting',
      name: 'Wind Rose',
      desc: 'Players distributed across all zones. Setter at zone 3. Pass and move by rule.',
      vars: '① Base: pass to zone → follow ball  ② Advanced: pass zone 3→4 → move to zone 2  ③ Through net: follow ball → join zone 6 queue  ④ After 4 min: back row bumps',
      defaultMin: 15,
    },
    {
      obj: 'Setting',
      name: 'OOS Sets',
      desc: '2 coaches on endline throw balls chaotically. Players perform out-of-system sets from wherever the ball lands.',
      vars: '① Base: OOS set from any position  ② After block: jump → turn → OOS set  ③ After dig/fall: get up → OOS set  ④ Positional: set direction based on court position',
      defaultMin: 15,
    },
  ],
  M2: [],
  M3: [],
  GS: [],
}

export const MODULE_LABELS: Record<ModuleKey, string> = {
  M1: 'M1 — Individual',
  M2: 'M2 — Partner / Small Group',
  M3: 'M3 — Team Systems',
  GS: 'Game Simulation',
}

export const MODULE_COLORS: Record<string, { badge: string; text: string; border: string }> = {
  M1: { badge: 'bg-blue-500/20 text-blue-300',   text: 'text-blue-400',   border: 'border-blue-500/40' },
  M2: { badge: 'bg-purple-500/20 text-purple-300', text: 'text-purple-400', border: 'border-purple-500/40' },
  M3: { badge: 'bg-red-500/20 text-red-300',      text: 'text-red-400',    border: 'border-red-500/40' },
  GS: { badge: 'bg-green-500/20 text-green-300',  text: 'text-green-400',  border: 'border-green-500/40' },
  WU: { badge: 'bg-orange-500/20 text-orange-300', text: 'text-orange-400', border: 'border-orange-500/40' },
  CD: { badge: 'bg-teal-500/20 text-teal-300',    text: 'text-teal-400',   border: 'border-teal-500/40' },
}
