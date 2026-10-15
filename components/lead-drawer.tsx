"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Braces, X } from "lucide-react"
import type { Lead } from "@/lib/data"
import { formatDate, formatIDR } from "@/lib/format"
import { StatusBadge } from "./status-badge"

export function LeadDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  useEffect(() => {
    if (!lead) return
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [lead, onClose])

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Lead ${lead.id}`}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface border-l border-line shadow-2xl overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="sticky top-0 bg-surface/90 backdrop-blur border-b border-line px-5 py-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted tabular">{lead.id}</p>
                <h2 className="text-lg font-semibold text-ink">{lead.name}</h2>
                <div className="mt-2">
                  <StatusBadge status={lead.status} />
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <motion.dl
              className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-4"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } } }}
            >
              {[
                ["Created", formatDate(lead.createdAt, { day: "numeric", month: "long", year: "numeric" })],
                ["Email", lead.email],
                ["City", lead.city],
                ["Channel", lead.channel],
                ["Product", lead.product],
                ["Deal value", formatIDR(lead.value)],
                ["First response", `${lead.responseMinutes} min`],
              ].map(([label, value]) => (
                <motion.div key={label} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="text-sm text-ink mt-0.5 break-words">{value}</dd>
                </motion.div>
              ))}
            </motion.dl>

            <div className="px-5 pb-6">
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink-2 mb-2">
                <Braces className="w-3.5 h-3.5 text-accent" /> Raw JSON payload
              </p>
              <pre className="text-xs leading-relaxed rounded-lg bg-surface-2 border border-line p-3 overflow-x-auto text-ink-2">
                {JSON.stringify(lead.meta, null, 2)}
              </pre>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
