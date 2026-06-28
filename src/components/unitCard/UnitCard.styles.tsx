import styled from "@emotion/styled";

interface CardProps {
  variant: "default" | "alternate";
}

export const Card = styled.article<CardProps>`
  background-color: ${(props) => (props.variant === "alternate" ? "var(--unit-card-alt-bg)" : "var(--unit-card-bg)")};
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 16px 16px 38px;
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
