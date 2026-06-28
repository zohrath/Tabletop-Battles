import { ArmyUnitList } from "../components/ArmyUnitList";
import { StratagemsIndicator } from "../components/stratagemsIndicator/StratagemsIndicator";
import { StratagemsToggleButton } from "../components/stratagemsIndicator/StratagemsIndicator.styles";
import type { TurnOwner } from "../types/BattlePhase";
import type { DetachmentPack, SavedArmy } from "../types/AppData";
import type { Stratagem } from "../types/Stratagem";
import { getSelectedArmyRuleChoice } from "../utils/armyRules";

type BattlePageProps = {
  activeArmy: SavedArmy | null;
  firstTurnOwner: TurnOwner | null;
  hasVisibleStratagems: boolean;
  selectedDetachment: DetachmentPack | null;
  stratagemsIndicatorOpen: boolean;
  visibleCoreStratagems: Stratagem[];
  visibleDetachmentStratagems: Stratagem[];
  onAbilityDisplayNameChange: (unitId: string, abilityId: string, displayName: string) => void;
  onAddAbility: (unitId: string) => void;
  onAddWeaponKeyword: (unitId: string, weaponKey: string) => void;
  onModelCountChange: (unitId: string, modelId: string, change: number) => void;
  onOpenDetachmentDetail: (detachment: DetachmentPack) => void;
  onRemoveAbility: (unitId: string) => void;
  onRemoveWeaponKeyword: (unitId: string, weaponKey: string) => void;
  onToggleStratagemsIndicator: () => void;
};

export function BattlePage({
  activeArmy,
  firstTurnOwner,
  hasVisibleStratagems,
  selectedDetachment,
  stratagemsIndicatorOpen,
  visibleCoreStratagems,
  visibleDetachmentStratagems,
  onAbilityDisplayNameChange,
  onAddAbility,
  onAddWeaponKeyword,
  onModelCountChange,
  onOpenDetachmentDetail,
  onRemoveAbility,
  onRemoveWeaponKeyword,
  onToggleStratagemsIndicator,
}: BattlePageProps) {
  return (
    <>
      {!firstTurnOwner && <p className="turn-owner-warning">Choose who started first turn.</p>}
      {hasVisibleStratagems && (
        <StratagemsToggleButton
          aria-expanded={stratagemsIndicatorOpen}
          aria-label={stratagemsIndicatorOpen ? "Hide stratagems indicator" : "Show stratagems indicator"}
          type="button"
          onClick={onToggleStratagemsIndicator}
        >
          <span aria-hidden="true" />
        </StratagemsToggleButton>
      )}
      {stratagemsIndicatorOpen && visibleDetachmentStratagems.length > 0 && (
        <StratagemsIndicator stratagems={visibleDetachmentStratagems} />
      )}
      {stratagemsIndicatorOpen && visibleCoreStratagems.length > 0 && (
        <StratagemsIndicator side="right" stratagems={visibleCoreStratagems} />
      )}
      <SelectedArmyRuleBanner army={activeArmy} />
      <SelectedDetachmentChip
        detachment={selectedDetachment}
        onOpen={() => {
          if (selectedDetachment) {
            onOpenDetachmentDetail(selectedDetachment);
          }
        }}
      />
      <ArmyUnitList
        onAddAbility={onAddAbility}
        onAddWeaponKeyword={onAddWeaponKeyword}
        onAbilityDisplayNameChange={onAbilityDisplayNameChange}
        onModelCountChange={onModelCountChange}
        onRemoveAbility={onRemoveAbility}
        onRemoveWeaponKeyword={onRemoveWeaponKeyword}
        units={activeArmy?.units ?? []}
      />
    </>
  );
}

function SelectedArmyRuleBanner({ army }: { army: SavedArmy | null }) {
  const selectedChoice = getSelectedArmyRuleChoice(army);

  if (!selectedChoice) {
    return null;
  }

  return (
    <section className="selected-army-rule">
      <span>Army rule</span>
      <strong>{selectedChoice.name}</strong>
    </section>
  );
}

function SelectedDetachmentChip({ detachment, onOpen }: { detachment: DetachmentPack | null; onOpen: () => void }) {
  if (!detachment) {
    return null;
  }

  return (
    <section className="selected-detachment">
      <span>Detachment</span>
      <ul className="weapon-keywords">
        <li>
          <button type="button" onClick={onOpen}>
            {detachment.name}
          </button>
        </li>
      </ul>
    </section>
  );
}
