import styled from "@emotion/styled";

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
  left: 0;
  padding: 0;
  position: fixed;
  bottom: 15svh;
  width: var(--stratagem-icon-size);
  z-index: 12;

  &[data-side="right"] {
    animation-name: stratagems-indicator-enter-right;
    left: auto;
    right: 0;
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
