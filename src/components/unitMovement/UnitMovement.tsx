import type { UnitMovementProps } from "../../types/armyUnitList";

export function UnitMovement({ unit }: UnitMovementProps) {
  const unitProfiles = [...unit.profiles, ...unit.models.flatMap((model) => model.profiles)].filter(
    (profile) => profile.typeName === "Unit",
  );
  const movementValues = [
    ...new Set(
      unitProfiles.flatMap((profile) => {
        const movement = profile.characteristics.find(
          (stat) => stat.name.toUpperCase() === "M",
        );

        return movement ? [movement.$text] : [];
      }),
    ),
  ];

  if (movementValues.length === 0) {
    return null;
  }

  return <span className="unit-movement">M {movementValues.join(" / ")}</span>;
}
