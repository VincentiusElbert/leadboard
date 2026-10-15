import { addDays, CHANNELS, CITIES, DATA_END, type Lead, type Status } from "./data"

export type RangeKey = "7d" | "30d" | "90d" | "12m"

export const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "12m", label: "12M", days: 365 },
]

export type Filters = {
  range: RangeKey
  channels: string[]
  statuses: string[]
  city: string // "" = all
  search: string
}

export const DEFAULT_FILTERS: Filters = { range: "90d", channels: [], statuses: [], city: "", search: "" }

export function rangeBounds(range: RangeKey, offsetPeriods = 0) {
  const days = RANGES.find((r) => r.key === range)!.days
  const end = addDays(DATA_END, -days * offsetPeriods)
  const start = addDays(end, -(days - 1))
  return { start, end, days }
}

export function matchesDimensions(lead: Lead, f: Filters) {
  if (f.channels.length && !f.channels.includes(lead.channel)) return false
  if (f.statuses.length && !f.statuses.includes(lead.status)) return false
  if (f.city && lead.city !== f.city) return false
  if (f.search) {
    const q = f.search.toLowerCase()
    const hay = `${lead.id} ${lead.name} ${lead.email} ${lead.product} ${Object.values(lead.meta).join(" ")}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

export function filterLeads(leads: Lead[], f: Filters, offsetPeriods = 0) {
  const { start, end } = rangeBounds(f.range, offsetPeriods)
  return leads.filter((l) => l.createdAt >= start && l.createdAt <= end && matchesDimensions(l, f))
}

export type Kpis = {
  leads: number
  qualified: number
  conversionRate: number
  revenue: number
  avgResponse: number
}

const REACHED_QUALIFIED: Status[] = ["Qualified", "Converted"]

export function computeKpis(rows: Lead[]): Kpis {
  const converted = rows.filter((r) => r.status === "Converted")
  return {
    leads: rows.length,
    qualified: rows.filter((r) => REACHED_QUALIFIED.includes(r.status)).length,
    conversionRate: rows.length ? converted.length / rows.length : 0,
    revenue: converted.reduce((s, r) => s + r.value, 0),
    avgResponse: rows.length ? rows.reduce((s, r) => s + r.responseMinutes, 0) / rows.length : 0,
  }
}

// Bucket by day for short ranges, by week for long ones. Weeks are aligned to the
// range end, so the latest bucket is always complete (no misleading drop at the end).
export function timeSeries(rows: Lead[], range: RangeKey) {
  const { end, days } = rangeBounds(range)
  const bucket = days > 30 ? 7 : 1
  const count = Math.floor(days / bucket)
  const start = addDays(end, -(count * bucket - 1))
  const buckets: { date: string; leads: number; converted: number }[] = []
  for (let i = 0; i < count; i++) buckets.push({ date: addDays(start, i * bucket), leads: 0, converted: 0 })

  const startMs = Date.parse(start)
  for (const r of rows) {
    if (r.createdAt < start) continue
    const idx = Math.floor((Date.parse(r.createdAt) - startMs) / 86_400_000 / bucket)
    const b = buckets[idx]
    if (!b) continue
    b.leads++
    if (r.status === "Converted") b.converted++
  }
  return { points: buckets, bucket }
}

export function byChannel(rows: Lead[]) {
  return CHANNELS.map((channel) => {
    const subset = rows.filter((r) => r.channel === channel)
    const converted = subset.filter((r) => r.status === "Converted").length
    return { channel, leads: subset.length, rate: subset.length ? converted / subset.length : 0 }
  })
    .filter((c) => c.leads > 0)
    .sort((a, b) => b.leads - a.leads)
}

export function byCity(rows: Lead[]) {
  return CITIES.map((city) => {
    const subset = rows.filter((r) => r.city === city)
    const converted = subset.filter((r) => r.status === "Converted").length
    return { city, leads: subset.length, rate: subset.length ? converted / subset.length : 0 }
  }).sort((a, b) => b.rate - a.rate)
}

// Cumulative funnel: how many leads reached at least each stage
export function funnel(rows: Lead[]) {
  const reached = (stages: Status[]) => rows.filter((r) => stages.includes(r.status)).length
  const total = rows.length
  const stages = [
    { stage: "New", count: total },
    { stage: "Contacted", count: reached(["Contacted", "Qualified", "Converted", "Lost"]) },
    { stage: "Qualified", count: reached(["Qualified", "Converted"]) },
    { stage: "Converted", count: reached(["Converted"]) },
  ]
  return stages.map((s) => ({ ...s, share: total ? s.count / total : 0 }))
}

export function sparkline(leads: Lead[], f: Filters, metric: (rows: Lead[]) => number, points = 12) {
  const { start, days } = rangeBounds(f.range)
  const size = Math.max(1, Math.floor(days / points))
  const base = leads.filter(
    (l) => l.createdAt >= start && l.createdAt <= DATA_END && matchesDimensions(l, f),
  )
  const out: number[] = []
  for (let i = 0; i < points; i++) {
    const s = addDays(start, i * size)
    const e = addDays(s, size - 1)
    out.push(metric(base.filter((l) => l.createdAt >= s && l.createdAt <= e)))
  }
  return out
}
