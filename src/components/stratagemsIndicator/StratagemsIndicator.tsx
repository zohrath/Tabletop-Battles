import { useState, type CSSProperties } from "react";
import hereseyUndone from "../../assets/hereseyUndone.png";
import type { Stratagem } from "../../types/Stratagem";
import { Header } from "../header/Header";
import { Modal } from "../modal/Modal";
import {
  StratagemButton,
  StratagemDescription,
  StratagemsIndicatorPanel,
} from "./StratagemsIndicator.styles";

type StratagemsIndicatorProps = {
  side?: "left" | "right";
  stratagems: Stratagem[];
};

type StratagemsIndicatorStyle = CSSProperties & {
  "--stratagem-icon-size": string;
};

export function StratagemsIndicator({
  side = "left",
  stratagems,
}: StratagemsIndicatorProps) {
  const [selectedStratagem, setSelectedStratagem] =
    useState<Stratagem | null>(null);

  if (stratagems.length === 0) {
    return null;
  }

  const iconSize = `min(72px, calc(100svh / ${stratagems.length}))`;

  return (
    <>
      <StratagemsIndicatorPanel
        aria-label="Stratagems indicator"
        data-side={side}
        style={
          { "--stratagem-icon-size": iconSize } as StratagemsIndicatorStyle
        }
      >
        {stratagems.map((stratagem) => (
          <StratagemButton
            key={stratagem.id}
            aria-label={`Show ${stratagem.name}`}
            type="button"
            onClick={() => setSelectedStratagem(stratagem)}
          >
            <img alt="" src={stratagem.imageSrc ?? hereseyUndone} />
          </StratagemButton>
        ))}
      </StratagemsIndicatorPanel>

      {selectedStratagem && (
        <Modal
          ariaLabelledBy="stratagem-modal-title"
          closeAriaLabel="Close stratagem details"
          header={
            <Header
              title={selectedStratagem.name}
              titleId="stratagem-modal-title"
              subtitle={`${selectedStratagem.cpCost} CP`}
            />
          }
          maxWidth={560}
          onClose={() => setSelectedStratagem(null)}
        >
          <StratagemDescription>
            {selectedStratagem.description}
          </StratagemDescription>
        </Modal>
      )}
    </>
  );
}
