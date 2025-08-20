import docs from "@/lib/typedDocs.json"
import { v7 as uuid7 } from "uuid"

export type Factory = {
  id: string
  name: string
  buildings: Building[]
  connections: Connection[]
  recipes: Recipe[]
}

export type Building = {
  id: string
  count: number
  recipe: Recipe['id']
}

export type Connection = {
  origin: Building["id"]
  target: Building["id"]
}

export type Recipe = {
  id: string
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
    connections: [],
    recipes: []
  }
}

export class FactoryUtils{
  static add(factory: Factory, recipeName: string): Factory{
    const recipe = getRecipe(recipeName)
    if (!recipe) return factory

    return {
      ...factory,
      recipes: [...factory.recipes, recipe],
      buildings: [...factory.buildings,
      {
        id: uuid7(),
        count: 1,
        recipe: recipe.id
      }]
    }
  }
}

function getRecipe(recipeName: string): Recipe | undefined {
  for(const [key, value] of Object.entries(docs.FGRecipe)){
    if (key === recipeName){
      
      return {
        id: key,
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