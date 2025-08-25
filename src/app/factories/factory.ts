import docs from "@/lib/typedDocs.json"
import { v7 as uuid7 } from "uuid"
import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, Node, NodeChange } from "@xyflow/react";
import { createStore } from "zustand";
import { createJSONStorage, persist } from 'zustand/middleware'
import { createContext, useContext } from "react";
import debounce from "lodash.debounce";
import { StorageValue } from "zustand/middleware";

export type Factory = {
  id: string
  name: string
  buildings: Node<Building>[]
  connections: Edge[]
  replace(newFactory: Factory): void
  add(recipeId?: string): void
  setRecipe(buildingId: string, recipeId: string): void
  applyNodeChanges(changes: NodeChange<Factory['buildings'][number]>[]): void
  applyEdgeChanges(changes: EdgeChange[]): void
}

export type Building = {
  count: number
  recipe: Recipe
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

export const recipes: Recipe[] = Object.entries(docs.FGRecipe).map(([key, value]) => ({
  id: key,
  name: value.mDisplayName,
  requires: itemRates(value.mIngredients, parseFloat(value.mManufactoringDuration)),
  produces: itemRates(value.mProduct, parseFloat(value.mManufactoringDuration)),
  producedIn: "Machine"
}));

const getRecipe = (recipeId: string) => recipes.find(recipe => recipe.id === recipeId)

type FactoryProps = {
  id: string
}

type FactoryState = FactoryProps & {
  name: string
  buildings: Node<Building>[]
  connections: Edge[]
  replace(newFactory: Factory): void
  add(recipeId?: string): void
  setRecipe(buildingId: string, recipeId: string): void
  applyNodeChanges(changes: NodeChange<Factory['buildings'][number]>[]): void
  applyEdgeChanges(changes: EdgeChange[]): void
}

type FactoryStore = ReturnType<typeof createFactoryStore>

const jsonStorage = createJSONStorage<FactoryState>(() => localStorage)
const debouncedJsonStorage = {
  ...jsonStorage,
  setItem: debounce((name: string, value: StorageValue<FactoryState>) => jsonStorage?.setItem(name, value) ?? {}, 500, {
    maxWait: 5000
  })
}

export const createFactoryStore = (initProps?: Partial<FactoryProps>) => {
  const DEFAULT_PROPS: FactoryProps = {
    id: uuid7(),
  }
  return createStore<FactoryState>()(persist(
    (set, get) => ({
      ...DEFAULT_PROPS,
      ...initProps,
      name: "Unititle factory",
      buildings: [],
      connections: [],

      replace(newFactory: Factory){
        set(newFactory, true)
      },

      add(recipeId?: string){
        const recipe = getRecipe(recipeId ?? recipes[0].id)
        if (!recipe) return

        const maxX = this.buildings.length === 0 
          ? 0
          : get().buildings.reduce((prev, curr) => curr.position.x > prev ? curr.position.x : prev, get().buildings[0].position.x)

        const maxY = this.buildings.length === 0 
          ? 0
          : get().buildings.reduce((prev, curr) => curr.position.y > prev ? curr.position.y : prev, get().buildings[0].position.y)

        set({
          buildings: [
            ...get().buildings,
            {
              id: uuid7(),
              type: "buildingNode",
              position: {
                x: maxX + get().buildings.length === 0 ? 0 : 500,
                y: maxY
              },
              data: {
                count: 1,
                recipe: recipe
              }
            }
          ]
        })
      },

      setRecipe(buildingId: string, recipeId: string){
        const building = get().buildings.find(b => b.id === buildingId)
        if (!building) return

        const recipe = getRecipe(recipeId)
        if (!recipe) return

        const newBuildings = get().buildings.map(b => {
          if (b.id === buildingId) return {
            ...b,
            data: {
              ...b.data,
              recipe: recipe
            }
          }

          return b;
        })

        set({
          buildings: newBuildings
        })
      },

      applyNodeChanges(changes: NodeChange<Factory['buildings'][number]>[]){
        if (changes.length === 0) return

        set({
          buildings: applyNodeChanges<Factory['buildings'][number]>(changes, get().buildings)
        })
      },

      applyEdgeChanges(changes: EdgeChange[]){
        if (changes.length === 0) return

        set({
          connections: applyEdgeChanges(changes, get().connections)
        })
      }
    }), {
      name: `factory::${initProps?.id ?? DEFAULT_PROPS.id}`,
      storage: {
        getItem: (name) => debouncedJsonStorage.getItem ? debouncedJsonStorage.getItem(name) : null,
        removeItem: (name) => debouncedJsonStorage.removeItem && debouncedJsonStorage.removeItem(name),
        setItem: (name, value) => debouncedJsonStorage.setItem && debouncedJsonStorage.setItem(name, value)
      } 
    })
  )
}

export const FactoryContext = createContext<FactoryStore | null>(null)

export const useFactoryStore = () => {
  const store = useContext(FactoryContext)
  if (!store) throw new Error('Missing FactoryContext.Provider in the tree')
  return store
}