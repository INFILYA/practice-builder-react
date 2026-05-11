import { useState } from "react";
import { SEASON_TEMPLATES } from "../../data/seasons";
import type { SeasonPhase } from "../../data/seasons";

interface Props {
  totalDurationMins: number;
  activePhase: SeasonPhase;
}

export function SeasonTemplate({ totalDurationMins, activePhase }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const template = SEASON_TEMPLATES.find((t) => t.phase === activePhase)!;

  return (
    <div className="border-b border-white/7">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-bg2 hover:bg-bg3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-accent font-condensed tracking-wider uppercase">
            Season Template
          </span>
          <span className="text-xs text-gray-500">— {template.label}</span>
        </div>
        <span className="text-gray-600 text-sm">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="bg-bg px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SEASON_TEMPLATES.map((t) => (
              <button
                key={t.phase}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activePhase === t.phase
                    ? "bg-accent text-black font-semibold"
                    : "border border-white/10 text-gray-400 hover:text-white hover:bg-bg3"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-3 italic">
            {template.description}
          </p>
          <div className="flex rounded-md overflow-hidden h-3 mb-4">
            {template.allocations.map((a) => (
              <div
                key={a.mod}
                style={{ width: a.pct + "%", backgroundColor: a.color }}
                title={a.label + " " + a.pct + "%"}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {template.allocations.map((a) => {
              const mins = Math.round((a.pct / 100) * totalDurationMins);
              return (
                <div
                  key={a.mod}
                  className="flex items-center justify-between px-3 py-2 rounded-md"
                  style={{ backgroundColor: a.bgColor }}
                >
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
                    <span className="text-xs font-bold text-white">
                      {mins}m
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{a.pct}%</span>
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
