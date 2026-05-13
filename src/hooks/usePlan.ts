import { useState, useCallback } from "react";
import type { PlanBlock, SessionMeta, ModuleKey, Drill } from "../types";

const DEFAULT_META: SessionMeta = {
  title: "",
  group: "18U Boys",
  date: new Date().toISOString().split("T")[0],
  duration: "120",
  facility: "MPAC",
};

export function usePlan() {
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [meta, setMeta] = useState<SessionMeta>(DEFAULT_META);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const addBlock = useCallback((drill: Drill, mod: ModuleKey) => {
    const block: PlanBlock = {
      id: `${Date.now()}-${Math.random()}`,
      mod,
      obj: drill.obj,
      name: drill.name,
      desc: drill.desc,
      vars: drill.vars,
      mins: drill.defaultMin,
      notes: "",
      ...(drill.videoUrl ? { videoUrl: drill.videoUrl } : {}),
    };
    setBlocks((prev) => {
      if (mod === 'WU') {
        // WU goes after the last existing WU block (top of list)
        const lastWuIdx = prev.map(b => b.mod).lastIndexOf('WU');
        const insertAt = lastWuIdx + 1;
        return [...prev.slice(0, insertAt), block, ...prev.slice(insertAt)];
      }
      // Regular drills go before the first CD block (or at the end)
      const firstCdIdx = prev.findIndex(b => b.mod === 'CD');
      if (firstCdIdx === -1) return [...prev, block];
      return [...prev.slice(0, firstCdIdx), block, ...prev.slice(firstCdIdx)];
    });
  }, []);

  const addWarmup = useCallback(() => {
    setBlocks((prev) => [
      {
        id: `wu-${Date.now()}`,
        mod: "WU",
        obj: "Warm-Up",
        name: "Warm-Up",
        desc: "Standard / Band / Core / Med Ball / Hurdles — rotate each session",
        vars: "",
        mins: 15,
        notes: "",
      },
      ...prev,
    ]);
  }, []);

  const addCooldown = useCallback(() => {
    setBlocks((prev) => [
      ...prev,
      {
        id: `cd-${Date.now()}`,
        mod: "CD",
        obj: "Cool-Down",
        name: "Cool-Down & Debrief",
        desc: "Static stretch + team circle — 3 things that worked · 1 focus next session",
        vars: "",
        mins: 10,
        notes: "",
      },
    ]);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<PlanBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  }, []);

  const clearPlan = useCallback(() => {
    setBlocks([]);
    setMeta(DEFAULT_META);
    setEditingKey(null);
  }, []);

  const startFromSchedule = useCallback((partialMeta: Partial<SessionMeta>) => {
    setBlocks([]);
    setEditingKey(null);
    setMeta({ ...DEFAULT_META, ...partialMeta });
  }, []);

  const loadPlan = useCallback(
    (key: string, saved: SessionMeta & { blocks: PlanBlock[] }) => {
      setBlocks(
        (saved.blocks ?? []).map((b) => ({
          ...b,
          id: `${Date.now()}-${Math.random()}`,
        })),
      );
      // Only copy the clean SessionMeta fields — no Firebase extras
      setMeta({
        title:    saved.title    ?? '',
        group:    saved.group    ?? DEFAULT_META.group,
        date:     saved.date     ?? DEFAULT_META.date,
        duration: saved.duration ?? DEFAULT_META.duration,
        facility: saved.facility ?? DEFAULT_META.facility,
      });
      setEditingKey(key);
    },
    [],
  );

  const totalMins = blocks.reduce((s, b) => s + b.mins, 0);

  const updateMeta = useCallback((updates: Partial<SessionMeta>) => {
    setMeta((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    blocks,
    meta,
    editingKey,
    setMeta: updateMeta,
    addBlock,
    addWarmup,
    addCooldown,
    removeBlock,
    updateBlock,
    clearPlan,
    loadPlan,
    startFromSchedule,
    setEditingKey,
    totalMins,
  };
}
