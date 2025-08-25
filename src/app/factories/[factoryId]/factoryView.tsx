'use client'

import { useCallback } from "react"
import { Building, recipes, useFactoryStore } from "../factory"
import { Node, Edge, Connection, ReactFlow, Position, Handle, NodeProps } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Combobox } from "../../../components/ui/combobox";
import { useStore } from "zustand";

const nodeTypes = {
  buildingNode: BuildingNode
} as const

export function FactoryView() {
  const store = useFactoryStore()
  const factory = useStore(store)
 
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      console.log("onConnect", params)
    },
    [],
  );

  return (
    <div className="p-4 w-screen">
      <Button onClick={() => factory.add()}>Add machine</Button>
      <div className="w-full h-200 pt-4 text-black">
        <div className="w-fill h-full rounded-md border-solid border-white border-1">
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={factory?.buildings}
          edges={factory?.connections}
          onNodesChange={factory.applyNodeChanges}
          onEdgesChange={factory.applyEdgeChanges}
          onConnect={onConnect}
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

  return (
    <div className="bg-white text-gray-800 text-sm rounded shadow flex flex-col items-stretch">
      <span className="text-center text-lg">{data.count} X <Combobox options={recipes.map(r => ({value: r.id, label: r.name}))} selectedOption={data.recipe.id} setOption={(recipeId) => setRecipe(id, recipeId) } /></span>
      <div className="flex items-stretch text-nowrap">
        <div className="flex flex-col flex-1 justify-around">
          {data.recipe.requires.map(input => (
            <div key={`input-${input.item}`} className="relative px-2">
              <Handle type="target" position={Position.Left} isConnectable={true} id={`input-${input.item}`}/>
              {data.count * input.rate} {input.item}
            </div>
          ))}
        </div>

        <div className="flex flex-col flex-1 justify-around text-right">
          {data.recipe.requires.map(input => (
            <div key={`output-${input.item}`} className="relative px-2">
              <Handle type="source" position={Position.Right} isConnectable={true} id={`output-${input.item}`}/>
              {data.count * input.rate} {input.item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}