import type {
  RangedWeaponHintProps,
  WeaponCarriersProps,
  WeaponGroupProps,
  WeaponKeywordsProps,
  WeaponStatusProps,
} from "../../types/armyUnitList";
import {
  getActiveWeapons,
  getWeaponKey,
  getWeaponKeywords,
  getWeaponStats,
  isPistolWeapon,
} from "../../utils/weapon";
import { StatsGrid } from "../statsGrid/StatsGrid";
import { Carriers } from "./WeaponStatus.styles";

export function WeaponStatus({
  onKeywordSelect,
  onWeaponSelect,
  unit,
}: WeaponStatusProps) {
  const weapons = getActiveWeapons(unit);
  const rangedWeapons = weapons.filter(
    (weapon) => weapon.typeName === "Ranged Weapons",
  );
  const meleeWeapons = weapons.filter(
    (weapon) => weapon.typeName === "Melee Weapons",
  );

  if (weapons.length === 0) {
    return null;
  }

  return (
    <div className="weapon-status" aria-label={`${unit.name} active weapons`}>
      <WeaponGroup
        label="Ranged"
        weapons={rangedWeapons}
        onWeaponSelect={onWeaponSelect}
        onKeywordSelect={onKeywordSelect}
        showPistolContext
      />
      <WeaponGroup
        label="Melee"
        weapons={meleeWeapons}
        onWeaponSelect={onWeaponSelect}
        onKeywordSelect={onKeywordSelect}
      />
    </div>
  );
}

function WeaponGroup({
  label,
  onKeywordSelect,
  onWeaponSelect,
  showPistolContext = false,
  weapons,
}: WeaponGroupProps) {
  if (weapons.length === 0) {
    return null;
  }

  return (
    <section className="weapon-group">
      <h3>{label}</h3>
      {showPistolContext && <RangedWeaponHint weapons={weapons} />}
      <ul>
        {weapons.map((weapon) => (
          <li key={getWeaponKey(weapon)}>
            <button
              className="weapon-stat-button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onWeaponSelect(weapon);
              }}
            >
              <span className="weapon-button-name">{weapon.name}</span>
              <StatsGrid
                stats={getWeaponStats(weapon, { scaleAttacks: true })}
              />
            </button>
            <WeaponKeywords weapon={weapon} onKeywordSelect={onKeywordSelect} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RangedWeaponHint({ weapons }: RangedWeaponHintProps) {
  const hasMainRangedWeapon = weapons.some((weapon) => !isPistolWeapon(weapon));

  return (
    <p className="ranged-weapon-hint">
      {hasMainRangedWeapon
        ? "Main ranged weapon available"
        : "Pistol-only shooting"}
    </p>
  );
}

export function WeaponKeywords({
  onKeywordSelect,
  weapon,
}: WeaponKeywordsProps) {
  const keywords = getWeaponKeywords(weapon);

  if (keywords.length === 0) {
    return null;
  }

  return (
    <ul className="weapon-keywords" aria-label={`${weapon.name} keywords`}>
      {keywords.map((keyword) => (
        <li key={keyword.name}>
          <button
            disabled={!keyword.description}
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              if (keyword.description) {
                onKeywordSelect?.({
                  description: keyword.description,
                  name: keyword.name,
                });
              }
            }}
          >
            {keyword.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function WeaponCarriers({ weapon }: WeaponCarriersProps) {
  if (weapon.carriers.length === 0) {
    return null;
  }

  return (
    <Carriers>
      <span>Carried by</span> {weapon.carriers.join(", ")}
    </Carriers>
  );
}
