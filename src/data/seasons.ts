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
      {
        mod: "WU",
        label: "Warm-Up",
        pct: 15,
        color: "#f0a866",
        bgColor: "rgba(230,126,34,0.15)",
      },
      {
        mod: "M1",
        label: "M1 Individual",
        pct: 45,
        color: "#6ab0f5",
        bgColor: "rgba(46,134,222,0.15)",
      },
      {
        mod: "M2",
        label: "M2 Partner",
        pct: 20,
        color: "#c39bd3",
        bgColor: "rgba(142,68,173,0.15)",
      },
      {
        mod: "M3",
        label: "M3 Team",
        pct: 5,
        color: "#e08070",
        bgColor: "rgba(192,57,43,0.15)",
      },
      {
        mod: "GS",
        label: "Game Sim",
        pct: 10,
        color: "#7dcea0",
        bgColor: "rgba(39,174,96,0.15)",
      },
      {
        mod: "CD",
        label: "Cool-Down",
        pct: 5,
        color: "#76d7c4",
        bgColor: "rgba(20,143,119,0.15)",
      },
    ],
  },
  {
    phase: "specific-prep",
    label: "Specific Preparation",
    description: "Technical refinement, combinations, increasing team work",
    allocations: [
      {
        mod: "WU",
        label: "Warm-Up",
        pct: 15,
        color: "#f0a866",
        bgColor: "rgba(230,126,34,0.15)",
      },
      {
        mod: "M1",
        label: "M1 Individual",
        pct: 30,
        color: "#6ab0f5",
        bgColor: "rgba(46,134,222,0.15)",
      },
      {
        mod: "M2",
        label: "M2 Partner",
        pct: 25,
        color: "#c39bd3",
        bgColor: "rgba(142,68,173,0.15)",
      },
      {
        mod: "M3",
        label: "M3 Team",
        pct: 15,
        color: "#e08070",
        bgColor: "rgba(192,57,43,0.15)",
      },
      {
        mod: "GS",
        label: "Game Sim",
        pct: 10,
        color: "#7dcea0",
        bgColor: "rgba(39,174,96,0.15)",
      },
      {
        mod: "CD",
        label: "Cool-Down",
        pct: 5,
        color: "#76d7c4",
        bgColor: "rgba(20,143,119,0.15)",
      },
    ],
  },
  {
    phase: "pre-competition",
    label: "Pre-Competition",
    description:
      "System integration, game-like pressure, peak performance prep",
    allocations: [
      {
        mod: "WU",
        label: "Warm-Up",
        pct: 10,
        color: "#f0a866",
        bgColor: "rgba(230,126,34,0.15)",
      },
      {
        mod: "M1",
        label: "M1 Individual",
        pct: 15,
        color: "#6ab0f5",
        bgColor: "rgba(46,134,222,0.15)",
      },
      {
        mod: "M2",
        label: "M2 Partner",
        pct: 20,
        color: "#c39bd3",
        bgColor: "rgba(142,68,173,0.15)",
      },
      {
        mod: "M3",
        label: "M3 Team",
        pct: 25,
        color: "#e08070",
        bgColor: "rgba(192,57,43,0.15)",
      },
      {
        mod: "GS",
        label: "Game Sim",
        pct: 25,
        color: "#7dcea0",
        bgColor: "rgba(39,174,96,0.15)",
      },
      {
        mod: "CD",
        label: "Cool-Down",
        pct: 5,
        color: "#76d7c4",
        bgColor: "rgba(20,143,119,0.15)",
      },
    ],
  },
  {
    phase: "competition",
    label: "Competition",
    description: "Maintain sharpness, tactical focus, game simulation dominant",
    allocations: [
      {
        mod: "WU",
        label: "Warm-Up",
        pct: 10,
        color: "#f0a866",
        bgColor: "rgba(230,126,34,0.15)",
      },
      {
        mod: "M1",
        label: "M1 Individual",
        pct: 10,
        color: "#6ab0f5",
        bgColor: "rgba(46,134,222,0.15)",
      },
      {
        mod: "M2",
        label: "M2 Partner",
        pct: 15,
        color: "#c39bd3",
        bgColor: "rgba(142,68,173,0.15)",
      },
      {
        mod: "M3",
        label: "M3 Team",
        pct: 25,
        color: "#e08070",
        bgColor: "rgba(192,57,43,0.15)",
      },
      {
        mod: "GS",
        label: "Game Sim",
        pct: 35,
        color: "#7dcea0",
        bgColor: "rgba(39,174,96,0.15)",
      },
      {
        mod: "CD",
        label: "Cool-Down",
        pct: 5,
        color: "#76d7c4",
        bgColor: "rgba(20,143,119,0.15)",
      },
    ],
  },
  {
    phase: "transition",
    label: "Transition",
    description: "Active recovery, fun activities, low intensity",
    allocations: [
      {
        mod: "WU",
        label: "Warm-Up",
        pct: 20,
        color: "#f0a866",
        bgColor: "rgba(230,126,34,0.15)",
      },
      {
        mod: "M1",
        label: "M1 Individual",
        pct: 40,
        color: "#6ab0f5",
        bgColor: "rgba(46,134,222,0.15)",
      },
      {
        mod: "M2",
        label: "M2 Partner",
        pct: 20,
        color: "#c39bd3",
        bgColor: "rgba(142,68,173,0.15)",
      },
      {
        mod: "M3",
        label: "M3 Team",
        pct: 5,
        color: "#e08070",
        bgColor: "rgba(192,57,43,0.15)",
      },
      {
        mod: "GS",
        label: "Game Sim",
        pct: 10,
        color: "#7dcea0",
        bgColor: "rgba(39,174,96,0.15)",
      },
      {
        mod: "CD",
        label: "Cool-Down",
        pct: 5,
        color: "#76d7c4",
        bgColor: "rgba(20,143,119,0.15)",
      },
    ],
  },
];
