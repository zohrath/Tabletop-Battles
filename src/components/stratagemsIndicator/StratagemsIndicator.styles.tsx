import styled from "@emotion/styled";

export const StratagemsToggleButton = styled.button`
  align-items: center;
  background: var(--social-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  bottom: 112px;
  box-shadow: var(--shadow);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  padding: 0;
  position: fixed;
  right: max(0px, calc((100vw - var(--app-max-width)) / 2));
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

export const StratagemsIndicatorPanel = styled.section`
  @keyframes stratagems-indicator-enter-left {
    0% {
      opacity: 0;
      transform: translateX(-100%);
    }

    72% {
      opacity: 1;
      transform: translateX(8px);
    }

    88% {
      transform: translateX(-3px);
    }

    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes stratagems-indicator-enter-right {
    0% {
      opacity: 0;
      transform: translateX(100%);
    }

    72% {
      opacity: 1;
      transform: translateX(-8px);
    }

    88% {
      transform: translateX(3px);
    }

    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  align-items: center;
  animation: stratagems-indicator-enter-left 420ms
    cubic-bezier(0.22, 1, 0.36, 1);
  background: transparent;
  box-sizing: border-box;
  display: grid;
  grid-auto-rows: var(--stratagem-icon-size);
  gap: 2vh;
  justify-content: center;
  left: max(0px, calc((100vw - var(--app-max-width)) / 2));
  padding: 0;
  position: fixed;
  bottom: 20vh;
  width: var(--stratagem-icon-size);
  z-index: 12;

  &[data-side="right"] {
    animation-name: stratagems-indicator-enter-right;
    left: auto;
    right: max(0px, calc((100vw - var(--app-max-width)) / 2));
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StratagemButton = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  box-shadow:
    0 0 10px rgba(34, 211, 238, 0.55),
    0 0 22px rgba(34, 211, 238, 0.28);
  cursor: pointer;
  height: var(--stratagem-icon-size);
  padding: 0;
  transition:
    box-shadow 160ms ease,
    transform 160ms ease;
  width: var(--stratagem-icon-size);

  img {
    display: block;
    height: var(--stratagem-icon-size);
    object-fit: contain;
    width: var(--stratagem-icon-size);
  }

  &:hover {
    box-shadow:
      0 0 14px rgba(34, 211, 238, 0.72),
      0 0 30px rgba(34, 211, 238, 0.4);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    box-shadow:
      0 0 14px rgba(34, 211, 238, 0.72),
      0 0 30px rgba(34, 211, 238, 0.4);
  }
`;

export const StratagemDescription = styled.p`
  color: var(--text-h);
  line-height: 1.45;
  margin: 16px 0 0;
  white-space: pre-wrap;
`;
