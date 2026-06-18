import { useState } from "react";
import type {
  ArmyUnit,
  ArmyUnitModel,
  ArmyUnitWeapon,
} from "../utils/armyImported";
import UnitCard from "./unitCard/UnitCard";

type ArmyUnitListProps = {
  onModelCountChange: (unitId: string, modelId: string, change: number) => void;
  units: ArmyUnit[];
};

export function ArmyUnitList({ onModelCountChange, units }: ArmyUnitListProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<ActiveWeapon | null>(
    null,
  );
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordDetail | null>(
    null,
  );
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? null;

  if (units.length === 0) {
    return <p className="empty-state">No units found.</p>;
  }

  return (
    <section className="unit-list" aria-label="Imported army units">
      {units.map((unit) => (
        <UnitCard
          key={unit.id}
          unit={unit}
          setSelectedKeyword={setSelectedKeyword}
          setSelectedUnitId={setSelectedUnitId}
          setSelectedWeapon={setSelectedWeapon}
        />
      ))}

      {selectedUnit && (
        <div
          aria-labelledby="model-modal-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setSelectedUnitId(null)}
        >
          <section
            className="model-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="model-modal__header">
              <div>
                <h2 id="model-modal-title">{selectedUnit.name}</h2>
                <p>{getRemainingModels(selectedUnit)} models remaining</p>
              </div>
              <button
                aria-label="Close model editor"
                className="modal-close"
                type="button"
                onClick={() => setSelectedUnitId(null)}
              >
                x
              </button>
            </header>

            <ul
              className="model-list"
              aria-label={`${selectedUnit.name} models`}
            >
              {selectedUnit.models.map((model) => (
                <ModelRow
                  key={model.id}
                  model={model}
                  unitId={selectedUnit.id}
                  onModelCountChange={onModelCountChange}
                />
              ))}
            </ul>
          </section>
        </div>
      )}

      {selectedWeapon && (
        <div
          aria-labelledby="weapon-modal-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setSelectedWeapon(null)}
        >
          <section
            className="weapon-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="model-modal__header">
              <div>
                <h2 id="weapon-modal-title">{selectedWeapon.name}</h2>
                <p>
                  {selectedWeapon.typeName === "Ranged Weapons"
                    ? "Ranged weapon"
                    : "Melee weapon"}
                </p>
              </div>
              <button
                aria-label="Close weapon details"
                className="modal-close"
                type="button"
                onClick={() => setSelectedWeapon(null)}
              >
                x
              </button>
            </header>

            <div className="weapon-detail-card">
              <div className="weapon-row__title">
                <span>{selectedWeapon.name}</span>
                {selectedWeapon.number > 1 && (
                  <strong>x{formatWeaponCount(selectedWeapon.number)}</strong>
                )}
              </div>
              <WeaponCarriers weapon={selectedWeapon} />
              <StatsGrid stats={getWeaponStats(selectedWeapon)} />
              <WeaponKeywords
                weapon={selectedWeapon}
                onKeywordSelect={(keyword) => setSelectedKeyword(keyword)}
              />
            </div>
          </section>
        </div>
      )}

      {selectedKeyword && (
        <div
          aria-labelledby="keyword-modal-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setSelectedKeyword(null)}
        >
          <section
            className="keyword-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="model-modal__header">
              <div>
                <h2 id="keyword-modal-title">{selectedKeyword.name}</h2>
                <p>Keyword</p>
              </div>
              <button
                aria-label="Close keyword details"
                className="modal-close"
                type="button"
                onClick={() => setSelectedKeyword(null)}
              >
                x
              </button>
            </header>
            <p className="keyword-description">{selectedKeyword.description}</p>
          </section>
        </div>
      )}
    </section>
  );
}

export type WeaponCarriersProps = {
  weapon: ActiveWeapon;
};

function WeaponCarriers({ weapon }: WeaponCarriersProps) {
  if (weapon.carriers.length === 0) {
    return null;
  }

  return (
    <p className="weapon-carriers">
      <span>Carried by</span> {weapon.carriers.join(", ")}
    </p>
  );
}

type ModelRowProps = {
  model: ArmyUnitModel;
  onModelCountChange: (unitId: string, modelId: string, change: number) => void;
  unitId: string;
};

type UnitMovementProps = {
  unit: ArmyUnit;
};

