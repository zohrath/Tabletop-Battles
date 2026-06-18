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
`;
