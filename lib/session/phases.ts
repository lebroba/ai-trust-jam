import type { Phase } from "@/lib/types";

export const PHASES: Array<{ id: Phase; label: string; minutes: number }> = [
  { id: "aspects", label: "Aspect generation", minutes: 3 },
  { id: "concepts", label: "Concept development", minutes: 12 },
  { id: "presentations", label: "Presentation", minutes: 3 },
  { id: "voting", label: "Voting", minutes: 0 },
  { id: "finished", label: "Finished", minutes: 0 },
];

export function phaseLabel(phase: Phase) {
  return PHASES.find((item) => item.id === phase)?.label ?? phase;
}

export function phaseMinutes(phase: Phase) {
  return PHASES.find((item) => item.id === phase)?.minutes ?? 0;
}
