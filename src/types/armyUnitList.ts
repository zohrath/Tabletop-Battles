import type { ArmyUnit, ArmyUnitWeapon } from "../utils/armyImported";

export type ArmyUnitListProps = {
  onAbilityDisplayNameChange: (
    unitId: string,
    abilityId: string,
    displayName: string,
  ) => void;
  onModelCountChange: (unitId: string, modelId: string, change: number) => void;
  units: ArmyUnit[];
};

export type WeaponCarriersProps = {
  weapon: ActiveWeapon;
};

export type UnitMovementProps = {
  unit: ArmyUnit;
};

export type WeaponStatusProps = UnitMovementProps & {
  onKeywordSelect: (keyword: KeywordDetail) => void;
  onWeaponSelect: (weapon: ActiveWeapon) => void;
};

export type WeaponGroupProps = {
  label: string;
  onKeywordSelect?: (keyword: KeywordDetail) => void;
  onWeaponSelect: (weapon: ActiveWeapon) => void;
  showPistolContext?: boolean;
  weapons: ActiveWeapon[];
};

export type RangedWeaponHintProps = {
  weapons: ActiveWeapon[];
};

export type WeaponKeywordsProps = {
  onKeywordSelect?: (keyword: KeywordDetail) => void;
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
