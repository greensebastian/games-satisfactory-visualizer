'use client'

import { useCallback, useEffect, useState } from "react"
import { Building, createFactory, Factory, FactoryUtils } from "../factory"
import { useDebouncedCallback } from "use-debounce"
import { Node, Edge, NodeChange, EdgeChange, Connection, ReactFlow, Position, Handle, useUpdateNodeInternals, NodeProps } from "@xyflow/react";
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  buildingNode: BuildingNode
} as const

export function FactoryView({ factoryId } : { factoryId?: string }) {
  const [firstLoad, setFirstLoad] = useState(true)
  const [factory, setRawFactory] = useState<Factory>()
  const setFactoryInStorage = useDebouncedCallback((newFactory: Factory) => {
    window.sessionStorage.setItem(`factory:${newFactory.id}`, JSON.stringify(newFactory))
  }, 2000)

  const updateNodeInternals = useUpdateNodeInternals();

  const setFactory = useCallback((applyChange: (oldFactory: Factory | undefined ) => Factory) => {
    setRawFactory(applyChange)
    for(const building of factory?.buildings ?? []){
      updateNodeInternals(building.id)
    }
    setFactoryInStorage(applyChange(factory))
  }, [factory, setFactoryInStorage, updateNodeInternals])

  useEffect(() => {
    if (firstLoad){
      setFirstLoad(false)
      const serializedFactory = window.sessionStorage.getItem(`factory:${factoryId}`);
      if (factoryId && serializedFactory) {
        setFactory(() => JSON.parse(serializedFactory))
      }
      else {
        setFactory(() => FactoryUtils.add(createFactory(factoryId), "RecipeAluminumScrapC"))
      }
    }
  }, [factoryId, firstLoad, factory, setFactory])
 
  const onNodesChange = useCallback(
    (changes: NodeChange<Node<Building>>[]) => setFactory((factorySnapshot) => FactoryUtils.applyNodeChanges(factorySnapshot, changes)),
    [setFactory],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setFactory((factorySnapshot) => FactoryUtils.applyEdgeChanges(factorySnapshot, changes)),
    [setFactory],
  );
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      console.log("onConnect", params)
    },
    [],
  );

  return (
    <div className="p-4 w-screen">
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add machine</button>
      <div className="w-full h-200 pt-4 text-black">
        <div className="w-fill h-full rounded-md border-solid border-white border-1">
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={factory?.buildings}
          edges={factory?.connections}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        />
        </div>
      </div>
      <pre>{JSON.stringify(factory, null, 2)}</pre>
    </div>
  )
}

function BuildingNode({ data } : NodeProps<Node<Building>>){
  return (
    <div className="bg-white text-gray-800 text-sm rounded shadow flex flex-col items-stretch">
      <p className="text-center text-lg">{data.count} X {data.recipe.name} in {data.recipe.producedIn}</p>
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