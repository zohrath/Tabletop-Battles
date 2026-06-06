import type {
  ArmyImported,
  ArmyImportedCategory,
  ArmyImportedCost,
  ArmyImportedProfile,
  ArmyImportedRule,
  ArmyImportedSelection,
} from '../types/armyImported'

export type ArmyUnit = {
  id: string
  name: string
  number: number
  points?: number
  categories: ArmyImportedCategory[]
  profiles: ArmyImportedProfile[]
  models: ArmyUnitModel[]
}

export type ArmyUnitModel = {
  id: string
  name: string
  number: number
  startingNumber: number
  profiles: ArmyImportedProfile[]
  weapons: ArmyUnitWeapon[]
}

export type ArmyUnitWeapon = {
  id: string
  name: string
  number: number
  characteristics: ArmyImportedProfile['characteristics']
  rules: ArmyImportedRule[]
  typeName: 'Melee Weapons' | 'Ranged Weapons'
}

export function extractArmyUnits(army: ArmyImported): ArmyUnit[] {
  return army.roster.forces.flatMap((force) =>
    force.selections
      .filter(isRosterUnitSelection)
      .map((selection) => ({
        id: selection.id,
        name: selection.name,
        number: selection.number,
        points: getPoints(selection.costs),
        categories: selection.categories ?? [],
        profiles: selection.profiles ?? [],
        models: extractUnitModels(selection),
      })),
  )
}

function isRosterUnitSelection(selection: ArmyImportedSelection) {
  return (
    (selection.type === 'unit' || selection.type === 'model') &&
    Boolean(selection.costs?.length || selection.profiles?.length) &&
    !isConfiguration(selection)
  )
}

function isConfiguration(selection: ArmyImportedSelection) {
  return selection.categories?.some((category) => category.name === 'Configuration')
}

function extractUnitModels(selection: ArmyImportedSelection): ArmyUnitModel[] {
  const models = (selection.selections ?? [])
    .filter((child) => child.type === 'model')
    .map((model) => ({
      id: model.id,
      name: model.name,
      number: model.number,
      startingNumber: model.number,
      profiles: model.profiles ?? [],
      weapons: extractModelWeapons(model),
    }))

  if (models.length > 0) {
    return models
  }

  return [
    {
      id: selection.id,
      name: selection.name,
      number: selection.number,
      startingNumber: selection.number,
      profiles: selection.profiles ?? [],
      weapons: extractModelWeapons(selection),
    },
  ]
}

function extractModelWeapons(selection: ArmyImportedSelection): ArmyUnitWeapon[] {
  return (selection.selections ?? []).flatMap((child) => {
    const weapons =
      child.profiles
        ?.filter(isWeaponProfile)
        .map((profile) => ({
          id: profile.id,
          name: profile.name,
          number: child.number,
          characteristics: profile.characteristics,
          rules: child.rules ?? [],
          typeName: profile.typeName,
        })) ?? []

    return [...weapons, ...extractModelWeapons(child)]
  })
}

function isWeaponProfile(
  profile: ArmyImportedProfile,
): profile is ArmyImportedProfile & {
  typeName: 'Melee Weapons' | 'Ranged Weapons'
} {
  return profile.typeName === 'Melee Weapons' || profile.typeName === 'Ranged Weapons'
}

function getPoints(costs: ArmyImportedCost[] = []) {
  return costs.find((cost) => cost.name === 'pts')?.value
}
