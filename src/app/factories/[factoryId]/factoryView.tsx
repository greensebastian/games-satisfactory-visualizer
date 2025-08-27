'use client'

import { Building, displayName, Factory, handleId, recipes, useFactoryStore } from "../factory"
import { Node, ReactFlow, Position, Handle, NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Combobox } from "../../../components/ui/combobox";
import { useStore } from "zustand";
import { Input } from "@/components/ui/input";

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
      <pre>{JSON.stringify(factory, null, 2)}</pre>
    </div>
  )
}

function BuildingNode({ id, data } : NodeProps<Node<Building>>){
  const store = useFactoryStore()
  const setRecipe = useStore(store, s => s.setRecipe)
  const setBuilding = useStore(store, s => s.setBuilding)

  return (
    <div className="bg-white text-gray-800 text-sm rounded shadow flex flex-col items-stretch">
      <div className="flex justify-center items-center"><Input value={data.count} type="number" step={0.25} className="w-14 remove-arrow" onChange={e => setBuilding(id, s => ({ ...s, data: {...s.data, count: parseFloat(e.currentTarget.value)} }))} /><Combobox options={recipes.map(r => ({value: r.id, label: r.name}))} selectedOption={data.recipe.id} setOption={(recipeId) => setRecipe(id, recipeId) } /></div>
      <span className="text-center">{data.recipe.producedIn}</span>
      <div className="flex items-stretch justify-between text-nowrap">
        <div className="flex flex-col flex-1 justify-around gap-2 py-1">
          {data.recipe.requires.map(input => (
            <div key={`input-${input.item}`} className="relative px-2">
              <Handle type="target" position={Position.Left} isConnectable={true} id={handleId(id, true, input.item)}/>
              {data.count * input.rate} {displayName(input.item)}
            </div>
          ))}
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