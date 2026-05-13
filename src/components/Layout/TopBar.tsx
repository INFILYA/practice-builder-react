import { useState } from "react";
import type { User } from "firebase/auth";
import { ProfileEditModal } from "../Auth/ProfileEditModal";
import type { Player } from "../../types";

interface Props {
  user: User | null;
  player?: Player | null;
  activeView: "builder" | "schedule" | "players" | "coaches";
  isCoach: boolean;
  isAdmin: boolean;
  onSwitchView: (v: "builder" | "schedule" | "players" | "coaches") => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onProfileUpdated?: () => void;
}

export function TopBar({
  user,
  player,
  activeView,
  isCoach,
  isAdmin,
  onSwitchView,
  onSignIn,
  onSignOut,
  onProfileUpdated,
}: Props) {
  const [showEdit, setShowEdit] = useState(false)

  const navViews = (["builder", "schedule",
    ...(isCoach ? ["players" as const] : []),
    ...(isAdmin ? ["coaches" as const] : []),
  ] as const)

  const navLabel = (view: string) =>
    view === "builder"  ? { emoji: "🏗", short: "Builder",  full: "🏗 Builder"  }
    : view === "schedule" ? { emoji: "📅", short: "Schedule", full: "📅 Schedule" }
    : view === "players"  ? { emoji: "👥", short: "Players",  full: "👥 Players"  }
    :                       { emoji: "🎓", short: "Coaches",  full: "🎓 Coaches"  }

  return (
    <header className="flex flex-col border-b border-white/7 bg-bg2 flex-shrink-0">
      {/* Row 1: Logo + desktop nav + user controls */}
      <div className="h-12 sm:h-14 flex items-center px-5 sm:px-8 gap-2 sm:gap-4">
        <span className="font-condensed text-xl sm:text-2xl font-black tracking-tight">
          Practice<span className="text-accent">Builder</span>
        </span>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="w-px h-5 bg-white/10" />
          <nav className="flex gap-1 bg-bg3/60 p-1 rounded-lg border border-white/7">
            {navViews.map((view) => (
              <button
                key={view}
                onClick={() => onSwitchView(view)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all select-none ${
                  activeView === view
                    ? "bg-accent text-black shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/8"
                }`}
              >
                {navLabel(view).full}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1" />

        {/* User controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => player ? setShowEdit(true) : undefined}
                title="Edit profile"
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full border border-white/7 bg-bg3 text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="w-6 h-6 sm:w-5 sm:h-5 rounded-full" />
                )}
                <span className="hidden sm:inline text-sm">{user.displayName?.split(" ")[0] ?? user.email}</span>
                {player && <span className="hidden sm:inline text-xs text-gray-600">✎</span>}
              </button>
              <button
                onClick={onSignOut}
                className="px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm border border-white/10 text-gray-400 hover:text-white hover:bg-bg3 transition-all"
              >
                <span className="hidden sm:inline">Sign out</span>
                <span className="sm:hidden">↩</span>
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-accent text-black hover:opacity-90 transition-all"
            >
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign in</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Mobile nav — hidden on desktop */}
      <nav className="sm:hidden flex gap-1.5 px-5 pb-3 overflow-x-auto">
        {navViews.map((view) => {
          const l = navLabel(view)
          return (
            <button
              key={view}
              onClick={() => onSwitchView(view)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all select-none flex-shrink-0 ${
                activeView === view
                  ? "bg-accent text-black shadow-sm"
                  : "text-gray-400 bg-bg3/60 border border-white/7 hover:text-white"
              }`}
            >
              <span>{l.emoji}</span>
              <span>{l.short}</span>
            </button>
          )
        })}
      </nav>

      {showEdit && user && player && (
        <ProfileEditModal
          user={user}
          player={player}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); onProfileUpdated?.() }}
          onDeleted={() => { setShowEdit(false); onProfileUpdated?.() }}
        />
      )}

    </header>
  );
}
