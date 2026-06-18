import styled from "@emotion/styled";

export const Backdrop = styled.div`
  align-items: center;
  background: rgba(0, 0, 0, 0.48);
  box-sizing: border-box;
  display: flex;
  inset: 0;
  justify-content: center;
  max-width: 100vw;
  padding: 20px;
  position: fixed;
  width: 100vw;
  z-index: 20;

  @media (max-width: 720px) {
    padding: 12px;
  }
`;

export const Surface = styled.section<{ maxWidth: number }>`
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow);
  box-sizing: border-box;
  max-height: min(720px, calc(100svh - 40px));
  max-width: ${({ maxWidth }) => `${maxWidth}px`};
  overflow: auto;
  padding: 20px;
  width: 100%;

  @media (max-width: 720px) {
    max-height: calc(100svh - 24px);
    padding: 14px;
  }
`;

export const Header = styled.header`
  align-items: start;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding-bottom: 16px;

  h2 {
    margin-bottom: 4px;
  }
`;

export const CloseButton = styled.button`
  align-items: center;
  background: var(--social-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-h);
  cursor: pointer;
  display: inline-flex;
  font: 700 18px/1 var(--mono);
  height: 36px;
  justify-content: center;
  padding: 0;
  width: 36px;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;
