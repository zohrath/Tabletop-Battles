import type { Phase } from "./Phase";

export type StratagemSource = "core" | "faction" | "detachment";
export type StratagemPhase = Phase[] | "Any";
export type StratagemTiming = "own-turn" | "opponent-turn" | "both";
export type StratagemPhaseTiming = {
  phase: Phase;
  timing: StratagemTiming;
};

export type Stratagem = {
  id: string;
  factionKey?: string;
  detachmentKey?: string;
  name: string;
  description: string;
  cpCost: number;
  phases: StratagemPhase;
  phaseTimings?: StratagemPhaseTiming[];
  source: StratagemSource;
  timing: StratagemTiming;
};
