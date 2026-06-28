import type { Dispatch, SetStateAction } from "react";
import { HamburgerMenu } from "../hamburgerMenu/HamburgerMenu";
import type { AppPage } from "../../types/AppPage";

type ToolbarProps = {
  activeArmyName?: string;
  activeArmySourceFileName?: string;
  armyCount: number;
  hasActiveArmy: boolean;
  isAdmin: boolean;
  menuOpen: boolean;
  selectedArmyRuleChoiceName?: string;
  username?: string;
  page: AppPage;
  onImportRoster: (file: File | undefined) => void;
  onLogout: () => void;
  onNavigate: (page: AppPage) => void;
  onOpenDetachmentEditor: () => void;
  onOpenFirstTurnModal: () => void;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
};

export function Toolbar({
  activeArmyName,
  activeArmySourceFileName,
  armyCount,
  hasActiveArmy,
  isAdmin,
  menuOpen,
  selectedArmyRuleChoiceName,
  username,
  page,
  onImportRoster,
  onLogout,
  onNavigate,
  onOpenDetachmentEditor,
  onOpenFirstTurnModal,
  setMenuOpen,
}: ToolbarProps) {
  const title = page === "armies" ? "Armies" : page === "admin" ? "Admin" : activeArmyName || "Army Units";
  const subtitle =
    page === "armies"
      ? `${armyCount} saved armies`
      : page === "admin"
        ? `Logged in as ${username}`
        : page === "armyRule"
          ? selectedArmyRuleChoiceName || "Choose an army rule"
          : activeArmySourceFileName || "Choose a NewRecruit or BattleScribe roster JSON.";

  return (
    <section className="toolbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <HamburgerMenu
        hasActiveArmy={hasActiveArmy}
        isAdmin={isAdmin}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onImportRoster={onImportRoster}
        onLogout={onLogout}
        onNavigate={onNavigate}
        onOpenDetachmentEditor={onOpenDetachmentEditor}
        onOpenFirstTurnModal={onOpenFirstTurnModal}
      />
    </section>
  );
}
