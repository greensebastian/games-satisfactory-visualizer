"use client";

import { createFactoryStore } from "../../factory";
import { useStore } from "zustand";

export function Export({ factoryId }: { factoryId: string }) {
  const store = createFactoryStore({ id: factoryId });
  const factory = useStore(store);
  return <pre>{JSON.stringify(factory, null, 2)}</pre>;
}
