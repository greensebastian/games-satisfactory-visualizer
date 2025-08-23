"use client"

import { ReactFlowProvider } from "@xyflow/react"
import { FactoryView } from "./factoryView"

export function ReactFlowWrapper({factoryId}: {factoryId: string}){
  return (
    <ReactFlowProvider>
      <FactoryView factoryId={factoryId} />
    </ReactFlowProvider>
  )
}