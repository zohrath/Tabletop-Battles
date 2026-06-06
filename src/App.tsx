import { useState } from 'react'
import './App.css'
import { ArmyUnitList } from './components/ArmyUnitList'
import type { ArmyImported } from './types/armyImported'
import { extractArmyUnits, type ArmyUnit } from './utils/armyImported'

const SAVED_ARMIES_STORAGE_KEY = 'tabletop-battles.saved-armies'

type AppPage = 'battle' | 'armies'

type SavedArmy = {
  id: string
  importedAt: string
  name: string
  sourceFileName: string
  units: ArmyUnit[]
}

function App() {
  const [savedArmies, setSavedArmies] = useState<SavedArmy[]>(loadSavedArmies)
  const [activeArmyId, setActiveArmyId] = useState(() => savedArmies[0]?.id ?? '')
  const [page, setPage] = useState<AppPage>('battle')
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const activeArmy =
    savedArmies.find((army) => army.id === activeArmyId) ?? null

  async function handleRosterFile(file: File | undefined) {
    setError('')

    if (!file) {
      return
    }

    try {
      const army = JSON.parse(await file.text()) as ArmyImported
      const savedArmy: SavedArmy = {
        id: createId(),
        importedAt: new Date().toISOString(),
        name: army.roster.name || file.name,
        sourceFileName: file.name,
        units: extractArmyUnits(army),
      }

      updateSavedArmies((currentArmies) => [savedArmy, ...currentArmies])
      setActiveArmyId(savedArmy.id)
      setPage('battle')
      setMenuOpen(false)
    } catch {
      setError('Could not read this roster JSON.')
      setMenuOpen(false)
    }
  }

  function changeModelCount(unitId: string, modelId: string, change: number) {
    if (!activeArmy) {
      return
    }

    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) => {
        if (army.id !== activeArmy.id) {
          return army
        }

        return {
          ...army,
          units: army.units.map((unit) => {
            if (unit.id !== unitId) {
              return unit
            }

            return {
              ...unit,
              models: unit.models.map((model) => {
                if (model.id !== modelId) {
                  return model
                }

                const currentCount = getModelCount(model.number)
                const startingCount = getModelCount(
                  model.startingNumber,
                  currentCount,
                )

                return {
                  ...model,
                  number: clamp(currentCount + change, 0, startingCount),
                }
              }),
            }
          }),
        }
      }),
    )
  }

  function renameArmy(armyId: string, name: string) {
    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) =>
        army.id === armyId ? { ...army, name } : army,
      ),
    )
  }

  function deleteArmy(armyId: string) {
    updateSavedArmies((currentArmies) => {
      const nextArmies = currentArmies.filter((army) => army.id !== armyId)

      if (armyId === activeArmyId) {
        setActiveArmyId(nextArmies[0]?.id ?? '')
      }

      return nextArmies
    })
  }

  function openArmy(armyId: string) {
    setActiveArmyId(armyId)
    setPage('battle')
  }

  function updateSavedArmies(
    getNextArmies: (currentArmies: SavedArmy[]) => SavedArmy[],
  ) {
    setSavedArmies((currentArmies) => {
      const nextArmies = getNextArmies(currentArmies)
      localStorage.setItem(SAVED_ARMIES_STORAGE_KEY, JSON.stringify(nextArmies))
      return nextArmies
    })
  }

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <h1>{page === 'armies' ? 'Armies' : activeArmy?.name || 'Army Units'}</h1>
          <p>
            {page === 'armies'
              ? `${savedArmies.length} saved armies`
              : activeArmy?.sourceFileName ||
                'Choose a NewRecruit or BattleScribe roster JSON.'}
          </p>
        </div>

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
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  setPage('armies')
                  setMenuOpen(false)
                }}
              >
                Armies
              </button>
              <button
                className="menu-item"
                disabled={!activeArmy}
                type="button"
                onClick={() => {
                  setPage('battle')
                  setMenuOpen(false)
                }}
              >
                Current Army
              </button>
              <label className="menu-item">
                <input
                  accept="application/json,.json"
                  type="file"
                  onChange={(event) =>
                    void handleRosterFile(event.target.files?.[0])
                  }
                />
                Import JSON
              </label>
            </div>
          )}
        </div>
      </section>

      {error && <p className="error-message">{error}</p>}

      {page === 'armies' ? (
        <ArmyManager
          activeArmyId={activeArmyId}
          armies={savedArmies}
          onDeleteArmy={deleteArmy}
          onOpenArmy={openArmy}
          onRenameArmy={renameArmy}
        />
      ) : (
        <ArmyUnitList
          onModelCountChange={changeModelCount}
          units={activeArmy?.units ?? []}
        />
      )}
    </main>
  )
}

type ArmyManagerProps = {
  activeArmyId: string
  armies: SavedArmy[]
  onDeleteArmy: (armyId: string) => void
  onOpenArmy: (armyId: string) => void
  onRenameArmy: (armyId: string, name: string) => void
}

function ArmyManager({
  activeArmyId,
  armies,
  onDeleteArmy,
  onOpenArmy,
  onRenameArmy,
}: ArmyManagerProps) {
  if (armies.length === 0) {
    return <p className="empty-state">No saved armies yet.</p>
  }

  return (
    <section className="army-manager" aria-label="Saved armies">
      {armies.map((army) => (
        <article className="army-manager-card" key={army.id}>
          <div className="army-manager-card__body">
            <label>
              <span>Army name</span>
              <input
                value={army.name}
                onChange={(event) => onRenameArmy(army.id, event.target.value)}
              />
            </label>
            <p>
              {army.units.length} units / imported{' '}
              {new Date(army.importedAt).toLocaleDateString()}
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
  )
}

function loadSavedArmies(): SavedArmy[] {
  try {
    const savedArmies = localStorage.getItem(SAVED_ARMIES_STORAGE_KEY)
    return savedArmies ? (JSON.parse(savedArmies) as SavedArmy[]) : []
  } catch {
    return []
  }
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getModelCount(value: number | undefined, fallback: number = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export default App
