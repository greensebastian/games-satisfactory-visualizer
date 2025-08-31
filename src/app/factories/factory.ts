import docs from "@/lib/typedDocs.json"
import { v7 as uuid7 } from "uuid"
import { addEdge, applyEdgeChanges, applyNodeChanges, Connection, Edge, EdgeChange, FinalConnectionState, Node, NodeChange } from "@xyflow/react";
import { createStore } from "zustand";
import { persist } from 'zustand/middleware'
import { createContext, useContext } from "react";

export const storagePrefix = "factory::"

type FactoryProps = {
  id: string
}

export type Factory = FactoryProps & {
  name: string
  buildings: Node<Building>[]
  connections: Edge[]
  updatedAt: string
  replace(newFactory: Factory): void
  set(update: (state: Factory) => Partial<Factory>): void
  setBuilding(buildingId: string, update: (state: Factory["buildings"][number]) => Factory["buildings"][number]): Factory["buildings"][number] | undefined
  add(params?: { position?: Node['position'], recipe?: Recipe, count?: number }): Factory["buildings"][number]
  setRecipe(buildingId: string, recipeId: string): Factory["buildings"][number] | undefined
  applyNodeChanges(changes: NodeChange<Factory['buildings'][number]>[]): void
  applyEdgeChanges(changes: EdgeChange[]): void
  onConnect(params: Edge | Connection): void
  onConnectEnd(event: MouseEvent | TouchEvent, connectionState: FinalConnectionState): Factory["buildings"][number] | undefined
}

export function producedBy(factory: Factory, buildingId: string, itemId: string){
  const building = factory.buildings.find(b => b.id === buildingId)
  if (!building) return 0

  return building.data.count * (building.data.recipe.produces.find(ir => ir.item === itemId)?.rate ?? 0)
}

export function requiredBy(factory: Factory, buildingId: string, itemId: string){
  const building = factory.buildings.find(b => b.id === buildingId)
  if (!building) return 0

  return building.data.count * (building.data.recipe.requires.find(ir => ir.item === itemId)?.rate ?? 0)
}

export function availableCount(factory: Factory, handleId: string){
  const handle = reverseHandleId(handleId)
  const itemId = handle.itemId
  
  const connectionsWithItem = factory.connections.flatMap(c => {
    if (!c.sourceHandle || !c.targetHandle) return []
    const source = reverseHandleId(c.sourceHandle)
    const target = reverseHandleId(c.targetHandle)
    if (source.itemId !== itemId || target.itemId !== itemId) return []
    const sourceBuilding = factory.buildings.find(b => b.id === source.buildingId)
    const targetBuilding = factory.buildings.find(b => b.id === target.buildingId)
    if (!sourceBuilding || !targetBuilding) return []
    return {source, target, sourceBuilding, targetBuilding}
  })

  const consumed = new Map<string, number>()
  for(const building of factory.buildings){
    let available = producedBy(factory, building.id, itemId)
    if (available <= 0) continue
    let lastSeen: string | undefined
    for(const connection of connectionsWithItem){
      if (connection.sourceBuilding.id !== building.id) continue
      lastSeen = connection.targetBuilding.id
      const required = requiredBy(factory, connection.targetBuilding.id, itemId)
      const used = consumed.get(connection.targetBuilding.id) ?? 0
      const diff = required - used
      if (diff > 0){
        const added = Math.min(Math.max(diff, 0), available)
        consumed.set(connection.targetBuilding.id, used + added)
        available -= added
      }
    }
    if (lastSeen) consumed.set(lastSeen, (consumed.get(lastSeen) ?? 0) + available)
  }

  return consumed.get(handle.buildingId) ?? 0
}

export function unconnected(factory: Factory){
  const inputHandles = factory.buildings.flatMap(b => b.data.recipe.requires.map(i => handleId(b.id, true, i.item)))
  const outputHandles = factory.buildings.flatMap(b => b.data.recipe.produces.map(i => handleId(b.id, false, i.item)))
  const unconnected = [...inputHandles, ...outputHandles].filter(handle => !factory.connections.find(c => c.sourceHandle === handle || c.targetHandle === handle))
  return unconnected.map(reverseHandleId)
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
  producedIn?: string
}

