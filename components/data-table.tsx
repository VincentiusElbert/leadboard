"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, Reorder } from "framer-motion"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Braces,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  GripVertical,
  SearchX,
} from "lucide-react"
import type { Lead, Status } from "@/lib/data"
import { DEFAULT_VISIBLE, getValue, type Column } from "@/lib/columns"
import { downloadFile, formatCell, toCSV } from "@/lib/format"
import { StatusBadge } from "./status-badge"

const STORAGE_KEY = "leadboard-columns"
const PAGE_SIZES = [10, 25, 50]

type Sort = { key: string; dir: "asc" | "desc" }

export function DataTable({
  rows,
  columns,
  onOpenLead,
}: {
  rows: Lead[]
  columns: Column[]
  onOpenLead: (lead: Lead) => void
}) {
  // Column order + visibility, saved per browser
  const [order, setOrder] = useState<string[]>(() => columns.map((c) => c.key))
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE)
  const [sort, setSort] = useState<Sort>({ key: "createdAt", dir: "desc" })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
      if (saved?.order && saved?.visible) {
        const known = new Set(columns.map((c) => c.key))
        const savedOrder = (saved.order as string[]).filter((k) => known.has(k))
        const missing = columns.map((c) => c.key).filter((k) => !savedOrder.includes(k))
        setOrder([...savedOrder, ...missing])
        setVisible((saved.visible as string[]).filter((k) => known.has(k)))
      }
    } catch {
      // storage unavailable, keep defaults
    }
  }, [columns])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ order, visible }))
    } catch {
      // ignore
    }
  }, [order, visible])

  useEffect(() => setPage(0), [rows, pageSize])

  const byKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns])
  const shown = order.filter((k) => visible.includes(k)).map((k) => byKey.get(k)!).filter(Boolean)

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = getValue(a, sort.key)
      const bv = getValue(b, sort.key)
      if (av === undefined) return 1
      if (bv === undefined) return -1
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === "asc" ? cmp : -cmp
    })
    return copy
  }, [rows, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize)

  const toggleSort = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }))

  const exportCsv = () => downloadFile(toCSV(sorted, shown), `leads-export-${new Date().toISOString().slice(0, 10)}.csv`)

  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-line">
        <div>
          <h2 className="text-sm font-semibold text-ink">Leads</h2>
          <p className="text-xs text-ink-2 mt-0.5">
            <span className="tabular">{sorted.length.toLocaleString("en-US")}</span> leads match your filters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnPicker
            columns={columns}
            order={order}
            setOrder={setOrder}
            visible={visible}
            setVisible={setVisible}
            open={pickerOpen}
            setOpen={setPickerOpen}
          />
          <button
            onClick={exportCsv}
            disabled={!sorted.length}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-accent text-accent-ink text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {shown.map((col) => {
                const active = sort.key === col.key
                const numeric = col.type === "number" || col.type === "currency"
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    className={`px-4 py-2.5 font-medium text-xs text-ink-2 whitespace-nowrap ${numeric ? "text-right" : "text-left"}`}
                  >
                    <button
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-ink ${active ? "text-ink" : ""}`}
                    >
                      {col.source === "json" && <Braces className="w-3 h-3 text-accent" aria-label="JSON field" />}
                      {col.label}
                      {active ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onOpenLead(row)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenLead(row)}
                tabIndex={0}
                className="border-b border-line last:border-0 hover:bg-surface-2 focus:bg-surface-2 focus:outline-none cursor-pointer"
              >
                {shown.map((col) => {
                  const numeric = col.type === "number" || col.type === "currency"
                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3 whitespace-nowrap ${numeric ? "text-right tabular" : ""} ${
                        col.key === "name" ? "text-ink font-medium" : "text-ink-2"
                      }`}
                    >
                      {col.type === "status" ? <StatusBadge status={row.status as Status} /> : formatCell(row, col)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {!pageRows.length && (
          <div className="py-16 flex flex-col items-center text-center px-4">
            <SearchX className="w-8 h-8 text-muted mb-3" />
            <p className="text-ink font-medium">No leads match these filters</p>
            <p className="text-ink-2 text-sm mt-1">Try a longer date range or clear some filters.</p>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-line text-xs text-ink-2">
        <label className="flex items-center gap-2">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-7 px-2 rounded-md border border-line bg-surface text-ink"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <span className="tabular">
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className="w-7 h-7 rounded-md border border-line flex items-center justify-center hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              aria-label="Next page"
              className="w-7 h-7 rounded-md border border-line flex items-center justify-center hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>
    </section>
  )
}

function ColumnPicker({
  columns,
  order,
  setOrder,
  visible,
  setVisible,
  open,
  setOpen,
}: {
  columns: Column[]
  order: string[]
  setOrder: (o: string[]) => void
  visible: string[]
  setVisible: (v: string[]) => void
  open: boolean
  setOpen: (o: boolean) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const byKey = new Map(columns.map((c) => [c.key, c]))
  const jsonCount = columns.filter((c) => c.source === "json").length

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
  }, [open, setOpen])

  const toggle = (key: string) =>
    setVisible(visible.includes(key) ? (visible.length > 1 ? visible.filter((k) => k !== key) : visible) : [...visible, key])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-line text-sm text-ink hover:bg-surface-2"
      >
        <Columns3 className="w-4 h-4" /> Columns
        <span className="text-xs text-muted tabular">
          {visible.length}/{columns.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-line bg-surface shadow-xl origin-top-right"
          >
            <div className="px-3 pt-3 pb-2 border-b border-line">
              <p className="text-sm font-semibold text-ink">Customize columns</p>
              <p className="text-xs text-ink-2 mt-0.5">
                Drag to reorder. <Braces className="inline w-3 h-3 text-accent" /> {jsonCount} columns were discovered
                from the leads' JSON data.
              </p>
            </div>
            <Reorder.Group axis="y" values={order} onReorder={setOrder} className="max-h-80 overflow-y-auto p-1.5">
              {order.map((key) => {
                const col = byKey.get(key)
                if (!col) return null
                const checked = visible.includes(key)
                return (
                  <Reorder.Item
                    key={key}
                    value={key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface hover:bg-surface-2 select-none"
                    whileDrag={{ scale: 1.03, boxShadow: "0 8px 20px rgba(0,0,0,0.25)" }}
                  >
                    <GripVertical className="w-4 h-4 text-muted cursor-grab active:cursor-grabbing flex-shrink-0" />
                    <label className="flex flex-1 items-center gap-2 text-sm text-ink cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(key)}
                        className="accent-[var(--accent)] w-4 h-4"
                      />
                      <span className="truncate">{col.label}</span>
                    </label>
                    {col.source === "json" && (
                      <span className="text-[10px] text-muted tabular flex-shrink-0" title="Share of leads with this field">
                        {Math.round(col.coverage * 100)}%
                      </span>
                    )}
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
