import styled from "@emotion/styled";

export const Card = styled.article`
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  position: relative;

  &:hover {
    border-color: var(--accent-border);
  }
`;

export const CardHeader = styled.div`
  align-items: start;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: grid;
  gap: 10px;
  padding: 0;
  text-align: left;
  width: 100%;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 6px;
  }

  > div {
    min-width: 0;
    width: 100%;
  }
`;

export const CardTitle = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
