import { useState, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { usePlan } from "./hooks/usePlan";
import { AuthScreen } from "./components/Auth/AuthScreen";
import { TopBar } from "./components/Layout/TopBar";
import { DrillLibrary } from "./components/Library/DrillLibrary";
import { PlanBuilder } from "./components/Builder/PlanBuilder";
import { SavedPlans } from "./components/SavedPlans/SavedPlans";
import type { SavedPlanWithKey } from "./types";
import type { SeasonPhase } from "./data/seasons";

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const plan = usePlan();
  const [view, setView] = useState<"builder" | "saved">("builder");
  const [activePhase, setPhase] = useState<SeasonPhase>("specific-prep");
  const [toast, setToast] = useState("");
  const [toastTimer, setToastTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setToast(msg);
      if (toastTimer) clearTimeout(toastTimer);
      setToastTimer(setTimeout(() => setToast(""), 2500));
    },
    [toastTimer],
  );

  const handleLoad = useCallback(
    (key: string, saved: SavedPlanWithKey) => {
      plan.loadPlan(key, saved);
      setView("builder");
      showToast("Plan loaded ✓");
    },
    [plan, showToast],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-condensed text-xl text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return <AuthScreen onSignIn={signIn} />;

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        user={user}
        activeView={view}
        activePhase={activePhase}
        onSwitchView={setView}
        onPhaseChange={setPhase}
        onSignOut={signOut}
      />

      <div className="flex flex-1 overflow-hidden">
        {view === "builder" && (
          <>
            <DrillLibrary onAddDrill={plan.addBlock} />
            <PlanBuilder
              user={user}
              blocks={plan.blocks}
              meta={plan.meta}
              editingKey={plan.editingKey}
              totalMins={plan.totalMins}
              activePhase={activePhase}
              onMetaChange={plan.setMeta}
              onAddWarmup={plan.addWarmup}
              onAddCooldown={plan.addCooldown}
              onRemoveBlock={plan.removeBlock}
              onUpdateBlock={plan.updateBlock}
              onClear={plan.clearPlan}
              onSaved={plan.setEditingKey}
              onToast={showToast}
            />
          </>
        )}
        {view === "saved" && (
          <SavedPlans
            currentUid={user.uid}
            onLoad={handleLoad}
            onToast={showToast}
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
