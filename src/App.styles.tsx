import styled from "@emotion/styled";

export const PhaseIndicatorButton = styled.button`
  align-items: center;
  background: var(--social-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  bottom: 10svh;
  box-shadow: var(--shadow);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  padding: 0;
  position: fixed;
  right: 0;
  width: 36px;
  z-index: 15;

  span {
    border-block: 6px solid transparent;
    border-left: 0;
    border-right: 8px solid var(--text-h);
    display: block;
    height: 0;
    width: 0;
  }

  &[aria-expanded="true"] span {
    transform: rotate(180deg);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export const PhaseIndicatorPanel = styled.section`
  align-items: center;
  background: var(--bg);
  border-top: 1px solid var(--border);
  bottom: 0;
  box-shadow: var(--shadow);
  box-sizing: border-box;
  color: var(--text-h);
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  left: 0;
  min-height: 96px;
  padding: 18px 64px;
  position: fixed;
  right: 0;
  z-index: 14;

  strong {
    font-size: 12px;
    text-transform: uppercase;
  }

  span {
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
  }
`;

export const PhaseIndicatorActions = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 24px auto minmax(0, 1fr);
  position: relative;
  width: 100%;

  button {
    background: var(--social-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-h);
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    min-height: 32px;
    padding: 6px 10px;
  }

  svg {
    display: block;
    height: 16px;
    width: 16px;
  }

  button[data-action="previous"] {
    grid-column: 2;
  }

  button[data-action="next"] {
    grid-column: 4;
  }

  button[data-action="reset"] {
    align-self: center;
    justify-self: end;
    min-width: 32px;
    padding-inline: 7px;
    position: absolute;
    left: calc(60% + 78px);
  }

  button:hover {
    border-color: var(--accent-border);
  }

  button:disabled {
    color: var(--text);
    cursor: not-allowed;
    opacity: 0.6;
  }

  button[aria-hidden="true"] {
    opacity: 0;
    pointer-events: none;
  }

  button:disabled:hover {
    border-color: var(--border);
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;
