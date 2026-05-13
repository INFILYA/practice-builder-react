import type { User } from "firebase/auth";
import { SessionMetaBar, buildTitle } from "./SessionMeta";
import { PlanBlock as PlanBlockComponent } from "./PlanBlock";
import { SeasonTemplate } from "./SeasonTemplate";
import { savePlan } from "../../firebase/db";
import type { Drill, PlanBlock, SessionMeta, ModuleKey } from "../../types";
import type { SeasonPhase } from "../../data/seasons";

interface Props {
  user: User | null;
  blocks: PlanBlock[];
  meta: SessionMeta;
  editingKey: string | null;
  totalMins: number;
  activePhase: SeasonPhase;
  canEditPlans: boolean;
  onPhaseChange: (p: SeasonPhase) => void;
  onMetaChange: (u: Partial<SessionMeta>) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (id: string, u: Partial<PlanBlock>) => void;
  onClear: () => void;
  onSaved: (key: string) => void;
  onToast: (msg: string) => void;
  onAddDrill: (drill: Drill, mod: ModuleKey) => void;
}

export function PlanBuilder({
  user,
  blocks,
  meta,
  editingKey,
  totalMins,
  activePhase,
  canEditPlans,
  onPhaseChange,
  onMetaChange,
  onRemoveBlock,
  onUpdateBlock,
  onClear,
  onSaved,
  onToast,
  onAddDrill,
}: Props) {
  const maxMins = parseInt(meta.duration);
  const isOver = totalMins > maxMins;

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const { drill, mod } = JSON.parse(e.dataTransfer.getData('application/json'));
      onAddDrill(drill, mod);
    } catch {
      // ignore invalid drops
    }
  };

  const handleSave = async () => {
    if (!user) {
      onToast("Sign in to save plans");
      return;
    }
    try {
      const key = await savePlan(
        {
          ...meta,
          title: buildTitle(meta),
          blocks,
          phase: activePhase,
          authorUid: user.uid,
          authorName: user.displayName ?? user.email ?? "Unknown",
          updatedAt: Date.now(),
        },
        editingKey ?? undefined,
      );
      onSaved(key);
      onToast(editingKey ? "Plan updated ✓" : "Plan saved ✓");
    } catch {
      onToast("Error saving plan");
    }
  };

  const handleExport = () => {
    const lines = [
      "UNITY VOLLEYBALL — TRAINING PLAN",
      buildTitle(meta),
      `${meta.group} | ${meta.date} | ${meta.facility} | ${parseInt(meta.duration) / 60}h`,
      "─".repeat(50),
      "",
      ...blocks.map((b, i) =>
        [
          `${i + 1}. [${b.mod}] ${b.name} — ${b.mins} min`,
          b.vars ? `   ${b.vars}` : "",
          b.notes ? `   Notes: ${b.notes}` : "",
          "",
        ]
          .filter(Boolean)
          .join("\n"),
      ),
      `TOTAL: ${totalMins} min`,
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/plain" }),
    );
    a.download = `PracticePlan_${meta.group.replace(" ", "_")}_${meta.date}.txt`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SessionMetaBar meta={meta} onChange={onMetaChange} /* read-only display */ />
      <SeasonTemplate totalDurationMins={maxMins} activePhase={activePhase} blocks={blocks} onPhaseChange={onPhaseChange} />

      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin" onDragOver={handleDragOver} onDrop={handleDrop}>
        {blocks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-600 text-sm text-center px-6">
            <span className="text-3xl sm:hidden">☝️</span>
            <span className="text-3xl hidden sm:block">←</span>
            <span className="sm:hidden">Tap "Drill Library" above to browse and add drills</span>
            <span className="hidden sm:block">Select drills from the library to build your session</span>
          </div>
        ) : (
          blocks.map((block) => (
            <PlanBlockComponent
              key={block.id}
              block={block}
              onRemove={() => onRemoveBlock(block.id)}
              onUpdate={(u) => onUpdateBlock(block.id, u)}
            />
          ))
        )}
      </div>

      <footer className="px-3 sm:px-4 py-2.5 border-t border-white/7 bg-bg2 flex items-center gap-2 sm:gap-3 flex-wrap">
        <p className={`text-sm flex-1 min-w-0 ${isOver ? "text-red-400" : "text-gray-400"}`}>
          <strong className={`font-condensed text-base ${isOver ? "text-red-400" : "text-white"}`}>
            {totalMins}
          </strong>
          <span className="text-xs"> / {maxMins} min</span>
        </p>
        <button
          onClick={onClear}
          className="px-2.5 sm:px-3 py-1.5 rounded-md text-xs border border-white/10 text-gray-400 hover:text-white hover:bg-bg3 transition-all"
        >
          Clear
        </button>
        <button
          onClick={handleExport}
          className="hidden sm:block px-3 py-1.5 rounded-md text-xs border border-white/10 text-gray-400 hover:text-white hover:bg-bg3 transition-all"
        >
          Export .txt
        </button>
        {canEditPlans ? (
          <button
            onClick={handleSave}
            className="px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold bg-accent text-black hover:opacity-90 transition-all"
          >
            Save Plan
          </button>
        ) : (
          <span className="px-3 py-1.5 rounded-md text-xs font-medium border border-white/10 text-gray-600 cursor-not-allowed" title="View only — ask admin for edit access">
            View only
          </span>
        )}
      </footer>
    </div>
  );
}
