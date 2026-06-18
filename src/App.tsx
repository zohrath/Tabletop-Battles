import { useState } from "react";
import "./App.css";
import {
  PhaseIndicatorActions,
  PhaseIndicatorButton,
  PhaseIndicatorPanel,
} from "./App.styles";
import { ArmyUnitList } from "./components/ArmyUnitList";
import { Phase } from "./types/Phase";
import type { ArmyImported } from "./types/armyImported";
import {
  extractArmyRules,
  extractArmyUnits,
  type ArmyRule,
  type ArmyUnit,
} from "./utils/armyImported";

const SAVED_ARMIES_STORAGE_KEY = "tabletop-battles.saved-armies";
const PHASES = Object.values(Phase) as Phase[];
const PLAYERS = ["Player 1", "Player 2"] as const;
const TURNS = [1, 2, 3, 4, 5] as const;

type AppPage = "battle" | "armies" | "armyRule";
type PlayerName = (typeof PLAYERS)[number];
type Turn = (typeof TURNS)[number];

type BattlePhase = {
  phase: Phase;
  player: PlayerName;
  turn: Turn;
};

const INITIAL_BATTLE_PHASE: BattlePhase = {
  phase: PHASES[0],
  player: PLAYERS[0],
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
  const [battlePhase, setBattlePhase] =
    useState<BattlePhase>(INITIAL_BATTLE_PHASE);
  const [phaseIndicatorOpen, setPhaseIndicatorOpen] = useState(false);

  const activeArmy =
    savedArmies.find((army) => army.id === activeArmyId) ?? null;

  async function handleRosterFile(file: File | undefined) {
    setError("");

    if (!file) {
      return;
    }

    try {
      const army = JSON.parse(await file.text()) as ArmyImported;
      const savedArmy: SavedArmy = {
        id: createId(),
        importedAt: new Date().toISOString(),
        name: army.roster.name || file.name,
        armyRules: extractArmyRules(army),
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
          <SelectedArmyRuleBanner army={activeArmy} />
          <ArmyUnitList
            onModelCountChange={changeModelCount}
            units={activeArmy?.units ?? []}
          />
        </>
      )}
      <PhaseIndicator
        battlePhase={battlePhase}
        canGoNext={!isLastBattlePhase(battlePhase)}
        canGoPrevious={!isFirstBattlePhase(battlePhase)}
        canReset={isLastBattlePhase(battlePhase)}
        isOpen={phaseIndicatorOpen}
        onNextPhase={() =>
          setBattlePhase((current) =>
            isLastBattlePhase(current) ? current : getNextBattlePhase(current),
          )
        }
        onPreviousPhase={() =>
          setBattlePhase((current) =>
            isFirstBattlePhase(current)
              ? current
              : getPreviousBattlePhase(current),
          )
        }
        onReset={() => setBattlePhase(INITIAL_BATTLE_PHASE)}
        onToggle={() => setPhaseIndicatorOpen((isOpen) => !isOpen)}
      />
    </main>
  );
}

type PhaseIndicatorProps = {
  battlePhase: BattlePhase;
  canGoNext: boolean;
  canGoPrevious: boolean;
  canReset: boolean;
  isOpen: boolean;
  onNextPhase: () => void;
  onPreviousPhase: () => void;
  onReset: () => void;
  onToggle: () => void;
};

function PhaseIndicator({
  battlePhase,
  canGoNext,
  canGoPrevious,
  canReset,
  isOpen,
  onNextPhase,
  onPreviousPhase,
  onReset,
  onToggle,
}: PhaseIndicatorProps) {
  return (
    <>
      <PhaseIndicatorButton
        aria-controls="phase-indicator-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close phase indicator" : "Open phase indicator"}
        type="button"
        onClick={onToggle}
      >
        <span aria-hidden="true" />
      </PhaseIndicatorButton>

      {isOpen && (
        <PhaseIndicatorPanel
          aria-label="Phase indicator"
          id="phase-indicator-panel"
        >
          <div>
            <span>
              Turn {battlePhase.turn} - {battlePhase.player} {battlePhase.phase}
            </span>
          </div>
          <PhaseIndicatorActions>
            <button
              data-action="previous"
              disabled={!canGoPrevious}
              type="button"
              onClick={onPreviousPhase}
            >
              Previous
            </button>
            <button
              data-action="next"
              disabled={!canGoNext}
              type="button"
              onClick={onNextPhase}
            >
              Next
            </button>
            <button
              aria-hidden={!canReset}
              aria-label="Reset phase sequence"
              data-action="reset"
              disabled={!canReset}
              tabIndex={canReset ? 0 : -1}
              title="Reset"
              type="button"
              onClick={onReset}
            >
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v6h6" />
              </svg>
            </button>
          </PhaseIndicatorActions>
        </PhaseIndicatorPanel>
      )}
    </>
  );
}

function isFirstBattlePhase(current: BattlePhase) {
  return (
    current.turn === TURNS[0] &&
    current.player === PLAYERS[0] &&
    current.phase === PHASES[0]
  );
}

function isLastBattlePhase(current: BattlePhase) {
  return (
    current.turn === TURNS[TURNS.length - 1] &&
    current.player === PLAYERS[PLAYERS.length - 1] &&
    current.phase === PHASES[PHASES.length - 1]
  );
}

function getPreviousBattlePhase(current: BattlePhase): BattlePhase {
  if (current.phase !== PHASES[0]) {
    return {
      ...current,
      phase: getPreviousPhase(current.phase),
    };
  }

  const isFirstPlayer = current.player === PLAYERS[0];

  return {
    phase: PHASES[PHASES.length - 1],
    player: isFirstPlayer
      ? PLAYERS[PLAYERS.length - 1]
      : getPreviousPlayer(current.player),
    turn: isFirstPlayer ? getPreviousTurn(current.turn) : current.turn,
  };
}

function getNextBattlePhase(current: BattlePhase): BattlePhase {
  if (current.phase !== PHASES[PHASES.length - 1]) {
    return {
      ...current,
      phase: getNextPhase(current.phase),
    };
  }

  const isLastPlayer = current.player === PLAYERS[PLAYERS.length - 1];

  return {
    phase: PHASES[0],
    player: isLastPlayer ? PLAYERS[0] : getNextPlayer(current.player),
    turn: isLastPlayer ? getNextTurn(current.turn) : current.turn,
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

function getPreviousPlayer(currentPlayer: PlayerName) {
  const currentIndex = PLAYERS.indexOf(currentPlayer);
  const previousIndex =
    currentIndex <= 0 ? PLAYERS.length - 1 : currentIndex - 1;

  return PLAYERS[previousIndex];
}

function getNextPlayer(currentPlayer: PlayerName) {
  const currentIndex = PLAYERS.indexOf(currentPlayer);
  const nextIndex = currentIndex >= PLAYERS.length - 1 ? 0 : currentIndex + 1;

  return PLAYERS[nextIndex];
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

export default App;
