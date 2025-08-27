'use client'

import { availableCount, Building, displayName, Factory, handleId, recipes, useFactoryStore } from "../factory"
import { Node, ReactFlow, Position, Handle, NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Combobox } from "../../../components/ui/combobox";
import { useStore } from "zustand";
import { Input } from "@/components/ui/input";
import { Fragment } from "react";

const nodeTypes = {
  buildingNode: BuildingNode
} as const

export function FactoryView() {
  const store = useFactoryStore()
  const factory = useStore(store)
  const updateNodeInternals = useUpdateNodeInternals()

  const onConnectEnd: Factory['onConnectEnd'] = (event, connectionState) => {
    const createdBuilding = factory.onConnectEnd(event, connectionState)
    if (createdBuilding) updateNodeInternals(createdBuilding.id)
    return createdBuilding
  }

  return (
    <div className="p-4 w-screen">
      <Input value={factory.name} onChange={e => factory.set(() => ({ name: e.currentTarget.value }))}></Input>
      <Button onClick={() => factory.add()} className="mt-4">Add machine</Button>
      <div className="w-full h-200 pt-4 text-black">
        <div className="w-fill h-full rounded-md border-solid border-white border-1">
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={factory?.buildings}
          edges={factory?.connections}
          onNodesChange={factory.applyNodeChanges}
          onEdgesChange={factory.applyEdgeChanges}
          onConnect={factory.onConnect}
          onConnectEnd={onConnectEnd}
          fitView
        />
        </div>
      </div>
      <pre suppressHydrationWarning>{JSON.stringify(factory, null, 2)}</pre>
    </div>
  )
}

function BuildingNode({ id, data } : NodeProps<Node<Building>>){
  const store = useFactoryStore()
  const setRecipe = useStore(store, s => s.setRecipe)
  const setBuilding = useStore(store, s => s.setBuilding)
  const factory = useStore(store)

  return (
    <div className="bg-white text-gray-800 text-sm rounded shadow flex flex-col items-stretch">
      <div className="flex justify-center items-center"><Input value={data.count} type="number" step={0.25} className="w-14 remove-arrow" onChange={e => setBuilding(id, s => ({ ...s, data: {...s.data, count: parseFloat(e.currentTarget.value)} }))} /><Combobox options={recipes.map(r => ({value: r.id, label: r.name}))} selectedOption={data.recipe.id} setOption={(recipeId) => setRecipe(id, recipeId) } /></div>
      <span className="text-center">{data.recipe.producedIn}</span>
      <div className="flex items-stretch justify-between text-nowrap gap-1">
        <div className="grid grid-cols-[repeat(3,max-content)] place-items-stretch flex-1 gap-1 py-1">
          {data.recipe.requires.map(input => {
            const handle = handleId(id, true, input.item)
            const available = availableCount(factory, handle)
            const required = data.count * input.rate
            const diff = available - required
            const diffClass = diff < 0 ? "bg-red-400/50" : diff < required * 0.1 ? "bg-green-400/50" : "bg-yellow-400/50"
            return (
              <Fragment key={`input-${input.item}`}>
                <div className="relative">
                  <Handle type="target" position={Position.Left} isConnectable={true} id={handle}/>
                  <div className={"pl-2 pr-1 py-[0.5] " + diffClass}>{diff >= 0 ? `+${diff}` : diff}</div>
                </div>
                <div className="flex items-center">
                  {required}
                </div>
                <div className="flex items-center">
                  {displayName(input.item)}
                </div>
              </Fragment>
            )
          })}
        </div>

        <div className="flex flex-col flex-1 justify-around text-right">
          {data.recipe.produces.map(input => (
            <div key={`output-${input.item}`} className="relative px-2">
              <Handle type="source" position={Position.Right} isConnectable={true} id={handleId(id, false, input.item)}/>
              {data.count * input.rate} {displayName(input.item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}