export type ItemRate = {
  item: string
  rate: number
}

export type Item = {
  id: string
  display: string
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

function producedIn(input: string): string | undefined {
  const [match] = input.matchAll(/\.Build_([^,]+)/g)
  return match ? match[1] ? normalize(match[1]) : undefined : undefined
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
  producedIn: producedIn(value.mProducedIn)
}));

const getRecipe = (recipeId: string) => recipes.find(recipe => recipe.id === recipeId)
const defaultRecipe = recipes.find(r => r.name === "Heavy Modular Frame")!

function bestMatch(searchRates: ItemRate[], searchInput: boolean, left: Recipe, right: Recipe, requiredItem: string){
  if (!left.producedIn) return right
  if (!right.producedIn) return left
  const leftItems = (searchInput ? left.requires : left.produces).map(ir => ir.item)
  const rightItems = (searchInput ? right.requires : right.produces).map(ir => ir.item)
  if (!leftItems.includes(requiredItem)) return right
  if (!rightItems.includes(requiredItem)) return left
  const leftMatches = searchRates.filter(ir => leftItems.includes(ir.item)).length
  const rightMatches = searchRates.filter(ir => rightItems.includes(ir.item)).length
  return leftMatches >= rightMatches ? left : right
}
const getBestRecipe = (rates: ItemRate[], ratesAreOutput: boolean, requiredItem: string) => recipes.reduce((prev, curr) => bestMatch(rates, ratesAreOutput, prev, curr, requiredItem), defaultRecipe)

export const items: Item[] = [
  ...Object.entries(docs.FGItemDescriptor).map(([key, value]) => ({ id: key, display: value.mDisplayName })),
  ...Object.entries(docs.FGItemDescriptorBiomass).map(([key, value]) => ({ id: key, display: value.mDisplayName })),
  ...Object.entries(docs.FGItemDescriptorNuclearFuel).map(([key, value]) => ({ id: key, display: value.mDisplayName })),
  ...Object.entries(docs.FGResourceDescriptor).map(([key, value]) => ({ id: key, display: value.mDisplayName })),
  ...Object.entries(docs.FGConsumableDescriptor).map(([key, value]) => ({ id: key, display: value.mDisplayName })),
]

export const displayName = (itemId: string) => items.find(i => i.id === itemId)?.display ?? itemId

export function handleId(buildingId: string, isInput: boolean, itemId: string){
  return `${buildingId}||${isInput ? "target" : "source"}||${itemId}`
}

export function reverseHandleId(handleId: string){
  const split = handleId.split("||")
  return {
    buildingId: split[0],
    isInput: split[1] === "target",
    itemId: split[2]
  }
}

type FactoryStore = ReturnType<typeof createFactoryStore>

