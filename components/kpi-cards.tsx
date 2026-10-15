"use client"

import { useEffect, useRef } from "react"
import { animate, motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { Kpis } from "@/lib/analytics"
import { formatIDRCompact, formatNumber, formatPercent } from "@/lib/format"

type Card = {
  key: keyof Kpis
  label: string
  format: (v: number) => string
  lowerIsBetter?: boolean
}

const CARDS: Card[] = [
  { key: "leads", label: "Total leads", format: formatNumber },
  { key: "qualified", label: "Qualified leads", format: formatNumber },
  { key: "conversionRate", label: "Conversion rate", format: (v) => formatPercent(v) },
  { key: "revenue", label: "Converted value", format: formatIDRCompact },
  { key: "avgResponse", label: "Avg. first response", format: (v) => `${Math.round(v)} min`, lowerIsBetter: true },
]

export function KpiCards({
  current,
  previous,
  sparks,
  periodLabel,
}: {
  current: Kpis
  previous: Kpis
  sparks: Record<keyof Kpis, number[]>
  periodLabel: string
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {CARDS.map((card, i) => {
        const value = current[card.key]
        const prev = previous[card.key]
        const change = prev ? (value - prev) / prev : 0
        const good = card.lowerIsBetter ? change < 0 : change > 0
        const flat = Math.abs(change) < 0.005

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border border-line bg-surface p-4 ${i === 4 ? "col-span-2 lg:col-span-1" : ""}`}
          >
            <p className="text-xs font-medium text-ink-2">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              <AnimatedNumber value={value} format={card.format} />
            </p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  flat ? "text-muted" : good ? "text-good-ink" : "text-critical"
                }`}
                title={`Compared with the previous ${periodLabel}`}
              >
                {flat ? (
                  <Minus className="w-3.5 h-3.5" />
                ) : change > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {flat ? "No change" : formatPercent(Math.abs(change))}
                <span className="text-muted font-normal hidden sm:inline">vs prev.</span>
              </span>
              <Sparkline values={sparks[card.key]} label={`${card.label} trend`} />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(value)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(from.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => (node.textContent = format(v)),
    })
    from.current = value
    return () => controls.stop()
  }, [value, format])

  return (
    <span ref={ref} className="tabular">
      {format(value)}
    </span>
  )
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 72
  const h = 24
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 4)])
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")

  return (
    <svg width={w} height={h} role="img" aria-label={label} className="flex-shrink-0 overflow-visible">
      <motion.path
        d={d}
        fill="none"
        stroke="var(--series-1)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, d }}
        transition={{ duration: 0.8 }}
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill="var(--series-1)" />
    </svg>
  )
}
