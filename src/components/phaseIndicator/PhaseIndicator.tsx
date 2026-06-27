import { TURN_OWNER_LABELS, type BattlePhase } from "../../types/BattlePhase";
import {
  PhaseIndicatorActions,
  PhaseIndicatorPanel,
} from "./PhaseIndicator.styles";

type PhaseIndicatorProps = {
  battlePhase: BattlePhase;
  canGoNext: boolean;
  canGoPrevious: boolean;
  canReset: boolean;
  onNextPhase: () => void;
  onPreviousPhase: () => void;
  onReset: () => void;
};

export function PhaseIndicator({
  battlePhase,
  canGoNext,
  canGoPrevious,
  canReset,
  onNextPhase,
  onPreviousPhase,
  onReset,
}: PhaseIndicatorProps) {
  return (
    <PhaseIndicatorPanel aria-label="Phase indicator" id="phase-indicator-panel">
      <div>
        <span>
          Turn {battlePhase.turn} - {TURN_OWNER_LABELS[battlePhase.owner]}{" "}
          {battlePhase.phase}
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
  );
}
