import type { Lead } from "./data"

export type ColumnType = "text" | "number" | "currency" | "date" | "status"

export type Column = {
  key: string // "name" for core fields, "meta.device" for discovered JSON fields
  label: string
  type: ColumnType
  source: "core" | "json"
  coverage: number // share of rows that have a value, shown in the column picker
}

const CORE: Omit<Column, "coverage">[] = [
  { key: "id", label: "Lead ID", type: "text", source: "core" },
  { key: "createdAt", label: "Created", type: "date", source: "core" },
  { key: "name", label: "Name", type: "text", source: "core" },
  { key: "email", label: "Email", type: "text", source: "core" },
  { key: "city", label: "City", type: "text", source: "core" },
  { key: "channel", label: "Channel", type: "text", source: "core" },
  { key: "product", label: "Product", type: "text", source: "core" },
  { key: "status", label: "Status", type: "status", source: "core" },
  { key: "value", label: "Deal value", type: "currency", source: "core" },
  { key: "responseMinutes", label: "First response (min)", type: "number", source: "core" },
]

export const DEFAULT_VISIBLE = ["id", "createdAt", "name", "channel", "city", "status", "value"]

function humanize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// Scan every row's JSON payload and turn each key we find into a column,
// inferring its type from the values.
export function discoverColumns(rows: Lead[]): Column[] {
  const seen = new Map<string, { count: number; numeric: boolean }>()
  for (const row of rows) {
    for (const [k, v] of Object.entries(row.meta)) {
      const entry = seen.get(k) ?? { count: 0, numeric: true }
      entry.count++
      if (typeof v !== "number") entry.numeric = false
      seen.set(k, entry)
    }
  }

  const discovered: Column[] = [...seen.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([k, info]) => ({
      key: `meta.${k}`,
      label: humanize(k),
      type: info.numeric ? "number" : "text",
      source: "json",
      coverage: rows.length ? info.count / rows.length : 0,
    }))

  return [...CORE.map((c) => ({ ...c, coverage: 1 })), ...discovered]
}

export function getValue(row: Lead, key: string): string | number | undefined {
  if (key.startsWith("meta.")) return row.meta[key.slice(5)]
  return row[key as keyof Omit<Lead, "meta">]
}
