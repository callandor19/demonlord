import {capitalize} from '../utils/utils'

/* -------------------------------------------- */
/*  Class Models                                */

/* -------------------------------------------- */

export class PathLevel {
  constructor(obj) {
    if (obj === undefined) obj = {}
    if (typeof obj === 'string') obj = JSON.parse(obj)

    const locAtt = s => game.i18n.localize('DL.Attribute' + capitalize(s))

    this.level = obj.level || 0
    this.attributeSelect = obj.attributeSelect || ''
    this.attributeSelectIsChooseTwo = obj.attributeSelectIsChooseTwo || obj.attributeSelect === 'choosetwo' || false
    this.attributeSelectIsChooseThree =
      obj.attributeSelectIsChooseThree || obj.attributeSelect === 'choosethree' || false
    this.attributeSelectIsFixed = obj.attributeSelectIsFixed || obj.attributeSelect === 'fixed' || false
    this.attributeSelectIsTwoSet = obj.attributeSelectIsTwoSet || obj.attributeSelect === 'twosets' || false

    this.attributeSelectTwoSet1 = obj.attributeSelectTwoSet1 || ''
    this.attributeSelectTwoSet2 = obj.attributeSelectTwoSet2 || ''
    this.attributeSelectTwoSet3 = obj.attributeSelectTwoSet3 || ''
    this.attributeSelectTwoSet4 = obj.attributeSelectTwoSet4 || ''

    this.attributeSelectTwoSet1Label = obj.attributeSelectTwoSet1Label || locAtt(this.attributeSelectTwoSet1) || ''
    this.attributeSelectTwoSet2Label = obj.attributeSelectTwoSet2Label || locAtt(this.attributeSelectTwoSet2) || ''
    this.attributeSelectTwoSet3Label = obj.attributeSelectTwoSet3Label || locAtt(this.attributeSelectTwoSet3) || ''
    this.attributeSelectTwoSet4Label = obj.attributeSelectTwoSet4Label || locAtt(this.attributeSelectTwoSet4) || ''

    this.attributeSelectTwoSetValue1 = +obj.attributeSelectTwoSetValue1 || 0
    this.attributeSelectTwoSetValue2 = +obj.attributeSelectTwoSetValue2 || 0
    this.attributeSelectTwoSetSelectedValue1 = +obj.attributeSelectTwoSetSelectedValue1 || true
    this.attributeSelectTwoSetSelectedValue2 = +obj.attributeSelectTwoSetSelectedValue2 || true

    this.attributeStrength = +obj.attributeStrength || 0
    this.attributeAgility = +obj.attributeAgility || 0
    this.attributeIntellect = +obj.attributeIntellect || 0
    this.attributeWill = +obj.attributeWill || 0
    this.attributeStrengthSelected = +obj.attributeStrengthSelected || false
    this.attributeAgilitySelected = +obj.attributeAgilitySelected || false
    this.attributeIntellectSelected = +obj.attributeIntellectSelected || false
    this.attributeWillSelected = +obj.attributeWillSelected || false

    this.characteristicsPerception = +obj.characteristicsPerception || 0
    this.characteristicsDefense = +obj.characteristicsDefense || 0
    this.characteristicsPower = +obj.characteristicsPower || 0
    this.characteristicsSpeed = +obj.characteristicsSpeed || 0
    this.characteristicsHealth = +obj.characteristicsHealth || 0
    this.characteristicsCorruption = +obj.characteristicsCorruption || 0
    this.characteristicsInsanity = +obj.characteristicsInsanity || 0

    this.languagesText = obj.languagesText || ''
    this.equipmentText = obj.equipmentText || ''
    this.magicText = obj.magicText || ''

    this.talentsSelect = obj.talentsSelect || ''
    this.talentsChooseOne = obj.talentsChooseOne || false
    this.talentsSelected = obj.talentsSelected || []
    this.talents = obj.talents || []
    this.spells = obj.spells || []
    this.talentspick = obj.talents || []
    this.languages = obj.languages || []
  }
}

