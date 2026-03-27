"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { FactoryView } from "./factoryView";
import { createFactoryStore, FactoryContext } from "../factory";
import { useRef } from "react";
import { createViewStateStore, ViewStateContext } from "../viewState";

export function ReactFlowWrapper({ factoryId }: { factoryId: string }) {
  const factoryStore = useRef(createFactoryStore({ id: factoryId })).current;
  const viewStateStore = useRef(createViewStateStore()).current;
  return (
    <FactoryContext.Provider value={factoryStore}>
      <ViewStateContext.Provider value={viewStateStore}>
        <ReactFlowProvider>
          <FactoryView />
        </ReactFlowProvider>
      </ViewStateContext.Provider>
    </FactoryContext.Provider>
  );
}
