import { useState } from "react";
import "./App.css";
import { ArmyUnitList } from "./components/ArmyUnitList";
import { Header } from "./components/header/Header";
import { Modal } from "./components/modal/Modal";
import { PhaseIndicator } from "./components/phaseIndicator/PhaseIndicator";
import { StratagemsIndicator } from "./components/stratagemsIndicator/StratagemsIndicator";
import { StratagemsToggleButton } from "./components/stratagemsIndicator/StratagemsIndicator.styles";
import {
  TURN_OWNERS,
  TURNS,
  type BattlePhase,
  type TurnOwner,
  type Turn,
} from "./types/BattlePhase";
import { Phase } from "./types/Phase";
import type { ArmyImported } from "./types/armyImported";
import {
  extractArmyRules,
  extractArmyUnits,
  type ArmyRule,
  type ArmyUnit,
} from "./utils/armyImported";
import {
  bastionTaskForceStratagems,
  coreStratagems,
  getStratagemsForBattlePhase,
} from "./utils/stratagems";

const SAVED_ARMIES_STORAGE_KEY = "tabletop-battles.saved-armies";
const PHASES = Object.values(Phase) as Phase[];

type AppPage = "battle" | "armies" | "armyRule";

const INITIAL_BATTLE_PHASE: BattlePhase = {
  phase: PHASES[0],
  owner: TURN_OWNERS[0],
  turn: TURNS[0],
};

type SavedArmy = {
  id: string;
  importedAt: string;
  name: string;
  selectedArmyRuleChoiceId?: string;
  sourceFileName: string;
  armyRules: ArmyRule[];
  units: ArmyUnit[];
};

