import type { User } from "firebase/auth";
import type { SeasonPhase } from "../../data/seasons";
import { SEASON_TEMPLATES } from "../../data/seasons";

const PHASE_ICONS: Record<SeasonPhase, string> = {
  "general-prep": "🏋️",
  "specific-prep": "⚙️",
  "pre-competition": "🎯",
  competition: "🏆",
  transition: "🔄",
};

interface Props {
  user: User;
  activeView: "builder" | "saved";
  activePhase: SeasonPhase;
  onSwitchView: (v: "builder" | "saved") => void;
  onPhaseChange: (p: SeasonPhase) => void;
  onSignOut: () => void;
}

export function TopBar({
  user,
  activeView,
  activePhase,
  onSwitchView,
  onPhaseChange,
  onSignOut,
}: Props) {
  return (
    <header className="flex flex-col border-b border-white/7 bg-bg2 flex-shrink-0">
      {/* Top row */}
      <div className="h-13 flex items-center px-5 gap-4">
        <span className="font-condensed text-2xl font-black tracking-tight">
          Practice<span className="text-accent">Builder</span>
        </span>
        <div className="w-px h-5 bg-white/10" />
        <nav className="flex gap-1">
          {(["builder", "saved"] as const).map((view) => (
            <button
              key={view}
              onClick={() => onSwitchView(view)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeView === view ? "bg-bg3 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-bg3"}`}
            >
              {view === "builder" ? "Builder" : "Saved Plans"}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/7 bg-bg3 text-sm text-gray-400">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-5 h-5 rounded-full"
              />
            )}
            <span>{user.displayName?.split(" ")[0] ?? user.email}</span>
          </div>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-md text-sm border border-white/10 text-gray-400 hover:text-white hover:bg-bg3 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Season phase row */}
      <div className="flex items-center gap-2 px-5 py-2 border-t border-white/5 overflow-x-auto">
        <span className="text-xs text-gray-600 font-condensed uppercase tracking-wider flex-shrink-0">
          Season:
        </span>
        {SEASON_TEMPLATES.map((t) => {
          const isActive = activePhase === t.phase;
          return (
            <button
              key={t.phase}
              onClick={() => onPhaseChange(t.phase)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0
                ${
                  isActive
                    ? "bg-accent text-black font-semibold"
                    : "border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
            >
              <span>{PHASE_ICONS[t.phase]}</span>
              <span>{t.label}</span>
              {isActive && <span className="ml-0.5">✓</span>}
            </button>
          );
        })}
      </div>
    </header>
  );
}
