import type { ArmyUnit, ArmyUnitWeapon } from "../utils/armyImported";

export type ArmyUnitListProps = {
  onAddAbility: (unitId: string) => void;
  onAddWeaponKeyword: (unitId: string, weaponKey: string) => void;
  onAbilityDisplayNameChange: (
    unitId: string,
    abilityId: string,
    displayName: string,
  ) => void;
  onModelCountChange: (unitId: string, modelId: string, change: number) => void;
  onRemoveAbility: (unitId: string) => void;
  onRemoveWeaponKeyword: (unitId: string, weaponKey: string) => void;
  units: ArmyUnit[];
};

export type WeaponCarriersProps = {
  weapon: ActiveWeapon;
};

export type UnitMovementProps = {
  unit: ArmyUnit;
};

export type WeaponStatusProps = UnitMovementProps & {
  onAddWeaponKeyword: (weaponKey: string) => void;
  onKeywordSelect: (keyword: KeywordDetail) => void;
  onRemoveWeaponKeyword: (weaponKey: string) => void;
  onWeaponSelect: (weapon: ActiveWeapon) => void;
};

export type WeaponGroupProps = {
  label: string;
  onAddWeaponKeyword: (weaponKey: string) => void;
  onKeywordSelect?: (keyword: KeywordDetail) => void;
  onRemoveWeaponKeyword: (weaponKey: string) => void;
  onWeaponSelect: (weapon: ActiveWeapon) => void;
  showPistolContext?: boolean;
  weapons: ActiveWeapon[];
};

export type RangedWeaponHintProps = {
  weapons: ActiveWeapon[];
};

export type WeaponKeywordsProps = {
  onAddKeyword?: () => void;
  onKeywordSelect?: (keyword: KeywordDetail) => void;
  onRemoveKeyword?: () => void;
  weapon: ActiveWeapon;
};

export type StatsGridProps = {
  ariaLabel?: string;
  stats: ModelStat[];
};

export type ModelStat = {
  name: string;
  value: string;
};

export type ActiveWeapon = Pick<
  ArmyUnitWeapon,
  "characteristics" | "name" | "rules" | "typeName"
> & {
  carriers: string[];
  number: number;
  customKeywords?: { description?: string; name: string }[];
  removedKeywords?: string[];
};

export type KeywordDetail = {
  abilityId?: string;
  description: string;
  displayName?: string;
  source?: "ability" | "keyword";
  name: string;
  unitId?: string;
};

export type WeaponStatsOptions = {
  scaleAttacks?: boolean;
};
