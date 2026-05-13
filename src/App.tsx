import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { usePlan } from "./hooks/usePlan";
import { useSchedule } from "./hooks/useSchedule";
import { TopBar } from "./components/Layout/TopBar";
import { DrillLibrary } from "./components/Library/DrillLibrary";
import { PlanBuilder } from "./components/Builder/PlanBuilder";
import { ScheduleCalendar } from "./components/Schedule/ScheduleCalendar";
import { AttendancePanel } from "./components/Schedule/AttendancePanel";
import { ProfileSetup } from "./components/Auth/ProfileSetup";
import { PlayerDashboard } from "./components/Player/PlayerDashboard";
import { PlayerList } from "./components/Roster/PlayerList";
import { CoachesList } from "./components/Roster/CoachesList";
import type { Drill, ModuleKey, SavedPlanWithKey, Player } from "./types";
import { SEASON_TEMPLATES } from "./data/seasons";
import type { SeasonPhase } from "./data/seasons";
import type { ScheduledSession } from "./data/schedule";
import { fetchAllPlans, deletePlan, isAdminEmail } from "./firebase/db";

export default function App() {
  const { user, player, loading, signIn, signOut, refreshPlayer } = useAuth();
  const plan = usePlan();
  const { sessions, groupColors, cancellations, refresh: refreshSchedule } = useSchedule();
  const [view, setView]             = useState<"builder" | "schedule" | "players" | "coaches">("builder");
  const [activePhase, setPhase]     = useState<SeasonPhase>("specific-prep");
  const [mobileBuildTab, setMobileBuildTab] = useState<"drills" | "plan">("plan");
  const [toast, setToast]       = useState("");
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // All saved plans — for calendar ✓ marks
  const [allPlans, setAllPlans] = useState<SavedPlanWithKey[]>([]);
  const refreshPlans = useCallback(async () => {
    setAllPlans(await fetchAllPlans());
  }, []);
  useEffect(() => { refreshPlans(); }, [refreshPlans]);

  const switchView = useCallback((v: "builder" | "schedule" | "players" | "coaches") => {
    if (v === "schedule") refreshPlans();
    setView(v);
  }, [refreshPlans]);

  // Map: "2026-06-02_18U Boys" → SavedPlanWithKey (newest wins)
  const plansBySession = allPlans.reduce<Record<string, SavedPlanWithKey>>((acc, p) => {
    const k = `${p.date}_${p.group}`;
    if (p.date && p.group && !acc[k]) acc[k] = p;
    return acc;
  }, {});
  const savedPlanDates = new Set(Object.keys(plansBySession));

  // Session currently loaded in builder (for AttendancePanel)
  const currentSessionKey = plan.meta.date && plan.meta.group
    ? `${plan.meta.date}_${plan.meta.group}`
    : null;

  const showToast = useCallback(
    (msg: string) => {
      setToast(msg);
      if (toastTimer) clearTimeout(toastTimer);
      setToastTimer(setTimeout(() => setToast(""), 2500));
    },
    [toastTimer],
  );

  const handleAddDrill = useCallback(
    (drill: Drill, mod: ModuleKey) => {
      const sessionMins  = parseInt(plan.meta.duration);
      const currentTotal = plan.blocks.reduce((sum, b) => sum + b.mins, 0);
      if (currentTotal + drill.defaultMin > sessionMins) {
        showToast(`Session full — no time left (${currentTotal}/${sessionMins} min)`);
        return;
      }
      const template   = SEASON_TEMPLATES.find((t) => t.phase === activePhase)!;
      const allocation = template.allocations.find((a) => a.mod === mod);
      if (allocation) {
        const budgetMins = Math.round((allocation.pct / 100) * sessionMins);
        const usedMins   = plan.blocks.filter((b) => b.mod === mod).reduce((sum, b) => sum + b.mins, 0);
        if (usedMins >= budgetMins) showToast(`${mod} over its budget — borrowing time from other modules`);
      }
      plan.addBlock(drill, mod);
    },
    [activePhase, plan, showToast],
  );

  const handleDeleteSession = useCallback(
    async (session: ScheduledSession) => {
      const key      = `${session.date}_${session.group}`;
      const existing = plansBySession[key];
      if (!existing) return;
      await deletePlan(existing.key);
      await refreshPlans();
      showToast("Plan deleted");
    },
    [plansBySession, refreshPlans, showToast],
  );

  const handleSelectSession = useCallback(
    (session: ScheduledSession) => {
      const key      = `${session.date}_${session.group}`;
      const existing = plansBySession[key];
      if (existing) {
        plan.loadPlan(existing.key, existing);
        if (existing.phase) setPhase(existing.phase as SeasonPhase);
        setView("builder");
        showToast(`Plan loaded — ${session.group} · ${session.facility} ✓`);
      } else {
        plan.startFromSchedule({
          group:    session.group,
          date:     session.date,
          duration: session.duration,
          facility: session.facility,
        });
        setView("builder");
        showToast(`New plan — ${session.group} · ${session.facility} · ${parseInt(session.duration) / 60}h`);
      }
    },
    [plan, plansBySession, showToast],
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || player === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-condensed text-xl text-gray-500">Loading…</p>
      </div>
    );
  }

  // ── Profile setup (signed in but no profile yet) ───────────────────────────
  if (user && player === null) {
    return (
      <ProfileSetup
        user={user}
        onComplete={(p: Player) => { refreshPlayer(p); showToast(`Welcome, ${p.displayName}!`); }}
      />
    );
  }

  // ── Player view ────────────────────────────────────────────────────────────
  if (user && player && player.role === 'player') {
    return <PlayerDashboard user={user} player={player} sessions={sessions} cancellations={cancellations} onSignOut={signOut} onProfileUpdated={refreshPlayer} />;
  }

  // ── Coach / unauthenticated view ───────────────────────────────────────────
  const isCoach      = !!player && player.role === 'coach';
  const canEditPlans = isAdminEmail(user?.email) || (player?.canEditPlans === true);
  const canManageAgeGroups = isAdminEmail(user?.email);

  return (
    <div className="h-[100dvh] flex flex-col">
      <TopBar
        user={user}
        player={player}
        activeView={view}
        isCoach={isCoach}
        isAdmin={canEditPlans && isAdminEmail(user?.email)}
        onSwitchView={switchView}
        onSignIn={signIn}
        onSignOut={signOut}
        onProfileUpdated={refreshPlayer}
      />

      <div className="flex flex-1 overflow-hidden">
        {view === "builder" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile tab switcher — Drills / Plan */}
            <div className="sm:hidden flex-shrink-0 flex border-b border-white/7 bg-bg2">
              <button
                onClick={() => setMobileBuildTab("drills")}
                className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
                  mobileBuildTab === "drills" ? "text-accent border-accent" : "text-gray-600 border-transparent"
                }`}
              >
                📚 Drill Library
              </button>
              <button
                onClick={() => setMobileBuildTab("plan")}
                className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
                  mobileBuildTab === "plan" ? "text-accent border-accent" : "text-gray-600 border-transparent"
                }`}
              >
                📋 Build Plan
              </button>
            </div>

            {/* Content row */}
            <div className="flex flex-1 overflow-hidden">
              {/* DrillLibrary: visible on mobile only when drills tab active */}
              <div className={mobileBuildTab === "drills"
                ? "flex flex-col flex-1 overflow-hidden sm:flex-none sm:flex-shrink-0"
                : "hidden sm:flex sm:flex-shrink-0"
              }>
                <DrillLibrary
                  user={user}
                  canEditPlans={canEditPlans}
                  onAddDrill={(d, m) => { handleAddDrill(d, m); setMobileBuildTab("plan") }}
                />
              </div>

              {/* Plan area */}
              <div className={`flex-1 flex flex-col overflow-hidden ${mobileBuildTab === "plan" ? "" : "hidden sm:flex"}`}>
                {isCoach && currentSessionKey && (
                  <AttendancePanel
                    sessionKey={currentSessionKey}
                    group={plan.meta.group}
                    date={plan.meta.date}
                  />
                )}
                <PlanBuilder
                  user={user}
                  blocks={plan.blocks}
                  meta={plan.meta}
                  editingKey={plan.editingKey}
                  totalMins={plan.totalMins}
                  activePhase={activePhase}
                  canEditPlans={canEditPlans}
                  onPhaseChange={setPhase}
                  onMetaChange={plan.setMeta}
                  onRemoveBlock={plan.removeBlock}
                  onUpdateBlock={plan.updateBlock}
                  onClear={plan.clearPlan}
                  onSaved={(key) => { plan.setEditingKey(key); refreshPlans(); }}
                  onToast={showToast}
                  onAddDrill={handleAddDrill}
                />
              </div>
            </div>
          </div>
        )}
        {view === "players" && <PlayerList isAdmin={isAdminEmail(user?.email)} />}
        {view === "coaches" && user && <CoachesList currentUserUid={user.uid} />}
        {view === "schedule" && (
          <ScheduleCalendar
            sessions={sessions}
            groupColors={groupColors}
            cancellations={cancellations}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onScheduleChanged={refreshSchedule}
            savedPlanDates={savedPlanDates}
            isCoach={isCoach}
            canEditPlans={canEditPlans}
            canManageAgeGroups={canManageAgeGroups}
            currentUser={user}
            currentPlayer={player}
          />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-bg3 border border-white/10 px-4 py-2.5 rounded-lg text-sm text-white shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
