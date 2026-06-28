import type { Dispatch, SetStateAction } from "react";
import type { AppPage } from "../../types/AppPage";

type HamburgerMenuProps = {
  hasActiveArmy: boolean;
  isAdmin: boolean;
  menuOpen: boolean;
  onImportRoster: (file: File | undefined) => void;
  onLogout: () => void;
  onOpenDetachmentEditor: () => void;
  onOpenFirstTurnModal: () => void;
  onNavigate: (page: AppPage) => void;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
};

export function HamburgerMenu({
  hasActiveArmy,
  isAdmin,
  menuOpen,
  onImportRoster,
  onLogout,
  onOpenDetachmentEditor,
  onOpenFirstTurnModal,
  onNavigate,
  setMenuOpen,
}: HamburgerMenuProps) {
  function navigate(page: AppPage) {
    onNavigate(page);
    setMenuOpen(false);
  }

  function closeAndRun(action: () => void) {
    action();
    setMenuOpen(false);
  }

  return (
    <div className="app-menu">
      <button
        aria-controls="app-menu-panel"
        aria-expanded={menuOpen}
        aria-label="Open menu"
        className="menu-button"
        type="button"
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      {menuOpen && (
        <div className="menu-panel" id="app-menu-panel">
          <button className="menu-item" type="button" onClick={() => navigate("armies")}>
            Armies
          </button>
          <button className="menu-item" disabled={!hasActiveArmy} type="button" onClick={() => navigate("battle")}>
            Current Army
          </button>
          <button className="menu-item" disabled={!hasActiveArmy} type="button" onClick={() => navigate("armyRule")}>
            Army Rule
          </button>
          <button className="menu-item" type="button" onClick={() => closeAndRun(onOpenFirstTurnModal)}>
            First Turn
          </button>
          <button className="menu-item" type="button" onClick={() => closeAndRun(onOpenDetachmentEditor)}>
            Detachments
          </button>
          {isAdmin && (
            <button className="menu-item" type="button" onClick={() => navigate("admin")}>
              Admin
            </button>
          )}
          <label className="menu-item">
            <input
              accept="application/json,.json"
              type="file"
              onChange={(event) => {
                onImportRoster(event.target.files?.[0]);
              }}
            />
            Import JSON
          </label>
          <button
            className="menu-item"
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
