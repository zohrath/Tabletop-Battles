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
  onAddWeaponKeyword,
  onKeywordSelect,
  onRemoveWeaponKeyword,
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
        onAddWeaponKeyword={onAddWeaponKeyword}
        onRemoveWeaponKeyword={onRemoveWeaponKeyword}
        showPistolContext
      />
      <WeaponGroup
        label="Melee"
        weapons={meleeWeapons}
        onWeaponSelect={onWeaponSelect}
        onKeywordSelect={onKeywordSelect}
        onAddWeaponKeyword={onAddWeaponKeyword}
        onRemoveWeaponKeyword={onRemoveWeaponKeyword}
      />
    </div>
  );
}

function WeaponGroup({
  label,
  onAddWeaponKeyword,
  onKeywordSelect,
  onRemoveWeaponKeyword,
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
            <WeaponKeywords
              weapon={weapon}
              onAddKeyword={() => onAddWeaponKeyword(getWeaponKey(weapon))}
              onKeywordSelect={onKeywordSelect}
              onRemoveKeyword={() => onRemoveWeaponKeyword(getWeaponKey(weapon))}
            />
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
  onAddKeyword,
  onKeywordSelect,
  onRemoveKeyword,
  weapon,
}: WeaponKeywordsProps) {
  const keywords = getWeaponKeywords(weapon);
  const canEditKeywords = Boolean(onAddKeyword && onRemoveKeyword);

  return (
    <div className="keyword-row">
      {keywords.length > 0 && (
        <ul className="weapon-keywords" aria-label={`${weapon.name} keywords`}>
          {keywords.map((keyword) => (
            <li key={keyword.name}>
              <button
                aria-disabled={!keyword.description}
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
      )}
      {canEditKeywords && (
        <div className="chip-controls" aria-label={`${weapon.name} keyword controls`}>
          <button
            aria-label={`Add keyword to ${weapon.name}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddKeyword?.();
            }}
          >
            +
          </button>
          <button
            aria-label={`Remove keyword from ${weapon.name}`}
            disabled={keywords.length === 0}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveKeyword?.();
            }}
          >
            -
          </button>
        </div>
      )}
    </div>
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
