import { useEffect, useState } from "react";
import { fetchAllPlans, deletePlan } from "../../firebase/db";
import { MODULE_COLORS } from "../../data/drills";
import type { SavedPlanWithKey } from "../../types";

interface Props {
  currentUid: string | null;
  onLoad: (key: string, plan: SavedPlanWithKey) => void;
  onToast: (msg: string) => void;
}

export function SavedPlans({ currentUid, onLoad, onToast }: Props) {
  const [plans, setPlans] = useState<SavedPlanWithKey[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setPlans(await fetchAllPlans());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (key: string) => {
    if (!confirm("Delete this plan?")) return;
    await deletePlan(key);
    onToast("Deleted");
    load();
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
      <h2 className="font-condensed text-3xl font-black mb-5">Saved Plans</h2>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : plans.length === 0 ? (
        <p className="text-gray-500 text-sm">No plans saved yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan) => {
            const isOwn = plan.authorUid === currentUid;
            const mods = [...new Set(plan.blocks.map((b) => b.mod))];
            return (
              <div
                key={plan.key}
                className="bg-bg2 border border-white/7 rounded-lg p-4 hover:border-white/12 hover:-translate-y-0.5 transition-all"
              >
                <p className="font-condensed text-lg font-bold">
                  {plan.title || "Untitled"}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                  <span>{plan.group}</span>
                  <span>{plan.date}</span>
                  <span>{plan.facility}</span>
                  <span>{parseInt(plan.duration) / 60}h</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  by {plan.authorName}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {mods.map((mod) => (
                    <span
                      key={mod}
                      className={`text-xs font-bold px-1.5 py-0.5 rounded font-condensed ${(MODULE_COLORS[mod] ?? MODULE_COLORS.M1).badge}`}
                    >
                      {mod}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onLoad(plan.key, plan)}
                    className="px-3 py-1 rounded-md text-xs border border-white/10 text-gray-300 hover:text-white hover:bg-bg3 transition-all"
                  >
                    Open
                  </button>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(plan.key)}
                      className="px-3 py-1 rounded-md text-xs border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
