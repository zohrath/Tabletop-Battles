import type { ReactNode } from "react";
import { List } from "./UnorderedList.styles";

type UnorderedListProps = {
  ariaLabel?: string;
  children: ReactNode;
};

export function UnorderedList({ ariaLabel, children }: UnorderedListProps) {
  return <List aria-label={ariaLabel}>{children}</List>;
}