function App() {
  const [savedArmies, setSavedArmies] = useState<SavedArmy[]>(loadSavedArmies);
  const [activeArmyId, setActiveArmyId] = useState(
    () => savedArmies[0]?.id ?? "",
  );
  const [page, setPage] = useState<AppPage>("battle");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [firstTurnOwner, setFirstTurnOwner] = useState<TurnOwner | null>(null);
  const [firstTurnModalOpen, setFirstTurnModalOpen] = useState(false);
  const [stratagemsIndicatorOpen, setStratagemsIndicatorOpen] =
    useState(false);
  const [battlePhase, setBattlePhase] =
    useState<BattlePhase>(INITIAL_BATTLE_PHASE);

  const activeArmy =
    savedArmies.find((army) => army.id === activeArmyId) ?? null;
  const turnOwners = getTurnOwners(firstTurnOwner);
  const visibleCoreStratagems = getStratagemsForBattlePhase(
    coreStratagems,
    battlePhase,
  );
  const visibleDetachmentStratagems = getStratagemsForBattlePhase(
    bastionTaskForceStratagems,
    battlePhase,
  );
  const hasVisibleStratagems =
    visibleCoreStratagems.length > 0 || visibleDetachmentStratagems.length > 0;

  async function handleRosterFile(file: File | undefined) {
    setError("");

    if (!file) {
      return;
    }

    try {
      const army = JSON.parse(await file.text()) as ArmyImported;
      const armyRules = extractArmyRules(army);

      console.log("Imported army stratagems", armyRules);

      const savedArmy: SavedArmy = {
        id: createId(),
        importedAt: new Date().toISOString(),
        name: army.roster.name || file.name,
        armyRules,
        sourceFileName: file.name,
        units: extractArmyUnits(army),
      };

      updateSavedArmies((currentArmies) => [savedArmy, ...currentArmies]);
      setActiveArmyId(savedArmy.id);
      setPage("battle");
      setMenuOpen(false);
    } catch {
      setError("Could not read this roster JSON.");
      setMenuOpen(false);
    }
  }

  function changeModelCount(unitId: string, modelId: string, change: number) {
    if (!activeArmy) {
      return;
    }

    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) => {
        if (army.id !== activeArmy.id) {
          return army;
        }

        return {
          ...army,
          units: army.units.map((unit) => {
            if (unit.id !== unitId) {
              return unit;
            }

            return {
              ...unit,
              models: unit.models.map((model) => {
                if (model.id !== modelId) {
                  return model;
                }

                const currentCount = getModelCount(model.number);
                const startingCount = getModelCount(
                  model.startingNumber,
                  currentCount,
                );

                return {
                  ...model,
                  number: clamp(currentCount + change, 0, startingCount),
                };
              }),
            };
          }),
        };
      }),
    );
  }

  function renameArmy(armyId: string, name: string) {
    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) =>
        army.id === armyId ? { ...army, name } : army,
      ),
    );
  }

  function deleteArmy(armyId: string) {
    updateSavedArmies((currentArmies) => {
      const nextArmies = currentArmies.filter((army) => army.id !== armyId);

      if (armyId === activeArmyId) {
        setActiveArmyId(nextArmies[0]?.id ?? "");
      }

      return nextArmies;
    });
  }

  function openArmy(armyId: string) {
    setActiveArmyId(armyId);
    setPage("battle");
  }

  function chooseArmyRule(choiceId: string) {
    if (!activeArmy) {
      return;
    }

    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) =>
        army.id === activeArmy.id
          ? { ...army, selectedArmyRuleChoiceId: choiceId }
          : army,
      ),
    );
  }

  function changeAbilityDisplayName(
    unitId: string,
    abilityId: string,
    displayName: string,
  ) {
    if (!activeArmy) {
      return;
    }

    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) => {
        if (army.id !== activeArmy.id) {
          return army;
        }

        return {
          ...army,
          units: army.units.map((unit) => {
            if (unit.id !== unitId) {
              return unit;
            }

            return {
              ...unit,
              abilities: (unit.abilities ?? []).map((ability) =>
                ability.id === abilityId
                  ? {
                      ...ability,
                      displayName: displayName.trim() || undefined,
                    }
                  : ability,
              ),
            };
          }),
        };
      }),
    );
  }

  function updateSavedArmies(
    getNextArmies: (currentArmies: SavedArmy[]) => SavedArmy[],
  ) {
    setSavedArmies((currentArmies) => {
      const nextArmies = getNextArmies(currentArmies);
      localStorage.setItem(
        SAVED_ARMIES_STORAGE_KEY,
        JSON.stringify(nextArmies),
      );
      return nextArmies;
    });
  }

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <h1>
            {page === "armies" ? "Armies" : activeArmy?.name || "Army Units"}
          </h1>
          <p>
            {page === "armies"
              ? `${savedArmies.length} saved armies`
              : page === "armyRule"
                ? getSelectedArmyRuleChoice(activeArmy)?.name ||
                  "Choose an army rule"
                : activeArmy?.sourceFileName ||
                  "Choose a NewRecruit or BattleScribe roster JSON."}
          </p>
        </div>

        <div className="app-menu">
          <button
            aria-controls="app-menu-panel"
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
          >
            <span />
            <span />
            <span />
          </button>

          {menuOpen && (
            <div className="menu-panel" id="app-menu-panel">
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  setPage("armies");
                  setMenuOpen(false);
                }}
              >
                Armies
              </button>
              <button
                className="menu-item"
                disabled={!activeArmy}
                type="button"
                onClick={() => {
                  setPage("battle");
                  setMenuOpen(false);
                }}
              >
                Current Army
              </button>
              <button
                className="menu-item"
                disabled={!activeArmy}
                type="button"
                onClick={() => {
                  setPage("armyRule");
                  setMenuOpen(false);
                }}
              >
                Army Rule
              </button>
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  setFirstTurnModalOpen(true);
                  setMenuOpen(false);
                }}
              >
                First Turn
              </button>
              <label className="menu-item">
                <input
                  accept="application/json,.json"
                  type="file"
                  onChange={(event) =>
                    void handleRosterFile(event.target.files?.[0])
                  }
                />
                Import JSON
              </label>
            </div>
          )}
        </div>
      </section>

      {error && <p className="error-message">{error}</p>}

      {page === "armies" ? (
        <ArmyManager
          activeArmyId={activeArmyId}
          armies={savedArmies}
          onDeleteArmy={deleteArmy}
          onOpenArmy={openArmy}
          onRenameArmy={renameArmy}
        />
      ) : page === "armyRule" ? (
        <ArmyRulePage army={activeArmy} onChooseArmyRule={chooseArmyRule} />
      ) : (
        <>
          {!firstTurnOwner && (
            <p className="turn-owner-warning">Choose who started first turn.</p>
          )}
          {hasVisibleStratagems && (
            <StratagemsToggleButton
              aria-expanded={stratagemsIndicatorOpen}
              aria-label={
                stratagemsIndicatorOpen
                  ? "Hide stratagems indicator"
                  : "Show stratagems indicator"
              }
              type="button"
              onClick={() => setStratagemsIndicatorOpen((isOpen) => !isOpen)}
            >
              <span aria-hidden="true" />
            </StratagemsToggleButton>
          )}
          {stratagemsIndicatorOpen && visibleDetachmentStratagems.length > 0 && (
            <StratagemsIndicator stratagems={visibleDetachmentStratagems} />
          )}
          {stratagemsIndicatorOpen && visibleCoreStratagems.length > 0 && (
            <StratagemsIndicator
              side="right"
              stratagems={visibleCoreStratagems}
            />
          )}
          <SelectedArmyRuleBanner army={activeArmy} />
          <ArmyUnitList
            onAbilityDisplayNameChange={changeAbilityDisplayName}
            onModelCountChange={changeModelCount}
            units={activeArmy?.units ?? []}
          />
        </>
      )}
      {firstTurnModalOpen && (
        <Modal
          ariaLabelledBy="first-turn-modal-title"
          closeAriaLabel="Close first turn settings"
          header={
            <Header
              title="First Turn"
              titleId="first-turn-modal-title"
              subtitle="Choose who started the battle round sequence."
            />
          }
          maxWidth={480}
          onClose={() => setFirstTurnModalOpen(false)}
        >
          <fieldset className="first-turn-options">
            <legend>First player</legend>
            {TURN_OWNERS.map((owner) => (
              <label key={owner}>
                <input
                  checked={firstTurnOwner === owner}
                  name="first-turn-owner"
                  type="radio"
                  value={owner}
                  onChange={() => {
                    setFirstTurnOwner(owner);
                    setBattlePhase((current) => ({
                      ...current,
                      owner:
                        current.owner === TURN_OWNERS[0]
                          ? owner
                          : getOtherTurnOwner(owner),
                    }));
                  }}
                />
                <span>{owner === "You" ? "You started" : "Opponent started"}</span>
              </label>
            ))}
          </fieldset>
        </Modal>
      )}
      <PhaseIndicator
        battlePhase={battlePhase}
        canGoNext={!isLastBattlePhase(battlePhase, turnOwners)}
        canGoPrevious={!isFirstBattlePhase(battlePhase, turnOwners)}
        canReset={isLastBattlePhase(battlePhase, turnOwners)}
        onNextPhase={() =>
          setBattlePhase((current) =>
            isLastBattlePhase(current, turnOwners)
              ? current
              : getNextBattlePhase(current, turnOwners),
          )
        }
        onPreviousPhase={() =>
          setBattlePhase((current) =>
            isFirstBattlePhase(current, turnOwners)
              ? current
              : getPreviousBattlePhase(current, turnOwners),
          )
        }
        onReset={() => setBattlePhase(getInitialBattlePhase(turnOwners))}
      />
    </main>
  );
}

