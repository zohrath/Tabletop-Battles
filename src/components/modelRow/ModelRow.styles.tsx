import styled from "@emotion/styled";

export const Row = styled.li`
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  display: grid;
  gap: 16px;
  grid-template-columns: 52px 1fr;
  padding: 12px;
`;

export const Stepper = styled.div`
  align-items: center;
  display: grid;
  gap: 6px;
  justify-items: center;
`;

export const StepperButton = styled.button`
  align-items: center;
  background: var(--social-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-h);
  cursor: pointer;
  display: inline-flex;
  font: 700 18px/1 var(--mono);
  height: 32px;
  justify-content: center;
  padding: 0;
  width: 32px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export const ModelIcon = styled.div`
  align-items: center;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 999px;
  color: var(--text-h);
  display: inline-flex;
  flex-direction: column;
  font: 700 14px/1 var(--mono);
  height: 44px;
  justify-content: center;
  width: 44px;
`;

export const Content = styled.div`
  display: grid;
  gap: 10px;
  min-width: 0;
`;
