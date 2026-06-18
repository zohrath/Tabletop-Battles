import { useEffect, useState } from "react";
import {
  TURN_OWNER_LABELS,
  type BattlePhase,
} from "../../types/BattlePhase";
import {
  PhaseIndicatorActions,
  PhaseIndicatorButton,
  PhaseIndicatorPanel,
} from "./PhaseIndicator.styles";

const EXIT_ANIMATION_MS = 260;

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

export function PhaseIndicator({
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
  const [shouldRenderPanel, setShouldRenderPanel] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRenderPanel(true);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShouldRenderPanel(false);
      return;
    }

    const closeTimer = window.setTimeout(() => {
      setShouldRenderPanel(false);
    }, EXIT_ANIMATION_MS);

    return () => window.clearTimeout(closeTimer);
  }, [isOpen]);

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

      {shouldRenderPanel && (
        <PhaseIndicatorPanel
          aria-label="Phase indicator"
          data-state={isOpen ? "open" : "closed"}
          id="phase-indicator-panel"
        >
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
      )}
    </>
  );
}
