'use client'

import { useCallback, useEffect, useState } from "react"
import { Building, createFactory, Factory, FactoryUtils } from "../factory"
import { useDebouncedCallback } from "use-debounce"
import { Node, Edge, NodeChange, EdgeChange, Connection, ReactFlow, Position, Handle, useUpdateNodeInternals, NodeProps } from "@xyflow/react";
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges: Edge[] = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

const nodeTypes = {
  buildingNode: BuildingNode
} as const

export function FactoryView({ factoryId } : { factoryId?: string }) {
  const [firstLoad, setFirstLoad] = useState(true)
  const [factory, setRawFactory] = useState<Factory>()
  const setFactoryInStorage = useDebouncedCallback((newFactory: Factory) => {
    console.log("setting factory in storage", newFactory.id)
    window.sessionStorage.setItem(`factory:${newFactory.id}`, JSON.stringify(newFactory))
  }, 2000)

  const updateNodeInternals = useUpdateNodeInternals();

  const setFactory = useCallback((newFactory: Factory) => {
    console.log("setting factory", newFactory?.id)
    setRawFactory(newFactory)
    for(const building of factory?.buildings ?? []){
      updateNodeInternals(building.id)
    }
    setFactoryInStorage(newFactory)
  }, [factory?.buildings, setFactoryInStorage, updateNodeInternals])

  useEffect(() => {
    if (firstLoad){
      setFirstLoad(false)
      const serializedFactory = window.sessionStorage.getItem(`factory:${factoryId}`);
      if (factoryId && serializedFactory) {
        setFactory(JSON.parse(serializedFactory))
      }
      else {
        setFactory(FactoryUtils.add(createFactory(factoryId), "RecipeAluminumScrapC"))
      }
    }
  }, [factoryId, firstLoad, factory, setFactory])

  const nodes: Node<Building>[] = !factory ? [] : factory.buildings.map(building => {
    return {
      type: "buildingNode",
      id: building.id,
      position: building.position,
      data: building
    }
  })

  console.log(nodes)

  const edges: Edge[] = !factory ? [] : factory.connections.map(connection => {
    return {
      id: connection.id,
      source: connection.source,
      target: connection.target
    }
  })
 
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      console.log("setNodesChange", changes)
    },
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      console.log("setEdgesChange", changes)
    },
    [],
  );
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      console.log("onConnect", params)
    },
    [],
  );

  return (
    <div className="p-4 w-screen">
      <pre>{JSON.stringify(factory, null, 2)}</pre>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add machine</button>
      <div className="w-full h-200 pt-4 text-black">
        <div className="w-fill h-full rounded-md border-solid border-white border-1">
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={[]}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        />
        </div>
      </div>
    </div>
  )
}

function BuildingNode({ data } : NodeProps<Node<Building>>){
  return (
    <div className="bg-white text-gray-800 text-sm rounded shadow flex flex-col items-stretch">
      <p className="text-center text-lg">{data.recipe.name}</p>
      <div className="flex items-stretch">
        <div className="flex flex-col flex-1 justify-around">
          {data.recipe.requires.map(input => (
            <div key={`input-${input.item}`} className="relative px-2">
              <Handle type="target" position={Position.Left} isConnectable={true} id={`input-${input.item}`}/>
              {input.item}
            </div>
          ))}
        </div>

        <div className="flex flex-col flex-1 justify-around text-right">
          {data.recipe.requires.map(input => (
            <div key={`output-${input.item}`} className="relative px-2">
              <Handle type="source" position={Position.Right} isConnectable={true} id={`output-${input.item}`}/>
              {input.item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}