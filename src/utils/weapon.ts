import type { ArmyUnit, ArmyUnitWeapon } from "./armyImported";
import type { ActiveWeapon, WeaponStatsOptions } from "../types/armyUnitList";

export function getActiveWeapons(unit: ArmyUnit) {
  const weaponCounts = new Map<string, ActiveWeapon>();

  unit.models.forEach((model) => {
    const count = getModelCount(model.number);
    const startingNumber = getStartingModels(
      model.number,
      model.startingNumber,
    );

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
      const keywordOverride = unit.weaponKeywordOverrides?.find(
        (override) => override.weaponKey === key,
      );

      carriers.add(model.name);

      weaponCounts.set(key, {
        carriers: [...carriers],
        characteristics: weapon.characteristics,
        customKeywords: keywordOverride?.added,
        name: weapon.name,
        number: (current?.number ?? 0) + activeWeaponCount,
        removedKeywords: keywordOverride?.removed,
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
  weapon: ActiveWeapon | Pick<ArmyUnitWeapon, "characteristics" | "rules">,
) {
  const importedKeywords = weapon.characteristics.find(
    (stat) => stat.name.toUpperCase() === "KEYWORDS",
  )?.$text;
  const keywords =
    importedKeywords
      ?.split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword && keyword !== "-") ?? [];

  const removedKeywords = "removedKeywords" in weapon
    ? (weapon.removedKeywords ?? []).map(normalizeKeywordName)
    : [];
  const customKeywords = "customKeywords" in weapon
    ? (weapon.customKeywords ?? [])
    : [];
  const keywordDetails = [...new Set(keywords.filter(Boolean))]
    .filter((keyword) => !removedKeywords.includes(normalizeKeywordName(keyword)))
    .map((keyword) => {
      const matchingRule = weapon.rules.find((rule) =>
        keyword.toLowerCase().startsWith(rule.name.toLowerCase()),
      );

      return {
        description: matchingRule?.description,
        name: keyword,
      };
    });

  customKeywords.forEach((keyword) => {
    if (
      !removedKeywords.includes(normalizeKeywordName(keyword.name)) &&
      !keywordDetails.some(
        (existingKeyword) =>
          normalizeKeywordName(existingKeyword.name) ===
          normalizeKeywordName(keyword.name),
      )
    ) {
      keywordDetails.push({
        description: keyword.description,
        name: keyword.name,
      });
    }
  });

  return keywordDetails;
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

function getStartingModels(
  number: number | undefined,
  startingNumber?: number,
) {
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

function normalizeKeywordName(value: string) {
  return value.trim().toLowerCase();
}
