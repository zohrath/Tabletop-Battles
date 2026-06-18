import type { ReactNode } from "react";
import { Backdrop, CloseButton, Header, Surface } from "./Modal.styles";

type ModalProps = {
  ariaLabelledBy: string;
  children: ReactNode;
  closeAriaLabel?: string;
  header?: ReactNode;
  maxWidth?: number;
  onClose: () => void;
};

export function Modal({
  ariaLabelledBy,
  children,
  closeAriaLabel = "Close modal",
  header,
  maxWidth = 640,
  onClose,
}: ModalProps) {
  return (
    <Backdrop
      aria-labelledby={ariaLabelledBy}
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <Surface maxWidth={maxWidth} onClick={(event) => event.stopPropagation()}>
        {header && (
          <Header>
            {header}
            <CloseButton
              aria-label={closeAriaLabel}
              type="button"
              onClick={onClose}
            >
              x
            </CloseButton>
          </Header>
        )}
        {children}
      </Surface>
    </Backdrop>
  );
}