export const createFactoryStore = (initProps?: Partial<FactoryProps>) => {
  const DEFAULT_PROPS: FactoryProps = {
    id: uuid7(),
  }
  return createStore<Factory>()(persist(
    (set, get) => ({
      ...DEFAULT_PROPS,
      ...initProps,
      name: "Untitled factory",
      buildings: [],
      connections: [],
      updatedAt: new Date().toUTCString(),

      replace(newFactory){
        set(newFactory, true)
      },

      set(update){
        set(state => update(state))
      },

      setBuilding(buildingId, update){
        set(state => {
          const building = state.buildings.find(b => b.id === buildingId)
          if (!building) throw new Error("Tried to set non-existent building")

          const newBuildings = state.buildings.map(b => {
            if (b.id === buildingId) return update(b)

            return b;
          })

          return {
            buildings: newBuildings,
            updatedAt: new Date().toUTCString()
          }
        })
        return get().buildings.find(b => b.id === buildingId)
      },

      add(params){
        const recipe = params?.recipe ? params.recipe : get().buildings.length === 0 ? defaultRecipe : get().buildings[0].data.recipe

        const position = params?.position ?? {
          x: get().buildings.length === 0 ? 0 : this.buildings[0].position.x + 50,
          y: get().buildings.length === 0 ? 0 : this.buildings[0].position.y + 50
        }

        const id = uuid7();
        set({
          buildings: [
            ...get().buildings,
            {
              id: id,
              type: "buildingNode",
              position: position,
              data: {
                count: params?.count ?? 1,
                recipe: recipe
              }
            }
          ]
        })

        set({ updatedAt: new Date().toUTCString() })
        return get().buildings.find(b => b.id === id)!
      },

      setRecipe(buildingId, recipeId){
        const recipe = getRecipe(recipeId)
        if (!recipe) return
        
        const factory = get()
        const toRemove = factory.connections.filter(c => {
          if (c.source !== buildingId && c.target !== buildingId) return false

          if (!c.sourceHandle || !c.targetHandle) throw new Error("Invalid connection to remove.")

          const sourceHandle = reverseHandleId(c.sourceHandle)
          const targetHandle = reverseHandleId(c.targetHandle)

          if (sourceHandle.buildingId === buildingId && recipe.produces.some(i => i.item === sourceHandle.itemId)){
            return false
          }
          if (targetHandle.buildingId === buildingId && recipe.requires.some(i => i.item === targetHandle.itemId)){
            return false
          }

          return true
        })

        factory.applyEdgeChanges(toRemove.map(c => ({
          type: 'remove',
          id: c.id
        })))

        return factory.setBuilding(buildingId, building => ({...building, data: { ...building.data, recipe: recipe }}))
      },

      applyNodeChanges(changes){
        if (changes.length === 0) return

        set({
          buildings: applyNodeChanges(changes, get().buildings)
        })
        set({ updatedAt: new Date().toUTCString() })
      },

      applyEdgeChanges(changes){
        if (changes.length === 0) return

        set({
          connections: applyEdgeChanges(changes, get().connections)
        })
        set({ updatedAt: new Date().toUTCString() })
      },

      onConnect(params){
        set({
          connections: addEdge(params, get().connections)
        })
        set({ updatedAt: new Date().toUTCString() })
      },

      onConnectEnd(_, connectionState) {
        if (!connectionState.toNode){
          const sourceNode = connectionState.fromNode
          const sourceHandle = connectionState.fromHandle
          if (!sourceNode || !isBuilding(sourceNode?.data) || !sourceHandle) return
          const sourceIsOutput = sourceHandle.type === 'source'
          const requiredItem = reverseHandleId(sourceHandle.id!).itemId
          const targetRecipe = getBestRecipe(sourceIsOutput ? sourceNode.data.recipe.produces : sourceNode.data.recipe.requires, sourceIsOutput, requiredItem)
          const targetNode = get().add({position: sourceNode.position, recipe: targetRecipe})
          
          setTimeout(() => {
            const target = get().buildings.find(b => b.id === targetNode?.id)
            const source = get().buildings.find(b => b.id === sourceNode?.id)
            if (target && source){
              const deltaX = sourceIsOutput ? source.measured?.width ?? 0 : target.measured?.width ?? 0
              const deltaY = ((source.measured?.height ?? 0) - (target.measured?.height ?? 0)) / 2
              get().applyNodeChanges([{
                id: target.id,
                type: "position",
                position: {
                  y: source.position.y + deltaY,
                  x: source.position.x + (sourceIsOutput ? deltaX + 50 : -deltaX - 50)
                }
              }])
              const targetHandleId = handleId(target.id, sourceIsOutput, requiredItem)
              const realSourceHandle = sourceIsOutput ? sourceHandle.id : targetHandleId
              const realTargetHandle = sourceIsOutput ? targetHandleId : sourceHandle.id
              if (realSourceHandle && realTargetHandle){
                get().onConnect({
                  id: uuid7(),
                  source: sourceIsOutput ? source.id : target.id,
                  sourceHandle: realSourceHandle,
                  target: sourceIsOutput ? target.id : source.id,
                  targetHandle: realTargetHandle
                })
              }
            }
          }, 0)

          return targetNode
        }
      }
    }), {
      name: `${storagePrefix}${initProps?.id ?? DEFAULT_PROPS.id}`
    })
  )
}

function isBuilding(data?: Record<string, unknown>): data is Building{
  return !!data && !!data.recipe && !!data.count
}

export const FactoryContext = createContext<FactoryStore | null>(null)

export const useFactoryStore = () => {
  const store = useContext(FactoryContext)
  if (!store) throw new Error('Missing FactoryContext.Provider in the tree')
  return store
}
