"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BarChart3, Info } from "lucide-react"
import {
  byChannel,
  byCity,
  computeKpis,
  DEFAULT_FILTERS,
  filterLeads,
  funnel,
  RANGES,
  rangeBounds,
  sparkline,
  timeSeries,
  type Filters,
  type Kpis,
  type RangeKey,
} from "@/lib/analytics"
import { discoverColumns } from "@/lib/columns"
import { LEADS, type Lead } from "@/lib/data"
import { formatDate } from "@/lib/format"
import { FiltersBar } from "./filters-bar"
import { KpiCards } from "./kpi-cards"
import { ChannelBars, ChartCard, CityBars, FunnelChart, LeadsOverTime } from "./charts"
import { DataTable } from "./data-table"
import { LeadDrawer } from "./lead-drawer"
import { ThemeToggle } from "./theme-toggle"

const COLUMNS = discoverColumns(LEADS)

// Filters live in the URL, so any filtered view can be shared as a link
function readFilters(params: URLSearchParams): Filters {
  const range = params.get("range") as RangeKey | null
  const list = (k: string) => params.get(k)?.split(",").filter(Boolean) ?? []
  return {
    range: range && RANGES.some((r) => r.key === range) ? range : DEFAULT_FILTERS.range,
    channels: list("channel"),
    statuses: list("status"),
    city: params.get("city") ?? "",
    search: params.get("q") ?? "",
  }
}

function writeFilters(f: Filters) {
  const p = new URLSearchParams()
  if (f.range !== DEFAULT_FILTERS.range) p.set("range", f.range)
  if (f.channels.length) p.set("channel", f.channels.join(","))
  if (f.statuses.length) p.set("status", f.statuses.join(","))
  if (f.city) p.set("city", f.city)
  if (f.search) p.set("q", f.search)
  return p.toString()
}

export function Dashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [filters, setFilters] = useState<Filters>(() => readFilters(new URLSearchParams(params.toString())))
  const [openLead, setOpenLead] = useState<Lead | null>(null)

  const update = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch }
      setFilters(next)
      const qs = writeFilters(next)
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [filters, router, pathname],
  )

  const reset = useCallback(() => update(DEFAULT_FILTERS), [update])
  const closeLead = useCallback(() => setOpenLead(null), [])

  const data = useMemo(() => {
    const rows = filterLeads(LEADS, filters)
    const prevRows = filterLeads(LEADS, filters, 1)
    const metric = (key: keyof Kpis) => (r: Lead[]) => computeKpis(r)[key]
    const keys: (keyof Kpis)[] = ["leads", "qualified", "conversionRate", "revenue", "avgResponse"]
    return {
      rows,
      kpis: computeKpis(rows),
      prevKpis: computeKpis(prevRows),
      sparks: Object.fromEntries(keys.map((k) => [k, sparkline(LEADS, filters, metric(k))])) as Record<keyof Kpis, number[]>,
      series: timeSeries(rows, filters.range),
      channels: byChannel(rows),
      cities: byCity(rows),
      funnel: funnel(rows),
    }
  }, [filters])

  const { start, end, days } = rangeBounds(filters.range)
  const rangeLabel = `${formatDate(start, { day: "numeric", month: "short", year: "numeric" })} – ${formatDate(end, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`
  const isDirty = writeFilters(filters) !== ""

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-page/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-accent-ink" />
            </div>
            <span className="font-semibold text-ink">Leadboard</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full border border-line text-ink-2">Demo</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Lead analytics</h1>
            <p className="text-sm text-ink-2 mt-1 tabular">{rangeLabel}</p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Info className="w-3.5 h-3.5" /> All data is fictional and generated for this demo.
          </p>
        </div>

        <FiltersBar filters={filters} onChange={update} onReset={reset} isDirty={isDirty} />

        <KpiCards current={data.kpis} previous={data.prevKpis} sparks={data.sparks} periodLabel={`${days} days`} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <ChartCard
            title="Leads over time"
            subtitle={data.series.bucket > 1 ? "Weekly totals" : "Daily totals"}
            className="lg:col-span-2"
            delay={0.1}
          >
            <LeadsOverTime points={data.series.points} bucket={data.series.bucket} />
          </ChartCard>
          <ChartCard title="Conversion funnel" subtitle="Leads that reached each stage" delay={0.15}>
            <FunnelChart rows={data.funnel} />
          </ChartCard>
          <ChartCard title="Leads by channel" subtitle="Where leads come from" delay={0.2}>
            <ChannelBars rows={data.channels} />
          </ChartCard>
          <ChartCard
            title="Conversion rate by city"
            subtitle="Best-performing city highlighted"
            className="lg:col-span-2"
            delay={0.25}
          >
            <CityBars rows={data.cities} />
          </ChartCard>
        </div>

        <DataTable rows={data.rows} columns={COLUMNS} onOpenLead={setOpenLead} />

        <footer className="pt-4 pb-8 text-center text-xs text-muted">
          Built by Vincentius Elbert with Next.js, TypeScript, Tailwind CSS, Recharts and Framer Motion.
        </footer>
      </main>

      <LeadDrawer lead={openLead} onClose={closeLead} />
    </div>
  )
}