Handlebars.registerHelper('hasCharacteristics', level => {
  return (
    level.characteristicsPerception ||
    level.characteristicsDefense ||
    level.characteristicsPower ||
    level.characteristicsSpeed ||
    level.characteristicsHealth ||
    level.characteristicsCorruption ||
    level.characteristicsInsanity
  )
})

export class PathLevelItem {
  constructor(obj) {
    if (obj === undefined) obj = {}
    if (typeof obj === 'string') obj = JSON.parse(obj)

    this.id = obj.id || ''
    this.name = obj.name || ''
    this.description = obj.description || ''
    this.pack = obj.pack || ''
    this.selected = Boolean(obj.selected) || false
  }
}

export class DamageType {
  constructor(obj) {
    if (obj === undefined) obj = {}
    if (typeof obj === 'string') obj = JSON.parse(obj)

    this.damage = obj.damage || ''
    this.damagetype = obj.damagetype || ''
  }
}

/* -------------------------------------------- */
/*  Transfer functions                          */

/* -------------------------------------------- */

export async function getNestedDocument(nestedData) {
  let entity
  let method // <- Used to print how the item was fetched
  const id = nestedData.id ?? nestedData._id ?? nestedData.data._id
  // First look into packs, then into the game items by ID

  if (nestedData.pack) {
    const pack = game.packs.get(nestedData.pack)
    if (pack.documentName !== 'Item') return
    entity = await pack.getDocument(id)
    method = 'PACK'
  } else if (id) {
    entity = game.items.get(id)
    method = 'ITEMS'
  }

  // If the data was already stored, use it
  if (!entity) {
    entity = nestedData.data
    method = 'DATA-OBJ'
  }

  // -- Fallbacks
  // Look for talents with same name inside items
  if (!entity) {
    entity = game.items.find(i => i.name === nestedData.name)
    method = entity ? 'FB-ITEMS' : method
  }
  // Look for talents with same id or name inside ALL packs
  if (!entity) {
    for (const pack of game.packs) {
      entity = (await pack.getDocument(nestedData.id)) || (await pack.getDocuments({name: nestedData.name}))[0]
      if (entity) break
    }
    method = entity ? 'FB-PACKS' : method
  }

  if (!entity) {
    console.error('DEMONLORD | Nested object not found', nestedData)
    return null
  }
  // console.log(`DEMONLORD | Nested object fetched using ${method}`, nestedData, entity) // TODO: Remove when stable
  console.log(`DEMONLORD | Nested object fetched using ${method}`)
  return entity
}

export async function getNestedItemData(nestedData) {
  const entity = await getNestedDocument(nestedData)

  // Get the item data OBJECT. If the item is not an item, then it has been retreived using the data saved in the nested
  let itemData = undefined
  if (entity instanceof Item)
    itemData = entity.data.toObject()
  else {
    itemData = entity
  }

  itemData.selected = nestedData.selected  // Remember the user selection

  // Return only the data
  // Warning: here the implicit assertion is that entity is an Item and not an Actor or something else
  if (entity instanceof Item) return itemData
  else if (entity?.data?.data) return entity.data
  return entity
}

export async function getNestedItemsDataList(nestedDataList) {
  const p = []
  for (const nd of nestedDataList) p.push(await getNestedItemData(nd))
  return p.filter(Boolean)
}

/* -------------------------------------------- */

function _getLevelItemsToTransfer(level) {
  let nestedItems = [...level.talents, ...level.languages]
  const selectedItems = [...level.spells, ...level.talentspick].filter(i => Boolean(i.selected))
  nestedItems = [...nestedItems, ...selectedItems]
  return nestedItems
}

export async function handleCreatePath(actor, pathItem) {
  const actorLevel = parseInt(actor.data.data.level)
  const pathData = pathItem.data.data
  const leqLevels = pathData.levels.filter(l => +l.level <= +actorLevel)

  // For each level that is <= actor level, add all talents and *selected* nested items
  for (let level of leqLevels) {
    await createActorNestedItems(actor, _getLevelItemsToTransfer(level), pathItem.id, level.level)
  }
  return Promise.resolve()
}

