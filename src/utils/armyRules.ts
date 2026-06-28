import type { SavedArmy } from "../types/AppData";

export function getSelectedArmyRuleChoice(army: SavedArmy | null) {
  if (!army?.selectedArmyRuleChoiceId) {
    return null;
  }

  return (
    army.armyRules?.flatMap((rule) => rule.choices).find((choice) => choice.id === army.selectedArmyRuleChoiceId) ??
    null
  );
}