function getInitialBattlePhase(turnOwners: readonly TurnOwner[]): BattlePhase {
  return {
    phase: PHASES[0],
    owner: turnOwners[0],
    turn: TURNS[0],
  };
}

function getTurnOwners(firstOwner: TurnOwner | null): readonly TurnOwner[] {
  return firstOwner ? [firstOwner, getOtherTurnOwner(firstOwner)] : TURN_OWNERS;
}

function getOtherTurnOwner(owner: TurnOwner): TurnOwner {
  return owner === "You" ? "Opponent" : "You";
}

function isFirstBattlePhase(
  current: BattlePhase,
  turnOwners: readonly TurnOwner[],
) {
  return (
    current.turn === TURNS[0] &&
    current.owner === turnOwners[0] &&
    current.phase === PHASES[0]
  );
}

function isLastBattlePhase(
  current: BattlePhase,
  turnOwners: readonly TurnOwner[],
) {
  return (
    current.turn === TURNS[TURNS.length - 1] &&
    current.owner === turnOwners[turnOwners.length - 1] &&
    current.phase === PHASES[PHASES.length - 1]
  );
}

function getPreviousBattlePhase(
  current: BattlePhase,
  turnOwners: readonly TurnOwner[],
): BattlePhase {
  if (current.phase !== PHASES[0]) {
    return {
      ...current,
      phase: getPreviousPhase(current.phase),
    };
  }

  const isFirstOwner = current.owner === turnOwners[0];

  return {
    phase: PHASES[PHASES.length - 1],
    owner: isFirstOwner
      ? turnOwners[turnOwners.length - 1]
      : getPreviousTurnOwner(current.owner, turnOwners),
    turn: isFirstOwner ? getPreviousTurn(current.turn) : current.turn,
  };
}

