import { Card, CardHeader, CardTitle } from "./UnitCard.styles";
import type { ArmyUnit } from "../../utils/armyImported";
import type { ActiveWeapon, KeywordDetail } from "../../types/armyUnitList";
import type { SetStateAction } from "react";
import { UnitMovement } from "../unitMovement/UnitMovement";
import { WeaponStatus } from "../weaponStatus/WeaponStatus";

interface Props {
  unit: ArmyUnit;
  setSelectedUnitId: (value: SetStateAction<string | null>) => void;
  setSelectedKeyword: (value: SetStateAction<KeywordDetail | null>) => void;
  setSelectedWeapon: (value: SetStateAction<ActiveWeapon | null>) => void;
}

const UnitCard = ({
  unit,
  setSelectedUnitId,
  setSelectedKeyword,
  setSelectedWeapon,
}: Props) => {
  return (
    <Card>
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
          onKeywordSelect={(keyword) => setSelectedKeyword(keyword)}
          onWeaponSelect={(weapon) => setSelectedWeapon(weapon)}
        />
        <UnitAbilities unit={unit} onAbilitySelect={setSelectedKeyword} />
      </CardHeader>
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
