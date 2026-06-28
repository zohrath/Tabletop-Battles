import type { SavedArmy } from "../types/AppData";

type ArmiesPageProps = {
  activeArmyId: string;
  armies: SavedArmy[];
  onDeleteArmy: (armyId: string) => void;
  onOpenArmy: (armyId: string) => void;
  onRenameArmy: (armyId: string, name: string) => void;
};

export function ArmiesPage({ activeArmyId, armies, onDeleteArmy, onOpenArmy, onRenameArmy }: ArmiesPageProps) {
  if (armies.length === 0) {
    return <p className="empty-state">No saved armies yet.</p>;
  }

  return (
    <section className="army-manager" aria-label="Saved armies">
      {armies.map((army) => (
        <article className="army-manager-card" key={army.id}>
          <div className="army-manager-card__body">
            <label>
              <span>Army name</span>
              <input value={army.name} onChange={(event) => onRenameArmy(army.id, event.target.value)} />
            </label>
            <p>
              {army.units.length} units / imported {new Date(army.importedAt).toLocaleDateString()}
            </p>
            {army.id === activeArmyId && <strong>Current army</strong>}
          </div>

          <div className="army-manager-card__actions">
            <button type="button" onClick={() => onOpenArmy(army.id)}>
              Open
            </button>
            <button type="button" onClick={() => onDeleteArmy(army.id)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
