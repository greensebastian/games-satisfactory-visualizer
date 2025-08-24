import docs from "@/lib/typedDocs.json"
import { v7 as uuid7 } from "uuid"
import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, Node, NodeChange } from "@xyflow/react";

export type Factory = {
  id: string
  name: string
  buildings: Node<Building>[]
  connections: Edge[]
}

export type Building = {
  count: number
  recipe: Recipe
}

export type Recipe = {
  name: string
  requires: ItemRate[]
  produces: ItemRate[]
  producedIn: string
}

export type ItemRate = {
  item: string
  rate: number
}

export function createFactory(id?: string): Factory{
  return {
    id: id ?? uuid7(),
    name: "Untitled factory",
    buildings: [],
    connections: []
  }
}

export class FactoryUtils{
  static add(factory: Factory | undefined, recipeName: string): Factory{
    if (!factory) return createFactory()
    const recipe = getRecipe(recipeName)
    if (!recipe) return factory

    return {
      ...factory,
      buildings: [...factory.buildings,
      {
        id: uuid7(),
        type: "buildingNode",
        position: {
          x: 0,
          y: 0
        },
        data: {
          count: 1,
          recipe: recipe
        }
      }]
    }
  }

  static applyNodeChanges(factory: Factory | undefined, changes: NodeChange<Factory['buildings'][number]>[]): Factory{
    if (!factory) return createFactory()
    if (changes.length === 0) return factory

    return {
      ...factory,
      buildings: applyNodeChanges<Factory['buildings'][number]>(changes, factory.buildings)
    }
  }

  static applyEdgeChanges(factory: Factory | undefined, changes: EdgeChange[]): Factory{
    if (!factory) return createFactory()
    if (changes.length === 0) return factory

    return {
      ...factory,
      connections: applyEdgeChanges(changes, factory.connections)
    }
  }
}

function getRecipe(recipeName: string): Recipe | undefined {
  for(const [key, value] of Object.entries(docs.FGRecipe)){
    if (key === recipeName){
      return {
        name: value.mDisplayName,
        requires: itemRates(value.mIngredients, parseFloat(value.mManufactoringDuration)),
        produces: itemRates(value.mProduct, parseFloat(value.mManufactoringDuration)),
        producedIn: "Machine"
      }
    } 
  }
}

const itemRateRegex = /\([^()]+\)/g
function itemRates(input: string, secondsToCreate: number): ItemRate[]{
  const results: ItemRate[] = []
  for(const [match] of input.matchAll(itemRateRegex)){
    const item = match.match(/\.([a-zA-Z0-9_]+)/)
    const amount = match.match(/Amount=(.+)/)
    if (!item || !amount) throw new Error("That failed.");
    results.push({item: normalize(item[1]), rate: parseFloat(amount[1]) * 60 / secondsToCreate})
  }

  return results
}

const specialCharacters = /[^a-zA-Z0-9]/g
function normalize(input: string) {
  return input.replaceAll(specialCharacters, "")
}