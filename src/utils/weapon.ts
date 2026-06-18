import type { ArmyUnit, ArmyUnitWeapon } from "./armyImported";
import type {
  ActiveWeapon,
  WeaponStatsOptions,
} from "../types/armyUnitList";

export function getActiveWeapons(unit: ArmyUnit) {
  const weaponCounts = new Map<string, ActiveWeapon>();

  unit.models.forEach((model) => {
    const count = getModelCount(model.number);
    const startingNumber = getStartingModels(model.number, model.startingNumber);

    if (count === 0) {
      return;
    }

    model.weapons.forEach((weapon) => {
      const perModelCount =
        startingNumber > 0 ? weapon.number / startingNumber : weapon.number;
      const activeWeaponCount = count * perModelCount;
      const key = `${weapon.typeName}-${weapon.name}`;
      const current = weaponCounts.get(key);
      const carriers = new Set(current?.carriers ?? []);

      carriers.add(model.name);

      weaponCounts.set(key, {
        carriers: [...carriers],
        characteristics: weapon.characteristics,
        name: weapon.name,
        number: (current?.number ?? 0) + activeWeaponCount,
        rules: weapon.rules,
        typeName: weapon.typeName,
      });
    });
  });

  return [...weaponCounts.values()].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

export function getWeaponStats(
  weapon: ActiveWeapon,
  options: WeaponStatsOptions = {},
) {
  const statOrder =
    weapon.typeName === "Ranged Weapons"
      ? ["Range", "A", "BS", "S", "AP", "D", "Keywords"]
      : ["Range", "A", "WS", "S", "AP", "D", "Keywords"];

  return statOrder.flatMap((statName) => {
    if (statName === "Keywords") {
      return [];
    }

    const characteristic = weapon.characteristics.find(
      (stat) => stat.name.toUpperCase() === statName.toUpperCase(),
    );

    if (characteristic && statName === "A" && options.scaleAttacks) {
      return [
        {
          name: statName,
          value: scaleAttackValue(characteristic.$text, weapon.number),
        },
      ];
    }

    return characteristic
      ? [{ name: statName, value: characteristic.$text }]
      : [];
  });
}

export function getWeaponKeywords(
  weapon: Pick<ArmyUnitWeapon, "characteristics" | "rules">,
) {
  const importedKeywords = weapon.characteristics.find(
    (stat) => stat.name.toUpperCase() === "KEYWORDS",
  )?.$text;
  const keywords =
    importedKeywords
      ?.split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword && keyword !== "-") ?? [];

  return [...new Set(keywords.filter(Boolean))].map((keyword) => {
    const matchingRule = weapon.rules.find((rule) =>
      keyword.toLowerCase().startsWith(rule.name.toLowerCase()),
    );

    return {
      description: matchingRule?.description,
      name: keyword,
    };
  });
}

export function getWeaponKey(weapon: ActiveWeapon) {
  return `${weapon.typeName}-${weapon.name}`;
}

export function isPistolWeapon(
  weapon: ActiveWeapon | Pick<ArmyUnitWeapon, "characteristics" | "rules">,
) {
  return getWeaponKeywords(weapon).some((keyword) =>
    keyword.name.toLowerCase().startsWith("pistol"),
  );
}

export function formatWeaponCount(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function getStartingModels(number: number | undefined, startingNumber?: number) {
  return getModelCount(startingNumber, getModelCount(number));
}

function getModelCount(value: number | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function scaleAttackValue(value: string, weaponCount: number) {
  const trimmedValue = value.trim();
  const numericValue = Number(trimmedValue);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return formatWeaponCount(numericValue * weaponCount);
}
