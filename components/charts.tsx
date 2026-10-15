"use client"

import type React from "react"
import { motion } from "framer-motion"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatDate, formatNumber, formatPercent } from "@/lib/format"

const axisTick = { fill: "var(--muted)", fontSize: 12 }

export function ChartCard({
  title,
  subtitle,
  children,
  className = "",
  delay = 0,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}
    >
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-ink-2 mt-0.5">{subtitle}</p>}
      </header>
      {children}
    </motion.section>
  )
}

function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-lg text-xs min-w-36">
      <p className="font-semibold text-ink mb-1">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-ink-2">
            {r.color && <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="tabular font-medium text-ink">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

type TooltipProps<T> = { active?: boolean; payload?: readonly { payload?: T }[] }

/* ---------- Leads over time: single series, so no legend; title names it ---------- */

type SeriesPoint = { date: string; leads: number; converted: number }

export function LeadsOverTime({ points, bucket }: { points: SeriesPoint[]; bucket: number }) {
  // Month-only labels for the 12-month view, day + month otherwise
  const tickFormat = (d: string) =>
    formatDate(d, points.length > 20 && bucket > 1 ? { month: "short" } : { day: "numeric", month: "short" })

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="date"
            tickFormatter={tickFormat}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            minTickGap={32}
          />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
          <Tooltip
            cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
            content={(props: TooltipProps<SeriesPoint>) => {
              const p = props.active && props.payload?.[0]?.payload
              if (!p) return null
              const title =
                bucket > 1
                  ? `Week of ${formatDate(p.date, { day: "numeric", month: "short", year: "numeric" })}`
                  : formatDate(p.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
              return (
                <TooltipBox
                  title={title}
                  rows={[
                    { label: "Leads", value: formatNumber(p.leads), color: "var(--series-1)" },
                    { label: "Converted", value: formatNumber(p.converted) },
                  ]}
                />
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#leadsFill)"
            activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- Leads by channel: nominal categories, one series = one color ---------- */

type ChannelRow = { channel: string; leads: number; rate: number }

export function ChannelBars({ rows }: { rows: ChannelRow[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="channel"
            tick={{ ...axisTick, fill: "var(--ink-2)" }}
            tickLine={false}
            axisLine={false}
            width={88}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={(props: TooltipProps<ChannelRow>) => {
              const p = props.active && props.payload?.[0]?.payload
              if (!p) return null
              return (
                <TooltipBox
                  title={p.channel}
                  rows={[
                    { label: "Leads", value: formatNumber(p.leads), color: "var(--series-1)" },
                    { label: "Conversion", value: formatPercent(p.rate) },
                  ]}
                />
              )
            }}
          />
          <Bar dataKey="leads" fill="var(--series-1)" radius={[0, 4, 4, 0]} animationDuration={600}>
            <LabelList
              dataKey="leads"
              position="right"
              formatter={(v: unknown) => formatNumber(Number(v))}
              style={{ fill: "var(--ink-2)", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- Funnel: ordered stages, validated ordinal ramp ---------- */

type FunnelRow = { stage: string; count: number; share: number }
const FUNNEL_COLORS = ["var(--funnel-1)", "var(--funnel-2)", "var(--funnel-3)", "var(--funnel-4)"]

export function FunnelChart({ rows }: { rows: FunnelRow[] }) {
  const max = rows[0]?.count || 1

  return (
    <ol className="space-y-3" aria-label="Lead funnel">
      {rows.map((r, i) => {
        const stepRate = i > 0 && rows[i - 1].count ? r.count / rows[i - 1].count : null
        return (
          <li key={r.stage} className="group">
            <div className="flex items-baseline justify-between text-sm mb-1.5">
              <span className="text-ink font-medium">{r.stage}</span>
              <span className="tabular text-ink-2">
                {formatNumber(r.count)}
                <span className="text-muted"> · {formatPercent(r.share, 0)}</span>
              </span>
            </div>
            <div className="h-7 rounded-md bg-surface-2 overflow-hidden" title={`${r.stage}: ${formatNumber(r.count)} leads`}>
              <motion.div
                className="h-full rounded-r-[4px]"
                style={{ background: FUNNEL_COLORS[i] }}
                initial={{ width: 0 }}
                animate={{ width: `${(r.count / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            {stepRate !== null && (
              <p className="text-[11px] text-muted mt-1">{formatPercent(stepRate, 0)} of previous stage</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Conversion rate by city ---------- */

type CityRow = { city: string; leads: number; rate: number }

export function CityBars({ rows }: { rows: CityRow[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="city"
            tick={{ ...axisTick, fill: "var(--ink-2)" }}
            tickLine={false}
            axisLine={false}
            width={88}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={(props: TooltipProps<CityRow>) => {
              const p = props.active && props.payload?.[0]?.payload
              if (!p) return null
              return (
                <TooltipBox
                  title={p.city}
                  rows={[
                    { label: "Conversion", value: formatPercent(p.rate), color: "var(--series-1)" },
                    { label: "Leads", value: formatNumber(p.leads) },
                  ]}
                />
              )
            }}
          />
          <Bar dataKey="rate" fill="var(--series-1)" radius={[0, 4, 4, 0]} animationDuration={600}>
            {rows.map((r, i) => (
              // Highlight the best city, the rest recede
              <Cell key={r.city} fillOpacity={i === 0 ? 1 : 0.45} />
            ))}
            <LabelList
              dataKey="rate"
              position="right"
              formatter={(v: unknown) => formatPercent(Number(v))}
              style={{ fill: "var(--ink-2)", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
