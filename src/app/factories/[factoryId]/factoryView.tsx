'use client'

import { useCallback, useEffect, useState } from "react"
import { createFactory, Factory, FactoryUtils } from "../factory"
import { useDebouncedCallback } from "use-debounce"

export function FactoryView({ factoryId } : { factoryId?: string }) {
  const [firstLoad, setFirstLoad] = useState(true)
  const [factory, setRawFactory] = useState<Factory>()
  const setFactoryInStorage = useDebouncedCallback((newFactory: Factory) => {
    console.log("setting factory in storage", newFactory.id)
    window.sessionStorage.setItem(`factory:${newFactory.id}`, JSON.stringify(newFactory))
  }, 2000)

  const setFactory = useCallback((newFactory: Factory) => {
    console.log("setting factory", newFactory?.id)
    setRawFactory(newFactory)
    setFactoryInStorage(newFactory)
  }, [setFactoryInStorage])

  useEffect(() => {
    if (firstLoad){
      setFirstLoad(false)
      const serializedFactory = window.sessionStorage.getItem(`factory:${factoryId}`);
      if (factoryId && serializedFactory) {
        setFactory(JSON.parse(serializedFactory))
      }
      else {
        setFactory(FactoryUtils.add(createFactory(factoryId), "RecipeIngotSteelC"))
      }
    }
  }, [factoryId, firstLoad, factory, setFactory])

  return (
    <pre>{JSON.stringify(factory, null, 2)}</pre>
  )
}