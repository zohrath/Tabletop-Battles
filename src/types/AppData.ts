import type { StratagemTiming } from "./Stratagem";
import type { Phase } from "./Phase";
import type { ArmyRule, ArmyUnit } from "../utils/armyImported";

export type SavedArmy = {
  id: string;
  importedAt: string;
  name: string;
  selectedDetachmentId?: string;
  selectedArmyRuleChoiceId?: string;
  sourceFileName: string;
  armyRules: ArmyRule[];
  units: ArmyUnit[];
};

export type DetachmentPack = {
  id: string;
  name: string;
  detachmentRule: string;
  enhancements: string;
  stratagems: DetachmentStratagem[];
};

export type DetachmentStratagem = {
  id: string;
  name: string;
  cpCost: number;
  description: string;
  phases: Phase[] | "Any";
  timing: StratagemTiming;
};
