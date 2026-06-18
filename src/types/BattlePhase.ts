import type { Phase } from "./Phase";

export const TURN_OWNERS = ["You", "Opponent"] as const;
export const TURNS = [1, 2, 3, 4, 5] as const;

export type TurnOwner = (typeof TURN_OWNERS)[number];
export type Turn = (typeof TURNS)[number];

export const TURN_OWNER_LABELS: Record<TurnOwner, string> = {
  You: "Your",
  Opponent: "Opponent's",
};

export type BattlePhase = {
  phase: Phase;
  owner: TurnOwner;
  turn: Turn;
};