export async function handleLevelChange(actor, newLevel, curLevel = undefined) {
  curLevel = parseInt(curLevel ?? actor.data.data.level)
  newLevel = parseInt(newLevel)
  if (newLevel === curLevel) return
  const actorItems = actor.getEmbeddedCollection('Item')
  const paths = actorItems.filter(i => i.type === 'path')
  const ancestry = actorItems.find(i => i.type === 'ancestry')

  // If the new level is greater than the old, add stuff
  if (newLevel > curLevel) {
    // Create relevant path levels' nested items
    for (let path of paths) {
      path.data.data.levels
        .filter(l => +l.level > curLevel && +l.level <= newLevel)
        .forEach(level => createActorNestedItems(actor, _getLevelItemsToTransfer(level), path.id, level.level))
    }
    // Add ancestry level 4 nested items
    if (ancestry && curLevel < 4 && newLevel >= 4) {
      const ancestryData = ancestry.data.data
      let chosenNestedItems = [...ancestryData.level4.talent, ...ancestryData.level4.spells].filter(i => Boolean(i.selected))
      await createActorNestedItems(actor, chosenNestedItems, ancestry.id, 4)
    }
  }
  // Otherwise delete items with levelRequired > newLevel
  else {
    const ids = actorItems.filter(i => i.data.flags?.demonlord?.levelRequired > newLevel).map(i => i.id)
    if (ids.length) await actor.deleteEmbeddedDocuments('Item', ids)
  }
  return Promise.resolve()
}

/* -------------------------------------------- */

export async function handleCreateAncestry(actor, ancestryItem) {
  const ancestryData = ancestryItem.data.data
  let nestedItems = [...ancestryData.talents, ...ancestryData.languagelist]
  let createdItems = await createActorNestedItems(actor, nestedItems, ancestryItem.id, 0)
  // If character level >= 4, add chosen nested items
  if (actor.data.data.level >= 4) {
    let chosenNestedItems = [...ancestryData.level4.talent, ...ancestryData.level4.spells].filter(i => Boolean(i.selected))
    createdItems = createdItems.concat(await createActorNestedItems(actor, chosenNestedItems, ancestryItem.id, 4))
  }
  return createdItems
}

/* -------------------------------------------- */

/**
 * Creates nested items inside an Actor, using a collection of ItemData.
 * @param actor Target DemonlordActor to contain the item
 * @param nestedItems Nested items list. Important, it doesn't contain ItemData, but the custom nestedItemData (PathLevelItem)
 * @param parentItemId ID of the parent of the nested item
 * @returns {Promise<Item>} The created item list
 */
export async function createActorNestedItems(actor, nestedItems, parentItemId, levelRequired = 0) {
  let itemDataList = await getNestedItemsDataList(nestedItems)
  // Set the flags
  itemDataList = itemDataList.map((itemData, i) => {
    itemData.flags.demonlord = {
      nestedItemId: nestedItems[i]?.data?._id ?? nestedItems[i]._id,
      parentItemId: parentItemId,
      levelRequired: levelRequired
    }
    return itemData
  })

  return await actor.createEmbeddedDocuments('Item', itemDataList)
}


/**
 * Deletes nested items from an actor using one of two methods:
 * - By parentItemId lookup, deleting items which match the flag 'demonlord.parentItemId'
 * - By nestedItemId lookup, deleting items which match the flag 'demonlord.nestedItemId'
 * The first can be used to delete all items from a parent, for example when deleting an ancestry we want to delete all
 * of its nested items from the actor.
 * The latter is used to delete all items from a single nested item. For example when the user de-selects a choosable
 * talent inside an ancestry
 * @param actor
 * @param parentItemId
 * @param nestedItemId
 * @returns {Promise<void>}
 */
export async function deleteActorNestedItems(actor, parentItemId = undefined, nestedItemId = undefined) {
  const actorItems = actor.getEmbeddedCollection('Item')
  let ids = []
  if (parentItemId) {
    ids = actorItems.filter(i => i.data.flags?.demonlord?.parentItemId === parentItemId).map(i => i.id)
  } else if (nestedItemId) {
    ids = actorItems.filter(i => i.data.flags?.demonlord?.nestedItemId === nestedItemId).map(i => i.id)
  }
  if (ids.length) actor.deleteEmbeddedDocuments('Item', ids)
}
