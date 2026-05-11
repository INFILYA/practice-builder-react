export type SeasonPhase =
  | "general-prep"
  | "specific-prep"
  | "pre-competition"
  | "competition"
  | "transition";

export interface BlockAllocation {
  mod: string;
  label: string;
  pct: number;
  color: string;
  bgColor: string;
}

export interface SeasonTemplate {
  phase: SeasonPhase;
  label: string;
  description: string;
  allocations: BlockAllocation[];
}

export const SEASON_TEMPLATES: SeasonTemplate[] = [
  {
    phase: "general-prep",
    label: "General Preparation",
    description: "Physical base, individual fundamentals, high M1 volume",
    allocations: [
      { mod: "WU", label: "Warm-Up",      pct: 15, color: "#f97316", bgColor: "rgba(249,115,22,0.15)" },
      { mod: "M1", label: "M1 Individual", pct: 45, color: "#3b82f6", bgColor: "rgba(59,130,246,0.15)" },
      { mod: "M2", label: "M2 Partner",    pct: 20, color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)" },
      { mod: "M3", label: "M3 Team",       pct: 5,  color: "#f43f5e", bgColor: "rgba(244,63,94,0.15)" },
      { mod: "GS", label: "Game Sim",      pct: 15, color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
    ],
  },
  {
    phase: "specific-prep",
    label: "Specific Preparation",
    description: "Technical refinement, combinations, increasing team work",
    allocations: [
      { mod: "WU", label: "Warm-Up",      pct: 15, color: "#f97316", bgColor: "rgba(249,115,22,0.15)" },
      { mod: "M1", label: "M1 Individual", pct: 30, color: "#3b82f6", bgColor: "rgba(59,130,246,0.15)" },
      { mod: "M2", label: "M2 Partner",    pct: 25, color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)" },
      { mod: "M3", label: "M3 Team",       pct: 15, color: "#f43f5e", bgColor: "rgba(244,63,94,0.15)" },
      { mod: "GS", label: "Game Sim",      pct: 15, color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
    ],
  },
  {
    phase: "pre-competition",
    label: "Pre-Competition",
    description: "System integration, game-like pressure, peak performance prep",
    allocations: [
      { mod: "WU", label: "Warm-Up",      pct: 10, color: "#f97316", bgColor: "rgba(249,115,22,0.15)" },
      { mod: "M1", label: "M1 Individual", pct: 15, color: "#3b82f6", bgColor: "rgba(59,130,246,0.15)" },
      { mod: "M2", label: "M2 Partner",    pct: 20, color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)" },
      { mod: "M3", label: "M3 Team",       pct: 25, color: "#f43f5e", bgColor: "rgba(244,63,94,0.15)" },
      { mod: "GS", label: "Game Sim",      pct: 30, color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
    ],
  },
  {
    phase: "competition",
    label: "Competition",
    description: "Maintain sharpness, tactical focus, game simulation dominant",
    allocations: [
      { mod: "WU", label: "Warm-Up",      pct: 10, color: "#f97316", bgColor: "rgba(249,115,22,0.15)" },
      { mod: "M1", label: "M1 Individual", pct: 10, color: "#3b82f6", bgColor: "rgba(59,130,246,0.15)" },
      { mod: "M2", label: "M2 Partner",    pct: 15, color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)" },
      { mod: "M3", label: "M3 Team",       pct: 25, color: "#f43f5e", bgColor: "rgba(244,63,94,0.15)" },
      { mod: "GS", label: "Game Sim",      pct: 40, color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
    ],
  },
  {
    phase: "transition",
    label: "Transition",
    description: "Active recovery, fun activities, low intensity",
    allocations: [
      { mod: "WU", label: "Warm-Up",      pct: 20, color: "#f97316", bgColor: "rgba(249,115,22,0.15)" },
      { mod: "M1", label: "M1 Individual", pct: 40, color: "#3b82f6", bgColor: "rgba(59,130,246,0.15)" },
      { mod: "M2", label: "M2 Partner",    pct: 20, color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)" },
      { mod: "M3", label: "M3 Team",       pct: 5,  color: "#f43f5e", bgColor: "rgba(244,63,94,0.15)" },
      { mod: "GS", label: "Game Sim",      pct: 15, color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
    ],
  },
];
