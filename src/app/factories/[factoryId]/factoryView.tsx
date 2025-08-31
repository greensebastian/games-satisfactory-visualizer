'use client'

import { availableCount, Building, displayName, Factory, handleId, producedBy, recipes, requiredBy, reverseHandleId, unconnected, useFactoryStore } from "../factory"
import { Node, ReactFlow, Position, Handle, NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Combobox } from "../../../components/ui/combobox";
import { useStore } from "zustand";
import { Input } from "@/components/ui/input";
import { Fragment } from "react";
import Link from "next/link";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const unconnectedHandles = unconnected(factory)
  const reducedHandles = unconnectedHandles.reduce((acc, curr) => {
    const toAdd = curr.isInput ? requiredBy(factory, curr.buildingId, curr.itemId) : producedBy(factory, curr.buildingId, curr.itemId);
    const existing = acc.find(i => i.itemId === curr.itemId && i.isInput === curr.isInput)
    if (existing){
      existing.amount += toAdd
    }
    else (acc.push({ itemId: curr.itemId, itemDisplayName: displayName(curr.itemId), isInput: curr.isInput, amount: toAdd }))
    return acc;
  }, [] as { itemId: string, itemDisplayName: string, isInput: boolean, amount: number }[]).toSorted((a, b) => {
    return (a.isInput && !b.isInput) ? -1 : (b.isInput && !a.isInput) ? 1 : a.itemDisplayName.localeCompare(b.itemDisplayName)
  })

  return (
    <div className="p-4 pb-0 w-screen">
      <Input value={factory.name} onChange={e => factory.set(() => ({ name: e.currentTarget.value }))}></Input>
      <Button onClick={() => factory.add()} className="mt-4">Add machine</Button>
      <Link href="/factories" className="mt-4 ml-4"><Button variant={"secondary"}>Show factories</Button></Link>
      <Table className="mt-4 [&_th]:px-4 [&_td]:px-4">
        <TableCaption>Inputs and outputs not connected to anything</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1">Item</TableHead>
            <TableHead className="w-1">Input/Output</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reducedHandles.map(handle => (
            <TableRow key={`${handle.itemId}-${handle.isInput}`}>
              <TableCell className="font-medium">{handle.itemDisplayName}</TableCell>
              <TableCell>{handle.isInput ? "Input" : "Output"}</TableCell>
              <TableCell>{handle.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="w-full h-svh py-4 text-black">
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
    </div>
  )
}

function BuildingNode({ id, data } : NodeProps<Node<Building>>){
  const store = useFactoryStore()
  const setRecipe = useStore(store, s => s.setRecipe)
  const setBuilding = useStore(store, s => s.setBuilding)
  const factory = useStore(store)
  const missingInputs = factory.connections.reduce((unresolvedInputItems, connection) => {
    if (!connection.targetHandle) return unresolvedInputItems
    const handle = reverseHandleId(connection.targetHandle)
    if (handle.buildingId !== id) return unresolvedInputItems
    return unresolvedInputItems.filter(i => i !== handle.itemId)
  }, data.recipe.requires.map(ir => ir.item))

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
            const missingRequirementClass = missingInputs.includes(input.item) ? "border-red-500" : ""
            return (
              <Fragment key={`input-${input.item}`}>
                <div className="relative">
                  <Handle type="target" position={Position.Left} isConnectable={true} id={handle}/>
                  <div className={`pl-2 pr-1 ${diffClass} border-3  ${missingRequirementClass}`}>{diff >= 0 ? `+${diff}` : diff}</div>
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