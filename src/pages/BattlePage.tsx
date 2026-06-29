import { ArmyUnitList } from "../components/ArmyUnitList";
import { Select } from "../components/select/Select";
import { StratagemsIndicator } from "../components/stratagemsIndicator/StratagemsIndicator";
import { StratagemsToggleButton } from "../components/stratagemsIndicator/StratagemsIndicator.styles";
import type { TurnOwner } from "../types/BattlePhase";
import type { DetachmentPack, SavedArmy } from "../types/AppData";
import type { Stratagem } from "../types/Stratagem";
import { getSelectedArmyRuleChoice } from "../utils/armyRules";

type BattlePageProps = {
  activeArmy: SavedArmy | null;
  detachmentPacks: DetachmentPack[];
  firstTurnOwner: TurnOwner | null;
  hasVisibleStratagems: boolean;
  selectedDetachment: DetachmentPack | null;
  stratagemsIndicatorOpen: boolean;
  visibleCoreStratagems: Stratagem[];
  visibleDetachmentStratagems: Stratagem[];
  onAbilityDisplayNameChange: (unitId: string, abilityId: string, displayName: string) => void;
  onAddAbility: (unitId: string) => void;
  onAddWeaponKeyword: (unitId: string, weaponKey: string) => void;
  onChooseDetachment: (detachmentId: string) => void;
  onModelCountChange: (unitId: string, modelId: string, change: number) => void;
  onOpenDetachmentDetail: (detachment: DetachmentPack) => void;
  onRemoveAbility: (unitId: string) => void;
  onRemoveWeaponKeyword: (unitId: string, weaponKey: string) => void;
  onToggleStratagemsIndicator: () => void;
};

export function BattlePage({
  activeArmy,
  detachmentPacks,
  firstTurnOwner,
  hasVisibleStratagems,
  selectedDetachment,
  stratagemsIndicatorOpen,
  visibleCoreStratagems,
  visibleDetachmentStratagems,
  onAbilityDisplayNameChange,
  onAddAbility,
  onAddWeaponKeyword,
  onChooseDetachment,
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
      <SelectedDetachmentControl
        activeArmy={activeArmy}
        detachmentPacks={detachmentPacks}
        detachment={selectedDetachment}
        onChooseDetachment={onChooseDetachment}
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

function SelectedDetachmentControl({
  activeArmy,
  detachment,
  detachmentPacks,
  onChooseDetachment,
  onOpen,
}: {
  activeArmy: SavedArmy | null;
  detachment: DetachmentPack | null;
  detachmentPacks: DetachmentPack[];
  onChooseDetachment: (detachmentId: string) => void;
  onOpen: () => void;
}) {
  if (!activeArmy && detachmentPacks.length === 0) {
    return null;
  }

  return (
    <section className="selected-detachment">
      <Select
        disabled={!activeArmy || detachmentPacks.length === 0}
        label="Detachment"
        options={[
          { label: "None selected", value: "" },
          ...detachmentPacks.map((detachmentPack) => ({
            label: detachmentPack.name,
            value: detachmentPack.id,
          })),
        ]}
        value={activeArmy?.selectedDetachmentId ?? ""}
        onChange={onChooseDetachment}
      />
      <button disabled={!detachment} type="button" onClick={onOpen}>
        Details
      </button>
    </section>
  );
}
