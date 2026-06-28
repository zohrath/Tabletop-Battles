import { useState } from "react";
import type { SetStateAction } from "react";
import type { ArmyUnit } from "../utils/armyImported";
import type {
  ActiveWeapon,
  ArmyUnitListProps,
  KeywordDetail,
} from "../types/armyUnitList";
import { Modal } from "./modal/Modal";
import { Header } from "./header/Header";
import { ModelRow } from "./modelRow/ModelRow";
import { StatsGrid } from "./statsGrid/StatsGrid";
import { UnorderedList } from "./unorderedList/UnorderedList";
import { WeaponCarriers, WeaponKeywords } from "./weaponStatus/WeaponStatus";
import UnitCard from "./unitCard/UnitCard";
import { formatWeaponCount, getWeaponStats } from "../utils/weapon";
import {
  KeywordDescription,
  KeywordEditor,
  WeaponCount,
  WeaponDetailCard,
  WeaponName,
  WeaponTitle,
} from "./ArmyUnitList.styles";

export function ArmyUnitList({
  onAddAbility,
  onAddWeaponKeyword,
  onAbilityDisplayNameChange,
  onModelCountChange,
  onRemoveAbility,
  onRemoveWeaponKeyword,
  units,
}: ArmyUnitListProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<ActiveWeapon | null>(
    null,
  );
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordDetail | null>(
    null,
  );
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? null;

  if (units.length === 0) {
    return <p className="empty-state">No units found.</p>;
  }

  return (
    <section className="unit-list" aria-label="Imported army units">
      {units.map((unit, index) => (
        <UnitCard
          index={index}
          key={unit.id}
          onAddAbility={onAddAbility}
          onAddWeaponKeyword={onAddWeaponKeyword}
          onRemoveAbility={onRemoveAbility}
          onRemoveWeaponKeyword={onRemoveWeaponKeyword}
          unit={unit}
          setSelectedKeyword={setSelectedKeyword}
          setSelectedUnitId={setSelectedUnitId}
          setSelectedWeapon={setSelectedWeapon}
        />
      ))}

      {selectedUnit && (
        <Modal
          ariaLabelledBy="model-modal-title"
          closeAriaLabel="Close model editor"
          header={
            <Header
              title={selectedUnit.name}
              titleId="model-modal-title"
              subtitle={`${getRemainingModels(selectedUnit)} models remaining`}
            />
          }
          onClose={() => setSelectedUnitId(null)}
        >
          <UnorderedList ariaLabel={`${selectedUnit.name} models`}>
            {selectedUnit.models.map((model) => (
              <ModelRow
                key={model.id}
                model={model}
                unitId={selectedUnit.id}
                onModelCountChange={onModelCountChange}
              />
            ))}
          </UnorderedList>
        </Modal>
      )}

      {selectedWeapon && (
        <Modal
          ariaLabelledBy="weapon-modal-title"
          closeAriaLabel="Close weapon details"
          header={
            <Header
              title={selectedWeapon.name}
              titleId="weapon-modal-title"
              subtitle={
                selectedWeapon.typeName === "Ranged Weapons"
                  ? "Ranged weapon"
                  : "Melee weapon"
              }
            />
          }
          maxWidth={560}
          onClose={() => setSelectedWeapon(null)}
        >
          <WeaponDetailCard>
            <WeaponTitle>
              <WeaponName>{selectedWeapon.name}</WeaponName>
              {selectedWeapon.number > 1 && (
                <WeaponCount>
                  x{formatWeaponCount(selectedWeapon.number)}
                </WeaponCount>
              )}
            </WeaponTitle>
            <WeaponCarriers weapon={selectedWeapon} />
            <StatsGrid stats={getWeaponStats(selectedWeapon)} />
            <WeaponKeywords
              weapon={selectedWeapon}
              onKeywordSelect={(keyword) => setSelectedKeyword(keyword)}
            />
          </WeaponDetailCard>
        </Modal>
      )}

      {selectedKeyword && (
        <Modal
          ariaLabelledBy="keyword-modal-title"
          closeAriaLabel="Close keyword details"
          header={
            <Header
              title={selectedKeyword.displayName || selectedKeyword.name}
              titleId="keyword-modal-title"
              subtitle={
                selectedKeyword.source === "ability" ? "Ability" : "Keyword"
              }
            />
          }
          maxWidth={560}
          onClose={() => setSelectedKeyword(null)}
        >
          <KeywordDetailContent
            key={`${selectedKeyword.unitId ?? ""}:${selectedKeyword.abilityId ?? ""}:${selectedKeyword.name}`}
            selectedKeyword={selectedKeyword}
            onAbilityDisplayNameChange={onAbilityDisplayNameChange}
            onSelectedKeywordChange={setSelectedKeyword}
          />
          <KeywordDescription>{selectedKeyword.description}</KeywordDescription>
        </Modal>
      )}
    </section>
  );
}

type KeywordDetailContentProps = {
  selectedKeyword: KeywordDetail;
  onAbilityDisplayNameChange: (
    unitId: string,
    abilityId: string,
    displayName: string,
  ) => void;
  onSelectedKeywordChange: (value: SetStateAction<KeywordDetail | null>) => void;
};

function KeywordDetailContent({
  selectedKeyword,
  onAbilityDisplayNameChange,
  onSelectedKeywordChange,
}: KeywordDetailContentProps) {
  const [draftDisplayName, setDraftDisplayName] = useState(
    selectedKeyword.displayName ?? selectedKeyword.name,
  );

  if (
    selectedKeyword.source !== "ability" ||
    !selectedKeyword.unitId ||
    !selectedKeyword.abilityId
  ) {
    return null;
  }

  return (
    <>
      <KeywordEditor>
        <span>Chip text</span>
        <input
          value={draftDisplayName}
          onChange={(event) => setDraftDisplayName(event.target.value)}
        />
      </KeywordEditor>
      <div className="modal-footer">
        <button
          type="button"
          onClick={() =>
            setDraftDisplayName(
              selectedKeyword.displayName ?? selectedKeyword.name,
            )
          }
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onAbilityDisplayNameChange(
              selectedKeyword.unitId!,
              selectedKeyword.abilityId!,
              draftDisplayName,
            );
            onSelectedKeywordChange((currentKeyword) =>
              currentKeyword
                ? {
                    ...currentKeyword,
                    displayName: draftDisplayName,
                  }
                : currentKeyword,
            );
          }}
        >
          Save
        </button>
      </div>
    </>
  );
}

function getRemainingModels(unit: ArmyUnit) {
  return unit.models.reduce(
    (total, model) => total + getModelCount(model.number),
    0,
  );
}

function getModelCount(value: number | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
