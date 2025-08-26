"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"
import { useDebounce } from "use-debounce"

type ComboboxOption = {
  value: string
  label: string
}

export function Combobox({ options, selectedOption, setOption }: {options: ComboboxOption[], selectedOption: string, setOption: (option: string) => void}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 200);
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(debouncedSearch.toLowerCase())).slice(0, 10)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {selectedOption
            ? options.find((option) => option.value === selectedOption)?.label
            : "Select recipe..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder="Search recipe..." className="h-9" />
          <CommandList>
            <CommandEmpty>No recipe found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    setOption(currentValue === selectedOption ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedOption === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
