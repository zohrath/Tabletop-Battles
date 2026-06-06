export type ArmyImported = {
  roster: ArmyImportedRoster
}

export type ArmyImportedRoster = {
  costs: ArmyImportedCost[]
  costLimits: ArmyImportedCost[]
  forces: ArmyImportedForce[]
  id: string
  name: string
  battleScribeVersion: number
  generatedBy: string
  gameSystemId: string
  gameSystemName: string
  gameSystemRevision: number
  xmlns: string
}

export type ArmyImportedForce = {
  rules?: ArmyImportedRule[]
  selections: ArmyImportedSelection[]
  categories: ArmyImportedCategory[]
  id: string
  name: string
  entryId: string
  catalogueId: string
  catalogueRevision: number
  catalogueName: string
}

export type ArmyImportedSelection = {
  categories?: ArmyImportedCategory[]
  costs?: ArmyImportedCost[]
  profiles?: ArmyImportedProfile[]
  rules?: ArmyImportedRule[]
  selections?: ArmyImportedSelection[]
  id: string
  name: string
  entryId: string
  entryGroupId?: string
  number: number
  type: ArmyImportedSelectionType
  from: ArmyImportedSelectionSource
  group?: string
}

export type ArmyImportedCategory = {
  id: string
  name: string
  entryId: string
  primary: boolean
}

export type ArmyImportedCost = {
  name: string
  typeId: string
  value: number
}

export type ArmyImportedRule = {
  description: string
  id: string
  name: string
  hidden: boolean
  page?: number
}

export type ArmyImportedProfile = {
  characteristics: ArmyImportedCharacteristic[]
  id: string
  name: string
  hidden: boolean
  typeId: string
  typeName: ArmyImportedProfileTypeName | string
  from: ArmyImportedSelectionSource
}

export type ArmyImportedCharacteristic = {
  '$text': string
  name: string
  typeId: string
}

export type ArmyImportedSelectionType = 'model' | 'unit' | 'upgrade'

export type ArmyImportedSelectionSource = 'entry' | 'group'

export type ArmyImportedProfileTypeName =
  | 'Abilities'
  | 'Melee Weapons'
  | 'Ranged Weapons'
  | 'Unit'
