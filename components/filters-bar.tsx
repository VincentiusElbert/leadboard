"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown, RotateCcw, Search, X } from "lucide-react"
import { RANGES, type Filters } from "@/lib/analytics"
import { CHANNELS, CITIES, STATUSES } from "@/lib/data"

type Props = {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
  isDirty: boolean
}

export function FiltersBar({ filters, onChange, onReset, isDirty }: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      {/* Date range presets */}
      <div role="radiogroup" aria-label="Date range" className="flex rounded-lg border border-line bg-surface p-1 w-fit">
        {RANGES.map((r) => {
          const active = filters.range === r.key
          return (
            <button
              key={r.key}
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ range: r.key })}
              className={`relative px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                active ? "text-accent-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="range-pill"
                  className="absolute inset-0 rounded-md bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{r.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect
          label="Channel"
          options={[...CHANNELS]}
          value={filters.channels}
          onChange={(channels) => onChange({ channels })}
        />
        <MultiSelect
          label="Status"
          options={[...STATUSES]}
          value={filters.statuses}
          onChange={(statuses) => onChange({ statuses })}
        />
        <div className="relative">
          <select
            aria-label="City"
            value={filters.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-line bg-surface text-sm text-ink hover:border-ink-2/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        </div>

        <AnimatePresence>
          {isDirty && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={onReset}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-sm text-ink-2 hover:text-ink hover:bg-surface-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="relative lg:ml-auto w-full lg:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search leads, IDs, campaigns..."
          aria-label="Search leads"
          className="w-full h-9 pl-9 pr-8 rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ search: "" })}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const toggle = (opt: string) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`h-9 px-3 inline-flex items-center gap-2 rounded-lg border text-sm transition-colors ${
          value.length ? "border-accent/60 bg-accent/10 text-ink" : "border-line bg-surface text-ink hover:border-ink-2/40"
        }`}
      >
        {label}
        {value.length > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-accent-ink text-xs font-semibold inline-flex items-center justify-center">
            {value.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-multiselectable="true"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-xl origin-top-left"
          >
            {options.map((opt) => {
              const checked = value.includes(opt)
              return (
                <button
                  key={opt}
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(opt)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-ink hover:bg-surface-2"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      checked ? "bg-accent border-accent" : "border-line"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 text-accent-ink" strokeWidth={3} />}
                  </span>
                  {opt}
                </button>
              )
            })}
            {value.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="w-full mt-1 pt-2 border-t border-line text-xs text-ink-2 hover:text-ink py-1.5"
              >
                Clear selection
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
