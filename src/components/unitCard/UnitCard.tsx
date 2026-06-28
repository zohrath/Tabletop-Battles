import { Card, CardHeader, CardTitle } from "./UnitCard.styles";
import type { ArmyUnit } from "../../utils/armyImported";
import type { ActiveWeapon, KeywordDetail } from "../../types/armyUnitList";
import type { SetStateAction } from "react";
import { UnitMovement } from "../unitMovement/UnitMovement";
import { WeaponStatus } from "../weaponStatus/WeaponStatus";

interface Props {
  index: number;
  unit: ArmyUnit;
  onAddAbility: (unitId: string) => void;
  onAddWeaponKeyword: (unitId: string, weaponKey: string) => void;
  onRemoveAbility: (unitId: string) => void;
  onRemoveWeaponKeyword: (unitId: string, weaponKey: string) => void;
  setSelectedUnitId: (value: SetStateAction<string | null>) => void;
  setSelectedKeyword: (value: SetStateAction<KeywordDetail | null>) => void;
  setSelectedWeapon: (value: SetStateAction<ActiveWeapon | null>) => void;
}

const UnitCard = ({
  index,
  onAddAbility,
  onAddWeaponKeyword,
  onRemoveAbility,
  onRemoveWeaponKeyword,
  unit,
  setSelectedUnitId,
  setSelectedKeyword,
  setSelectedWeapon,
}: Props) => {
  return (
    <Card variant={index % 2 === 0 ? "alternate" : "default"}>
      <CardHeader
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSelectedUnitId(unit.id);
          }
        }}
        onClick={() => setSelectedUnitId(unit.id)}
      >
        <CardTitle>
          <h2 style={{ marginBottom: 0 }}>{unit.name}</h2>
          <UnitMovement unit={unit} />
        </CardTitle>
        <WeaponStatus
          unit={unit}
          onAddWeaponKeyword={(weaponKey) =>
            onAddWeaponKeyword(unit.id, weaponKey)
          }
          onKeywordSelect={(keyword) => setSelectedKeyword(keyword)}
          onRemoveWeaponKeyword={(weaponKey) =>
            onRemoveWeaponKeyword(unit.id, weaponKey)
          }
          onWeaponSelect={(weapon) => setSelectedWeapon(weapon)}
        />
        <UnitAbilities unit={unit} onAbilitySelect={setSelectedKeyword} />
      </CardHeader>
      <div className="unit-chip-controls" aria-label={`${unit.name} ability controls`}>
        <button
          aria-label={`Add ability to ${unit.name}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddAbility(unit.id);
          }}
        >
          +
        </button>
        <button
          aria-label={`Remove ability from ${unit.name}`}
          disabled={(unit.abilities ?? []).length === 0}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemoveAbility(unit.id);
          }}
        >
          -
        </button>
      </div>
    </Card>
  );
};

type UnitAbilitiesProps = {
  unit: ArmyUnit;
  onAbilitySelect: (ability: KeywordDetail) => void;
};

function UnitAbilities({ unit, onAbilitySelect }: UnitAbilitiesProps) {
  const abilities = unit.abilities ?? [];

  if (abilities.length === 0) {
    return null;
  }

  return (
    <section className="weapon-group" aria-label={`${unit.name} abilities`}>
      <h3>Abilities</h3>
      <ul className="weapon-keywords">
        {abilities.map((ability) => (
          <li key={ability.id}>
            <button
              disabled={!ability.description}
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                if (ability.description) {
                  onAbilitySelect({
                    abilityId: ability.id,
                    description: ability.description,
                    displayName: ability.displayName,
                    name: ability.name,
                    source: "ability",
                    unitId: unit.id,
                  });
                }
              }}
            >
              {ability.displayName || ability.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default UnitCard;
