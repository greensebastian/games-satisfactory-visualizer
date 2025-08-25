"use client"

import { ReactFlowProvider } from "@xyflow/react"
import { FactoryView } from "./factoryView"
import { createFactoryStore, FactoryContext } from "../factory"
import { useRef } from "react"

export function ReactFlowWrapper({factoryId}: {factoryId: string}){
  const store = useRef(createFactoryStore({ id: factoryId })).current
  return (
    <FactoryContext.Provider value={store}>
      <ReactFlowProvider>
        <FactoryView />
      </ReactFlowProvider>
    </FactoryContext.Provider>
  )
}