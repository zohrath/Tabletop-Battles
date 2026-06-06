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

export type ArmyRuleChoice = {
  id: string
  name: string
  description: string
}

export type ArmyRule = {
  id: string
  name: string
  description: string
  choices: ArmyRuleChoice[]
}

export function extractArmyRules(army: ArmyImported): ArmyRule[] {
  const rules = army.roster.forces.flatMap((force) => force.rules ?? [])
  const uniqueRules = new Map<string, ArmyImportedRule>()

  rules.forEach((rule) => uniqueRules.set(rule.id, rule))

  return [...uniqueRules.values()].map((rule) => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    choices: extractRuleChoices(rule),
  }))
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

function extractRuleChoices(rule: ArmyImportedRule): ArmyRuleChoice[] {
  const headings = [...rule.description.matchAll(/\*\*([^*]+)\*\*/g)]
    .map((match) => ({
      index: match.index ?? 0,
      matchText: match[0],
      name: match[1].trim(),
    }))
    .filter(isRuleChoiceHeading)

  if (headings.length < 2) {
    return []
  }

  return headings.map((heading, index) => {
    const descriptionStart = heading.index + heading.matchText.length
    const descriptionEnd = headings[index + 1]?.index ?? rule.description.length

    return {
      id: `${rule.id}:${toSlug(heading.name)}`,
      name: heading.name,
      description: rule.description.slice(descriptionStart, descriptionEnd).trim(),
    }
  })
}

function isRuleChoiceHeading(heading: { name: string }) {
  return (
    !heading.name.includes('^^') &&
    !heading.name.startsWith('[') &&
    !heading.name.endsWith(']') &&
    heading.name.length > 3
  )
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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
  const fallbackProfiles = selection.profiles ?? []
  const models = collectModelSelections(selection)
    .map((model) => ({
      id: model.id,
      name: model.name,
      number: model.number,
      startingNumber: model.number,
      profiles: hasUnitProfile(model.profiles) ? model.profiles ?? [] : fallbackProfiles,
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

function collectModelSelections(selection: ArmyImportedSelection): ArmyImportedSelection[] {
  return (selection.selections ?? []).flatMap((child) => [
    ...(child.type === 'model' ? [child] : []),
    ...collectModelSelections(child),
  ])
}

function hasUnitProfile(profiles: ArmyImportedProfile[] | undefined) {
  return profiles?.some((profile) => profile.typeName === 'Unit') ?? false
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
