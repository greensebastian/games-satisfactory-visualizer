"use client"

import { useEffect, useState } from "react"
import { Factory, storagePrefix } from "./factory"
import { StorageValue } from "zustand/middleware"
import Link from "next/link"
import { redirect, usePathname } from "next/navigation"
import { FaTrash } from "react-icons/fa6";
import { v7 as uuid7 } from "uuid"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [factories, setFactories] = useState<Factory[]>([])
  const pathName = usePathname()
  const [changed, setChanged] = useState(true)

  function remove(id: string){
    if (typeof(localStorage) !== 'undefined' && localStorage.removeItem) {
      localStorage.removeItem(storagePrefix + id)
      setChanged(true)
    }
  }

  useEffect(() => {
    if (changed){
      const newFactories = Object.entries(localStorage)
        .filter(([key]) => key.startsWith(storagePrefix))
        .map(([, value]) => (JSON.parse(value) as StorageValue<Factory>).state)

      setFactories(newFactories)
      setChanged(false)
    }
  }, [changed])

  return (
    <div className="p-4 flex flex-col gap-2">
      <Button className="w-min" onClick={(() => redirect(`${pathName}/${uuid7()}`))}>Create factory</Button>
      <ul>
        {factories.toSorted((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).map(factory => <li key={factory.id} className="flex items-center"><Link className="block p-1" href={`${pathName}/${factory.id}`}>{factory.name} - [{factory.id}]</Link><FaTrash size={25} className="inline-block p-1 cursor-pointer" onClick={() => remove(factory.id)}/></li>)}
      </ul>
    </div>
  )
}