function getNextBattlePhase(
  current: BattlePhase,
  turnOwners: readonly TurnOwner[],
): BattlePhase {
  if (current.phase !== PHASES[PHASES.length - 1]) {
    return {
      ...current,
      phase: getNextPhase(current.phase),
    };
  }

  const isLastOwner = current.owner === turnOwners[turnOwners.length - 1];

  return {
    phase: PHASES[0],
    owner: isLastOwner ? turnOwners[0] : getNextTurnOwner(current.owner, turnOwners),
    turn: isLastOwner ? getNextTurn(current.turn) : current.turn,
  };
}

function getPreviousTurn(currentTurn: Turn) {
  const currentIndex = TURNS.indexOf(currentTurn);
  const previousIndex = currentIndex <= 0 ? TURNS.length - 1 : currentIndex - 1;

  return TURNS[previousIndex];
}

function getNextTurn(currentTurn: Turn) {
  const currentIndex = TURNS.indexOf(currentTurn);
  const nextIndex = currentIndex >= TURNS.length - 1 ? 0 : currentIndex + 1;

  return TURNS[nextIndex];
}

function getPreviousTurnOwner(
  currentOwner: TurnOwner,
  turnOwners: readonly TurnOwner[],
) {
  const currentIndex = turnOwners.indexOf(currentOwner);
  const previousIndex =
    currentIndex <= 0 ? turnOwners.length - 1 : currentIndex - 1;

  return turnOwners[previousIndex];
}

function getNextTurnOwner(
  currentOwner: TurnOwner,
  turnOwners: readonly TurnOwner[],
) {
  const currentIndex = turnOwners.indexOf(currentOwner);
  const nextIndex =
    currentIndex >= turnOwners.length - 1 ? 0 : currentIndex + 1;

  return turnOwners[nextIndex];
}

function getPreviousPhase(currentPhase: Phase) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const previousIndex =
    currentIndex <= 0 ? PHASES.length - 1 : currentIndex - 1;

  return PHASES[previousIndex];
}

function getNextPhase(currentPhase: Phase) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const nextIndex = currentIndex >= PHASES.length - 1 ? 0 : currentIndex + 1;

  return PHASES[nextIndex];
}

type ArmyRulePageProps = {
  army: SavedArmy | null;
  onChooseArmyRule: (choiceId: string) => void;
};

function ArmyRulePage({ army, onChooseArmyRule }: ArmyRulePageProps) {
  if (!army) {
    return <p className="empty-state">Import or open an army first.</p>;
  }

  const rules = army.armyRules ?? [];
  const choiceRules = rules.filter((rule) => rule.choices.length > 0);

  if (rules.length === 0) {
    return <p className="empty-state">No army rules found in this import.</p>;
  }

  return (
    <section className="army-rule-page" aria-label="Army rule selection">
      {choiceRules.length > 0
        ? choiceRules.map((rule) => (
            <article className="army-rule-card" key={rule.id}>
              <h2>{rule.name}</h2>
              <label>
                <span>Chosen rule</span>
                <select
                  value={army.selectedArmyRuleChoiceId ?? ""}
                  onChange={(event) => onChooseArmyRule(event.target.value)}
                >
                  <option value="">None selected</option>
                  {rule.choices.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {choice.name}
                    </option>
                  ))}
                </select>
              </label>
              <SelectedArmyRuleDescription army={army} />
            </article>
          ))
        : rules.map((rule) => (
            <article className="army-rule-card" key={rule.id}>
              <h2>{rule.name}</h2>
              <p>{rule.description}</p>
            </article>
          ))}
    </section>
  );
}

