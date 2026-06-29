import { Select } from "../components/select/Select";
import type { SavedArmy } from "../types/AppData";
import { getSelectedArmyRuleChoice } from "../utils/armyRules";

type ArmyRulePageProps = {
  army: SavedArmy | null;
  onChooseArmyRule: (choiceId: string) => void;
};

export function ArmyRulePage({ army, onChooseArmyRule }: ArmyRulePageProps) {
  if (!army) {
    return <p className="empty-state">Import or open an army first.</p>;
  }

  const rules = army.armyRules ?? [];
  const choiceRules = rules.filter((rule) => rule.choices.length > 0);

  if (rules.length === 0) {
    return <p className="empty-state">No army rules found in this import.</p>;
  }

  return (
    <section className="army-rule-page" aria-label="Army rule selection">
      {choiceRules.length > 0
        ? choiceRules.map((rule) => (
            <article className="army-rule-card" key={rule.id}>
              <h2>{rule.name}</h2>
              <Select
                label="Chosen rule"
                options={[
                  { label: "None selected", value: "" },
                  ...rule.choices.map((choice) => ({
                    label: choice.name,
                    value: choice.id,
                  })),
                ]}
                value={army.selectedArmyRuleChoiceId ?? ""}
                onChange={onChooseArmyRule}
              />
              <SelectedArmyRuleDescription army={army} />
            </article>
          ))
        : rules.map((rule) => (
            <article className="army-rule-card" key={rule.id}>
              <h2>{rule.name}</h2>
              <p>{rule.description}</p>
            </article>
          ))}
    </section>
  );
}

function SelectedArmyRuleDescription({ army }: { army: SavedArmy }) {
  const selectedChoice = getSelectedArmyRuleChoice(army);

  if (!selectedChoice) {
    return null;
  }

  return <p className="army-rule-description">{selectedChoice.description}</p>;
}
