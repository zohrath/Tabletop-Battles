import styled from "@emotion/styled";

export const KeywordDescription = styled.p`
  color: var(--text-h);
  margin-top: 16px;
  white-space: pre-wrap;
`;

export const WeaponDetailCard = styled.div`
  border: 1px solid var(--border);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  margin-top: 16px;
  padding: 10px;
`;

export const WeaponTitle = styled.div`
  align-items: baseline;
  color: var(--text-h);
  display: flex;
  font-size: 14px;
  gap: 8px;
  justify-content: space-between;
  min-width: 0;
`;

export const WeaponName = styled.span`
  font-weight: 700;
  overflow-wrap: anywhere;
`;

export const WeaponCount = styled.strong`
  font-family: var(--mono);
  font-size: 12px;
  white-space: nowrap;
`;