function SelectedArmyRuleBanner({ army }: { army: SavedArmy | null }) {
  const selectedChoice = getSelectedArmyRuleChoice(army);

  if (!selectedChoice) {
    return null;
  }

  return (
    <section className="selected-army-rule">
      <span>Army rule</span>
      <strong>{selectedChoice.name}</strong>
    </section>
  );
}

function SelectedArmyRuleDescription({ army }: { army: SavedArmy }) {
  const selectedChoice = getSelectedArmyRuleChoice(army);

  if (!selectedChoice) {
    return null;
  }

  return <p className="army-rule-description">{selectedChoice.description}</p>;
}

function getSelectedArmyRuleChoice(army: SavedArmy | null) {
  if (!army?.selectedArmyRuleChoiceId) {
    return null;
  }

  return (
    army.armyRules
      ?.flatMap((rule) => rule.choices)
      .find((choice) => choice.id === army.selectedArmyRuleChoiceId) ?? null
  );
}

type ArmyManagerProps = {
  activeArmyId: string;
  armies: SavedArmy[];
  onDeleteArmy: (armyId: string) => void;
  onOpenArmy: (armyId: string) => void;
  onRenameArmy: (armyId: string, name: string) => void;
};

function ArmyManager({
  activeArmyId,
  armies,
  onDeleteArmy,
  onOpenArmy,
  onRenameArmy,
}: ArmyManagerProps) {
  if (armies.length === 0) {
    return <p className="empty-state">No saved armies yet.</p>;
  }

  return (
    <section className="army-manager" aria-label="Saved armies">
      {armies.map((army) => (
        <article className="army-manager-card" key={army.id}>
          <div className="army-manager-card__body">
            <label>
              <span>Army name</span>
              <input
                value={army.name}
                onChange={(event) => onRenameArmy(army.id, event.target.value)}
              />
            </label>
            <p>
              {army.units.length} units / imported{" "}
              {new Date(army.importedAt).toLocaleDateString()}
            </p>
            {army.id === activeArmyId && <strong>Current army</strong>}
          </div>

          <div className="army-manager-card__actions">
            <button type="button" onClick={() => onOpenArmy(army.id)}>
              Open
            </button>
            <button type="button" onClick={() => onDeleteArmy(army.id)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function loadSavedArmies(): SavedArmy[] {
  try {
    const savedArmies = localStorage.getItem(SAVED_ARMIES_STORAGE_KEY);
    const parsedArmies = savedArmies
      ? (JSON.parse(savedArmies) as SavedArmy[])
      : [];

    return parsedArmies.map((army) => ({
      ...army,
      armyRules: army.armyRules ?? [],
      units: (army.units ?? []).map((unit) => ({
        ...unit,
        abilities: (unit.abilities ?? []).map((ability) => ({
          ...ability,
          displayName: ability.displayName || undefined,
        })).sort(compareSavedAbilities),
      })),
    }));
  } catch {
    return [];
  }
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getModelCount(
  value: number | undefined,
  fallback: number = 0,
): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function compareSavedAbilities(
  first: ArmyUnit["abilities"][number],
  second: ArmyUnit["abilities"][number],
) {
  const firstIsLeader = isSavedLeaderAbility(first);
  const secondIsLeader = isSavedLeaderAbility(second);

  if (firstIsLeader !== secondIsLeader) {
    return firstIsLeader ? 1 : -1;
  }

  return first.name.localeCompare(second.name);
}

function isSavedLeaderAbility(ability: ArmyUnit["abilities"][number]) {
  return ability.name.trim().toLowerCase() === "leader";
}

export default App;
