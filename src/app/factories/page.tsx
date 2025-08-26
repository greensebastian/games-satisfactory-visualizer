"use client"

import { useEffect, useState } from "react"
import { Factory, storagePrefix } from "./factory"
import { StorageValue } from "zustand/middleware"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Page() {
  const [factories, setFactories] = useState<Factory[]>([])
  const pathName = usePathname()

  useEffect(() => {
    const newFactories = Object.entries(localStorage)
      .filter(([key]) => key.startsWith(storagePrefix))
      .map(([, value]) => (JSON.parse(value) as StorageValue<Factory>).state)

    setFactories(newFactories)
  }, [])

  return (<>
    <ul>
      {factories.map(factory => <li key={factory.id}><Link href={`${pathName}/${factory.id}`}>{factory.id} - {factory.name}</Link></li>)}
    </ul>
  </>)
}