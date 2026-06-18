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
        <div
          aria-labelledby="weapon-modal-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setSelectedWeapon(null)}
        >
          <section
            className="weapon-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="model-modal__header">
              <div>
                <h2 id="weapon-modal-title">{selectedWeapon.name}</h2>
                <p>
                  {selectedWeapon.typeName === "Ranged Weapons"
                    ? "Ranged weapon"
                    : "Melee weapon"}
                </p>
              </div>
              <button
                aria-label="Close weapon details"
                className="modal-close"
                type="button"
                onClick={() => setSelectedWeapon(null)}
              >
                x
              </button>
            </header>

            <div className="weapon-detail-card">
              <div className="weapon-row__title">
                <span>{selectedWeapon.name}</span>
                {selectedWeapon.number > 1 && (
                  <strong>x{formatWeaponCount(selectedWeapon.number)}</strong>
                )}
              </div>
              <WeaponCarriers weapon={selectedWeapon} />
              <StatsGrid stats={getWeaponStats(selectedWeapon)} />
              <WeaponKeywords
                weapon={selectedWeapon}
                onKeywordSelect={(keyword) => setSelectedKeyword(keyword)}
              />
            </div>
          </section>
        </div>
      )}

      {selectedKeyword && (
        <div
          aria-labelledby="keyword-modal-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setSelectedKeyword(null)}
        >
          <section
            className="keyword-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="model-modal__header">
              <div>
                <h2 id="keyword-modal-title">{selectedKeyword.name}</h2>
                <p>Keyword</p>
              </div>
              <button
                aria-label="Close keyword details"
                className="modal-close"
                type="button"
                onClick={() => setSelectedKeyword(null)}
              >
                x
              </button>
            </header>
            <p className="keyword-description">{selectedKeyword.description}</p>
          </section>
        </div>
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
