import { useState } from "react";
import { SEASON_TEMPLATES } from "../../data/seasons";
import type { SeasonPhase } from "../../data/seasons";
import type { PlanBlock } from "../../types";

const PHASE_ICONS: Record<SeasonPhase, string> = {
  "general-prep":      "🏋️",
  "specific-prep":     "⚙️",
  "pre-competition":   "🎯",
  competition:         "🏆",
  transition:          "🔄",
}

interface Props {
  totalDurationMins: number;
  activePhase: SeasonPhase;
  blocks: PlanBlock[];
  onPhaseChange: (p: SeasonPhase) => void;
}

export function SeasonTemplate({ totalDurationMins, activePhase, blocks, onPhaseChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const template = SEASON_TEMPLATES.find((t) => t.phase === activePhase)!;

  const usedByMod = blocks.reduce<Record<string, number>>((acc, b) => {
    acc[b.mod] = (acc[b.mod] ?? 0) + b.mins;
    return acc;
  }, {});

  return (
    <div className="border-b border-white/7 bg-bg2">
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 pt-2.5 pb-1.5 hover:bg-bg3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-accent font-condensed tracking-wider uppercase">
            Season Template
          </span>
          <span className="text-xs text-gray-500">— {template.label}</span>
        </div>
        <span className="text-gray-600 text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Always-visible progress bar */}
      <div className="px-4 pb-3">
        <div className="flex rounded-lg overflow-hidden gap-px" style={{ height: '52px' }}>
          {template.allocations.map((a) => {
            const budgetMins = Math.round((a.pct / 100) * totalDurationMins);
            const usedMins = usedByMod[a.mod] ?? 0;
            const fillPct = budgetMins > 0
              ? Math.min((usedMins / budgetMins) * 100, 100)
              : 0;
            const isOver = usedMins > budgetMins;
            const isEmpty = usedMins === 0;

            return (
              <div
                key={a.mod}
                style={{ width: a.pct + "%" }}
                className="relative overflow-hidden flex-shrink-0"
                title={`${a.label}: ${usedMins}/${budgetMins} min`}
              >
                {/* Budget background (dim = free space) */}
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: a.color + "22" }}
                />
                {/* Used fill (solid = occupied) */}
                {fillPct > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                    style={{
                      width: fillPct + "%",
                      backgroundColor: isOver ? "#ef4444bb" : a.color + "cc",
                    }}
                  />
                )}
                {/* Over-budget red stripe overlay */}
                {isOver && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 4px, #ef4444 4px, #ef4444 6px)",
                    }}
                  />
                )}
                {/* Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-1">
                  <span
                    className="text-xs font-black font-condensed leading-none tracking-wide"
                    style={{
                      color: isEmpty ? a.color : fillPct > 50 ? "#fff" : a.color,
                      opacity: isEmpty ? 0.6 : 1,
                    }}
                  >
                    {a.mod}
                  </span>
                  <span
                    className="text-xs leading-snug font-medium tabular-nums"
                    style={{
                      color: isOver
                        ? "#fca5a5"
                        : fillPct > 50
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {usedMins}/{budgetMins}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collapsible detail */}
      {isOpen && (
        <div className="bg-bg px-4 pb-4 pt-1">
          {/* Phase selector */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {SEASON_TEMPLATES.map((t) => {
              const isActive = activePhase === t.phase
              return (
                <button
                  key={t.phase}
                  onClick={() => onPhaseChange(t.phase)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-accent text-black font-semibold"
                      : "border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <span>{PHASE_ICONS[t.phase]}</span>
                  <span>{t.label}</span>
                  {isActive && <span className="ml-0.5">✓</span>}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-gray-500 mb-3 italic">
            {template.description}
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {template.allocations.map((a) => {
              const budgetMins = Math.round((a.pct / 100) * totalDurationMins);
              const usedMins = usedByMod[a.mod] ?? 0;
              const isOver = usedMins > budgetMins;
              const fillPct = budgetMins > 0
                ? Math.min((usedMins / budgetMins) * 100, 100)
                : 0;
              return (
                <div
                  key={a.mod}
                  className="px-3 py-2 rounded-md overflow-hidden relative"
                  style={{ backgroundColor: a.bgColor }}
                >
                  {/* Mini fill bar at bottom */}
                  <div
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-300"
                    style={{
                      width: fillPct + "%",
                      backgroundColor: isOver ? "#ef4444" : a.color,
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: a.color }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: a.color }}
                      >
                        {a.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isOver ? "text-red-400" : "text-white"
                        }`}
                      >
                        {usedMins}/{budgetMins}m
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        {a.pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Based on {totalDurationMins} min · Volleyball Canada periodization
          </p>
        </div>
      )}
    </div>
  );
}
