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
  WU: [
    {
      obj: 'Warm Up',
      name: 'Resistance Band Warmup',
      desc: 'Shoulder and hip activation using resistance bands. Targets rotator cuff, glute med, and hip flexors — key muscle groups for overhead athletes.',
      vars: '① Band pull-aparts × 15  ② Band dislocates × 10  ③ Banded side steps × 20 each  ④ Banded glute bridges × 15  ⑤ External rotation × 12 each arm',
      defaultMin: 12,
      videoUrl: 'https://www.youtube.com/embed/ibvk-B_4VbA',
    },
    {
      obj: 'Warm Up',
      name: 'Volleyball-Specific Warmup',
      desc: 'Integrated warmup using a ball from the start. Combines movement patterns with basic ball-handling to warm up the nervous system in a volleyball-specific context.',
      vars: '① Self-set walking × 2 laps  ② Partner pepper (stationary) 2 min  ③ Partner pepper (moving) 2 min  ④ Free ball pass / set / hit chains × 5 min',
      defaultMin: 12,
      videoUrl: 'https://drive.google.com/file/d/1100GmhTcW-XycsSLcwGZC-kRMmsBeS6R/preview',
    },
    {
      obj: 'Warm Up',
      name: 'Core Activation Circuit',
      desc: 'Short core stability circuit to fire up the trunk before practice. Focuses on anti-rotation and bracing — critical for blocking, spiking, and landing mechanics.',
      vars: '① Dead bug × 8 each  ② Bird dog × 8 each  ③ Plank 30s  ④ Side plank 20s each  ⑤ Hollow hold 20s  ⑥ Glute bridge × 15',
      defaultMin: 10,
      videoUrl: 'https://www.youtube.com/embed/e83hcArgSCs',
    },
    {
      obj: 'Warm Up',
      name: 'Agility & Footwork Warmup',
      desc: 'Ladder and cone-based footwork warmup targeting quick feet, reactive steps, and directional change speed. Directly transfers to defensive movement and attack approach footwork.',
      vars: '① Ladder: two feet in × 2  ② Lateral in-out × 2  ③ Icky shuffle × 2  ④ Cone 5–10–5 × 3  ⑤ Reaction jumps on coach cue × 10',
      defaultMin: 12,
      videoUrl: 'https://www.youtube.com/embed/Yoo2KJ9AJdM',
    },
    {
      obj: 'Work Out',
      name: 'Med Ball Workout',
      desc: 'Medicine ball conditioning activating the full kinetic chain with rotational power patterns. Higher intensity than a standard warmup — treat as a physical preparation block.',
      vars: '① Overhead slam × 3×8  ② Rotational throw (wall) × 3×8 each  ③ Partner chest pass × 3×10  ④ Partner overhead throw × 3×10  ⑤ Squat to press × 3×10',
      defaultMin: 18,
      videoUrl: 'https://www.youtube.com/embed/DLjpE3HKyR0',
    },
    {
      obj: 'Work Out',
      name: 'Hurdles Workout',
      desc: 'Hurdles-based conditioning developing hip mobility, dynamic flexibility, and explosive leg drive. Higher intensity block — ideal before jump training or plyometric sessions.',
      vars: '① Forward hurdle step-overs × 3 laps  ② Lateral hurdle step-overs × 3  ③ Hurdle under-unders × 3  ④ Alternating lead leg × 2  ⑤ Sprint out after last hurdle × 4',
      defaultMin: 18,
      videoUrl: 'https://www.youtube.com/embed/SFFzebvmYiM',
    },
  ],
}

export const MODULE_LABELS: Record<ModuleKey, string> = {
  M1: 'M1 — Individual',
  M2: 'M2 — Partner / Small Group',
  M3: 'M3 — Team Systems',
  GS: 'Game Simulation',
  WU: 'Warm-Up',
}

export const MODULE_COLORS: Record<string, { badge: string; text: string; border: string }> = {
  WU: { badge: 'bg-orange-500/20 text-orange-300', text: 'text-orange-400', border: 'border-orange-500/40' },
  M1: { badge: 'bg-blue-500/20 text-blue-300',     text: 'text-blue-400',   border: 'border-blue-500/40' },
  M2: { badge: 'bg-violet-500/20 text-violet-300', text: 'text-violet-400', border: 'border-violet-500/40' },
  M3: { badge: 'bg-rose-500/20 text-rose-300',     text: 'text-rose-400',   border: 'border-rose-500/40' },
  GS: { badge: 'bg-emerald-500/20 text-emerald-300', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  CD: { badge: 'bg-teal-500/20 text-teal-300',     text: 'text-teal-400',   border: 'border-teal-500/40' },
}
