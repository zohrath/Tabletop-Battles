import { useState } from "react";
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
  WeaponCount,
  WeaponDetailCard,
  WeaponName,
  WeaponTitle,
} from "./ArmyUnitList.styles";

export function ArmyUnitList({ onModelCountChange, units }: ArmyUnitListProps) {
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
      {units.map((unit) => (
        <UnitCard
          key={unit.id}
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
              title={selectedKeyword.name}
              titleId="keyword-modal-title"
              subtitle="Keyword"
            />
          }
          maxWidth={560}
          onClose={() => setSelectedKeyword(null)}
        >
          <KeywordDescription>{selectedKeyword.description}</KeywordDescription>
        </Modal>
      )}
    </section>
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