export function UnitMovement({ unit }: UnitMovementProps) {
  const unitProfiles = unit.profiles.filter(
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

type WeaponStatusProps = UnitMovementProps & {
  onKeywordSelect: (keyword: KeywordDetail) => void;
  onWeaponSelect: (weapon: ActiveWeapon) => void;
};

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

type WeaponGroupProps = {
  label: string;
  onKeywordSelect?: (keyword: KeywordDetail) => void;
  onWeaponSelect: (weapon: ActiveWeapon) => void;
  showPistolContext?: boolean;
  weapons: ActiveWeapon[];
};

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

type RangedWeaponHintProps = {
  weapons: ActiveWeapon[];
};

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

type WeaponKeywordsProps = {
  onKeywordSelect?: (keyword: KeywordDetail) => void;
  weapon: ActiveWeapon;
};

function WeaponKeywords({ onKeywordSelect, weapon }: WeaponKeywordsProps) {
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

function ModelRow({ model, onModelCountChange, unitId }: ModelRowProps) {
  const count = getModelCount(model.number);
  const startingNumber = getStartingModels(model);
  const stats = getUnitStats(model);

  return (
    <li className="model-row">
      <div className="model-stepper">
        <button
          aria-label={`Add one ${model.name}`}
          disabled={count >= startingNumber}
          type="button"
          onClick={() => onModelCountChange(unitId, model.id, 1)}
        >
          +
        </button>
        <div className="model-icon" aria-hidden="true">
          {getModelInitials(model.name)}
          <strong>{count}</strong>
        </div>
        <button
          aria-label={`Remove one ${model.name}`}
          disabled={count === 0}
          type="button"
          onClick={() => onModelCountChange(unitId, model.id, -1)}
        >
          -
        </button>
      </div>

      <div className="model-row__content">
        <span>{model.name}</span>
        {stats.length > 0 && (
          <StatsGrid ariaLabel={`${model.name} stats`} stats={stats} />
        )}
      </div>
    </li>
  );
}

type StatsGridProps = {
  ariaLabel?: string;
  stats: ModelStat[];
};

type ModelStat = {
  name: string;
  value: string;
};

function StatsGrid({ ariaLabel, stats }: StatsGridProps) {
  return (
    <dl className="model-stats" aria-label={ariaLabel}>
      {stats.map((stat) => (
        <div key={stat.name}>
          <dt>{stat.name}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function getRemainingModels(unit: ArmyUnit) {
  return unit.models.reduce(
    (total, model) => total + getModelCount(model.number),
    0,
  );
}

function getActiveWeapons(unit: ArmyUnit) {
  const weaponCounts = new Map<string, ActiveWeapon>();

  unit.models.forEach((model) => {
    const count = getModelCount(model.number);
    const startingNumber = getStartingModels(model);

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

function formatWeaponCount(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export type ActiveWeapon = Pick<
  ArmyUnitWeapon,
  "characteristics" | "name" | "rules" | "typeName"
> & {
  carriers: string[];
  number: number;
};

export type KeywordDetail = {
  description: string;
  name: string;
};

function getStartingModels(model: ArmyUnitModel) {
  return getModelCount(model.startingNumber, getModelCount(model.number));
}

function getModelCount(value: number | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getModelInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getUnitStats(model: ArmyUnitModel) {
  const unitProfile = model.profiles.find(
    (profile) => profile.typeName === "Unit",
  );
  return getStatsFromCharacteristics(unitProfile?.characteristics ?? []);
}

function getStatsFromCharacteristics(
  characteristics: ArmyUnitModel["profiles"][number]["characteristics"],
) {
  const statOrder = ["M", "T", "SV", "W", "LD", "OC"];

  return statOrder.flatMap((statName) => {
    const characteristic = characteristics.find(
      (stat) => stat.name.toUpperCase() === statName,
    );

    return characteristic
      ? [
          {
            name: statName === "SV" ? "Sv" : statName,
            value: characteristic.$text,
          },
        ]
      : [];
  });
}

type WeaponStatsOptions = {
  scaleAttacks?: boolean;
};

function getWeaponStats(
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

function getWeaponKeywords(
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

function getWeaponKey(weapon: ActiveWeapon) {
  return `${weapon.typeName}-${weapon.name}`;
}

function isPistolWeapon(
  weapon: ActiveWeapon | Pick<ArmyUnitWeapon, "characteristics" | "rules">,
) {
  return getWeaponKeywords(weapon).some((keyword) =>
    keyword.name.toLowerCase().startsWith("pistol"),
  );
}

function scaleAttackValue(value: string, weaponCount: number) {
  const trimmedValue = value.trim();
  const numericValue = Number(trimmedValue);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return formatWeaponCount(numericValue * weaponCount);
}
