import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { usePlan } from "./hooks/usePlan";
import { TopBar } from "./components/Layout/TopBar";
import { DrillLibrary } from "./components/Library/DrillLibrary";
import { PlanBuilder } from "./components/Builder/PlanBuilder";
import { SavedPlans } from "./components/SavedPlans/SavedPlans";
import { ScheduleCalendar } from "./components/Schedule/ScheduleCalendar";
import type { Drill, ModuleKey, SavedPlanWithKey } from "./types";
import { SEASON_TEMPLATES } from "./data/seasons";
import type { SeasonPhase } from "./data/seasons";
import type { ScheduledSession } from "./data/schedule";
import { fetchAllPlans } from "./firebase/db";

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const plan = usePlan();
  const [view, setView] = useState<"builder" | "saved" | "schedule">("builder");
  const [activePhase, setPhase] = useState<SeasonPhase>("specific-prep");
  const [toast, setToast] = useState("");
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // All saved plans — used to match calendar sessions to existing plans
  const [allPlans, setAllPlans] = useState<SavedPlanWithKey[]>([]);
  const refreshPlans = useCallback(async () => {
    setAllPlans(await fetchAllPlans());
  }, []);
  useEffect(() => { refreshPlans(); }, [refreshPlans]);

  // Map: "2026-06-02_18U Boys" → SavedPlanWithKey
  const plansBySession = allPlans.reduce<Record<string, SavedPlanWithKey>>((acc, p) => {
    if (p.date && p.group) acc[`${p.date}_${p.group}`] = p;
    return acc;
  }, {});
  const savedPlanDates = new Set(Object.keys(plansBySession));

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
      const sessionMins = parseInt(plan.meta.duration);
      const currentTotal = plan.blocks.reduce((sum, b) => sum + b.mins, 0);

      // Hard limit: total session time
      if (currentTotal + drill.defaultMin > sessionMins) {
        showToast(`Session full — no time left (${currentTotal}/${sessionMins} min)`);
        return;
      }

      // Soft warning: module is over its phase allocation
      const template = SEASON_TEMPLATES.find((t) => t.phase === activePhase)!;
      const allocation = template.allocations.find((a) => a.mod === mod);
      if (allocation) {
        const budgetMins = Math.round((allocation.pct / 100) * sessionMins);
        const usedMins = plan.blocks
          .filter((b) => b.mod === mod)
          .reduce((sum, b) => sum + b.mins, 0);
        if (usedMins >= budgetMins) {
          showToast(`${mod} over its budget — borrowing time from other modules`);
        }
      }

      plan.addBlock(drill, mod);
    },
    [activePhase, plan, showToast],
  );

  const handleLoad = useCallback(
    (key: string, saved: SavedPlanWithKey) => {
      plan.loadPlan(key, saved);
      setView("builder");
      showToast("Plan loaded ✓");
    },
    [plan, showToast],
  );

  const handleSelectSession = useCallback(
    (session: ScheduledSession) => {
      const key = `${session.date}_${session.group}`;
      const existing = plansBySession[key];
      if (existing) {
        // Load the saved plan — fully editable
        plan.loadPlan(existing.key, existing);
        setView("builder");
        showToast(`Plan loaded — ${session.group} · ${session.facility} ✓`);
      } else {
        // Start fresh with session meta pre-filled
        plan.startFromSchedule({
          group: session.group,
          date: session.date,
          duration: session.duration,
          facility: session.facility,
        });
        setView("builder");
        showToast(`New plan — ${session.group} · ${session.facility} · ${parseInt(session.duration) / 60}h`);
      }
    },
    [plan, plansBySession, showToast],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-condensed text-xl text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        user={user}
        activeView={view}
        activePhase={activePhase}
        onSwitchView={setView}
        onPhaseChange={setPhase}
        onSignIn={signIn}
        onSignOut={signOut}
      />

      <div className="flex flex-1 overflow-hidden">
        {view === "builder" && (
          <>
            <DrillLibrary user={user} onAddDrill={handleAddDrill} />
            <PlanBuilder
              user={user}
              blocks={plan.blocks}
              meta={plan.meta}
              editingKey={plan.editingKey}
              totalMins={plan.totalMins}
              activePhase={activePhase}
              onMetaChange={plan.setMeta}
              onRemoveBlock={plan.removeBlock}
              onUpdateBlock={plan.updateBlock}
              onClear={plan.clearPlan}
              onSaved={(key) => { plan.setEditingKey(key); refreshPlans(); }}
              onToast={showToast}
              onAddDrill={handleAddDrill}
            />
          </>
        )}
        {view === "saved" && (
          <SavedPlans
            currentUid={user?.uid ?? null}
            onLoad={handleLoad}
            onToast={showToast}
          />
        )}
        {view === "schedule" && (
          <ScheduleCalendar
            onSelectSession={handleSelectSession}
            savedPlanDates={savedPlanDates}
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
