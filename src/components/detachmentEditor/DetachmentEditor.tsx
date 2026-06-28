import { useState } from "react";
import type { DetachmentPack, DetachmentStratagem, SavedArmy } from "../../types/AppData";
import { Phase } from "../../types/Phase";
import type { StratagemTiming } from "../../types/Stratagem";
import { STRATAGEM_ICON_OPTIONS } from "./detachmentData";

const PHASES = Object.values(Phase) as Phase[];

type DetachmentEditorProps = {
  activeArmy: SavedArmy | null;
  detachmentPacks: DetachmentPack[];
  onCancel: () => void;
  onSave: (detachmentPacks: DetachmentPack[], selectedDetachmentId: string, deletedDetachmentIds: string[]) => void;
};

export function DetachmentEditor({ activeArmy, detachmentPacks, onCancel, onSave }: DetachmentEditorProps) {
  const [detachmentSelectorOpen, setDetachmentSelectorOpen] = useState(false);
  const [draftDetachments, setDraftDetachments] = useState(() => detachmentPacks.map(cloneDetachmentPack));
  const [draftSelectedDetachmentId, setDraftSelectedDetachmentId] = useState(
    () => activeArmy?.selectedDetachmentId ?? "",
  );
  const [deletedDetachmentIds, setDeletedDetachmentIds] = useState<string[]>([]);
  const selectedDraftDetachment =
    draftDetachments.find((detachment) => detachment.id === draftSelectedDetachmentId) ?? null;

  function createDraftDetachment() {
    const id = createId();
    setDraftDetachments((currentDetachments) => [
      ...currentDetachments,
      {
        id,
        name: "New Detachment",
        detachmentRule: "",
        enhancements: "",
        stratagems: [],
      },
    ]);
    setDraftSelectedDetachmentId(id);
  }

  function updateDraftDetachment(nextDetachment: DetachmentPack) {
    setDraftDetachments((currentDetachments) =>
      currentDetachments.map((detachment) => (detachment.id === nextDetachment.id ? nextDetachment : detachment)),
    );
  }

  function deleteDraftDetachment(detachmentId: string) {
    setDraftDetachments((currentDetachments) =>
      currentDetachments.filter((detachment) => detachment.id !== detachmentId),
    );
    setDeletedDetachmentIds((currentIds) =>
      currentIds.includes(detachmentId) ? currentIds : [...currentIds, detachmentId],
    );

    if (draftSelectedDetachmentId === detachmentId) {
      setDraftSelectedDetachmentId("");
    }
  }

  return (
    <section className="detachment-editor">
      <div className="detachment-selector">
        <span>Current army detachment</span>
        <button
          aria-expanded={detachmentSelectorOpen}
          className="detachment-selector-current"
          disabled={!activeArmy}
          type="button"
          onClick={() => setDetachmentSelectorOpen((isOpen) => !isOpen)}
        >
          {getDraftSelectedDetachmentName(draftSelectedDetachmentId, draftDetachments)}
        </button>
        {detachmentSelectorOpen && (
          <div aria-label="Current army detachment options" className="detachment-option-list" role="listbox">
            <button
              aria-selected={!activeArmy?.selectedDetachmentId}
              disabled={!activeArmy}
              role="option"
              type="button"
              onClick={() => {
                setDraftSelectedDetachmentId("");
                setDetachmentSelectorOpen(false);
              }}
            >
              None selected
            </button>
            {draftDetachments.map((detachment) => (
              <button
                aria-selected={draftSelectedDetachmentId === detachment.id}
                disabled={!activeArmy}
                key={detachment.id}
                role="option"
                type="button"
                onClick={() => {
                  setDraftSelectedDetachmentId(detachment.id);
                  setDetachmentSelectorOpen(false);
                }}
              >
                {detachment.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={createDraftDetachment}>
        Add Detachment
      </button>

      {selectedDraftDetachment ? (
        <div className="detachment-list">
          <DetachmentEditorCard
            detachment={selectedDraftDetachment}
            key={selectedDraftDetachment.id}
            onDeleteDetachment={deleteDraftDetachment}
            onUpdateDetachment={updateDraftDetachment}
          />
        </div>
      ) : (
        <p className="empty-state">No detachment selected.</p>
      )}

      <div className="detachment-editor-footer">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave(draftDetachments.map(cloneDetachmentPack), draftSelectedDetachmentId, deletedDetachmentIds)
          }
        >
          Save
        </button>
      </div>
    </section>
  );
}

export function DetachmentDetail({ detachment }: { detachment: DetachmentPack }) {
  return (
    <div className="detachment-detail">
      <section>
        <h3>Detachment Rule</h3>
        <p>{detachment.detachmentRule || "No detachment rule saved."}</p>
      </section>
      <section>
        <h3>Enhancements</h3>
        <p>{detachment.enhancements || "No enhancements saved."}</p>
      </section>
      <section>
        <h3>Stratagems</h3>
        {detachment.stratagems.length > 0 ? (
          <ul>
            {detachment.stratagems.map((stratagem) => (
              <li key={stratagem.id}>
                <strong>{stratagem.name}</strong>
                <span>{stratagem.cpCost} CP</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No stratagems saved.</p>
        )}
      </section>
    </div>
  );
}

type DetachmentEditorCardProps = {
  detachment: DetachmentPack;
  onDeleteDetachment: (detachmentId: string) => void;
  onUpdateDetachment: (detachment: DetachmentPack) => void;
};

function DetachmentEditorCard({ detachment, onDeleteDetachment, onUpdateDetachment }: DetachmentEditorCardProps) {
  return (
    <article className="detachment-card">
      <label>
        <span>Name</span>
        <input
          value={detachment.name}
          onChange={(event) => onUpdateDetachment({ ...detachment, name: event.target.value })}
        />
      </label>
      <label>
        <span>Detachment Rule</span>
        <textarea
          value={detachment.detachmentRule}
          onChange={(event) =>
            onUpdateDetachment({
              ...detachment,
              detachmentRule: event.target.value,
            })
          }
        />
      </label>
      <label>
        <span>Enhancements</span>
        <textarea
          value={detachment.enhancements}
          onChange={(event) =>
            onUpdateDetachment({
              ...detachment,
              enhancements: event.target.value,
            })
          }
        />
      </label>

      <div className="stratagem-editor-heading">
        <h3>Stratagems</h3>
        <button
          type="button"
          onClick={() =>
            onUpdateDetachment({
              ...detachment,
              stratagems: [
                ...detachment.stratagems,
                {
                  id: createId(),
                  name: "New Stratagem",
                  cpCost: 1,
                  description: "",
                  imageKey: STRATAGEM_ICON_OPTIONS[0]?.key,
                  phases: "Any",
                  timing: "both",
                },
              ],
            })
          }
        >
          Add Stratagem
        </button>
      </div>

      <div className="stratagem-editor-list">
        {detachment.stratagems.map((stratagem) => (
          <StratagemEditorCard
            key={stratagem.id}
            stratagem={stratagem}
            onDelete={() =>
              onUpdateDetachment({
                ...detachment,
                stratagems: detachment.stratagems.filter((currentStratagem) => currentStratagem.id !== stratagem.id),
              })
            }
            onUpdate={(nextStratagem) =>
              onUpdateDetachment({
                ...detachment,
                stratagems: detachment.stratagems.map((currentStratagem) =>
                  currentStratagem.id === nextStratagem.id ? nextStratagem : currentStratagem,
                ),
              })
            }
          />
        ))}
      </div>

      <button className="danger-button" type="button" onClick={() => onDeleteDetachment(detachment.id)}>
        Delete Detachment
      </button>
    </article>
  );
}

type StratagemEditorCardProps = {
  stratagem: DetachmentStratagem;
  onDelete: () => void;
  onUpdate: (stratagem: DetachmentStratagem) => void;
};

function StratagemEditorCard({ stratagem, onDelete, onUpdate }: StratagemEditorCardProps) {
  const selectedPhases = stratagem.phases === "Any" ? [] : stratagem.phases;
  const selectedIcon = STRATAGEM_ICON_OPTIONS.find((icon) => icon.key === stratagem.imageKey);

  return (
    <article className="stratagem-editor-card">
      <div className="stratagem-editor-grid">
        <label>
          <span>Name</span>
          <input value={stratagem.name} onChange={(event) => onUpdate({ ...stratagem, name: event.target.value })} />
        </label>
        <label>
          <span>CP</span>
          <input
            min={0}
            type="number"
            value={stratagem.cpCost}
            onChange={(event) =>
              onUpdate({
                ...stratagem,
                cpCost: Number(event.target.value) || 0,
              })
            }
          />
        </label>
        <label>
          <span>Timing</span>
          <select
            value={stratagem.timing}
            onChange={(event) =>
              onUpdate({
                ...stratagem,
                timing: event.target.value as StratagemTiming,
              })
            }
          >
            <option value="both">Both turns</option>
            <option value="own-turn">Your turn</option>
            <option value="opponent-turn">Opponent turn</option>
          </select>
        </label>
      </div>

      <fieldset className="stratagem-icon-picker">
        <legend>Icon</legend>
        {selectedIcon && <img alt="" className="stratagem-icon-preview" src={selectedIcon.src} />}
        <label>
          <span>Image</span>
          <select
            value={stratagem.imageKey ?? ""}
            onChange={(event) =>
              onUpdate({
                ...stratagem,
                imageKey: event.target.value || undefined,
              })
            }
          >
            <option value="">Default icon</option>
            {STRATAGEM_ICON_OPTIONS.map((icon) => (
              <option key={icon.key} value={icon.key}>
                {icon.name}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="phase-picker">
        <legend>Phases</legend>
        <label>
          <input
            checked={stratagem.phases === "Any"}
            type="checkbox"
            onChange={(event) =>
              onUpdate({
                ...stratagem,
                phases: event.target.checked ? "Any" : [Phase.Command],
              })
            }
          />
          Any
        </label>
        {PHASES.map((phase) => (
          <label key={phase}>
            <input
              checked={stratagem.phases !== "Any" && selectedPhases.includes(phase)}
              disabled={stratagem.phases === "Any"}
              type="checkbox"
              onChange={(event) => {
                const nextPhases = event.target.checked
                  ? [...selectedPhases, phase]
                  : selectedPhases.filter((selectedPhase) => selectedPhase !== phase);

                onUpdate({
                  ...stratagem,
                  phases: nextPhases.length > 0 ? nextPhases : [Phase.Command],
                });
              }}
            />
            {phase.replace(" Phase", "")}
          </label>
        ))}
      </fieldset>

      <label>
        <span>Stratagem Text</span>
        <textarea
          value={stratagem.description}
          onChange={(event) => onUpdate({ ...stratagem, description: event.target.value })}
        />
      </label>
      <button type="button" onClick={onDelete}>
        Delete Stratagem
      </button>
    </article>
  );
}

function getDraftSelectedDetachmentName(selectedDetachmentId: string, detachmentPacks: DetachmentPack[]) {
  if (!selectedDetachmentId) {
    return "None selected";
  }

  return detachmentPacks.find((detachment) => detachment.id === selectedDetachmentId)?.name ?? "None selected";
}

function cloneDetachmentPack(detachment: DetachmentPack): DetachmentPack {
  return {
    ...detachment,
    stratagems: detachment.stratagems.map((stratagem) => ({ ...stratagem })),
  };
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
