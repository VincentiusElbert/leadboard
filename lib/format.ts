import type { Lead } from "./data"
import { getValue, type Column } from "./columns"

const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
const idrCompact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 })
const num = new Intl.NumberFormat("en-US")

export const formatIDR = (v: number) => idr.format(v)
export const formatIDRCompact = (v: number) => `Rp ${idrCompact.format(v)}`
export const formatNumber = (v: number) => num.format(Math.round(v))
export const formatPercent = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", ...opts })
}

export function formatCell(row: Lead, col: Column): string {
  const v = getValue(row, col.key)
  if (v === undefined || v === "") return "-"
  if (col.type === "currency") return formatIDR(Number(v))
  if (col.type === "number") return formatNumber(Number(v))
  if (col.type === "date") return formatDate(String(v), { day: "numeric", month: "short", year: "numeric" })
  return String(v)
}

// CSV export of the filtered rows and the currently visible columns
export function toCSV(rows: Lead[], columns: Column[]) {
  const escape = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const header = columns.map((c) => escape(c.label)).join(",")
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const v = getValue(r, c.key)
        return escape(v === undefined ? "" : String(v))
      })
      .join(","),
  )
  return [header, ...lines].join("\n")
}

export function downloadFile(content: string, filename: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
