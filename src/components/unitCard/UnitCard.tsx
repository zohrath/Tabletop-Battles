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
      </CardHeader>
    </Card>
  );
};

export default UnitCard;
