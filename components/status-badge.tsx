import { CheckCircle2, Circle, CircleDot, PhoneCall, XCircle } from "lucide-react"
import type { Status } from "@/lib/data"

// Status always ships icon + label, color is never the only signal
const STYLES: Record<Status, { icon: typeof Circle; className: string }> = {
  New: { icon: Circle, className: "text-ink-2 bg-surface-2" },
  Contacted: { icon: PhoneCall, className: "text-ink-2 bg-surface-2" },
  Qualified: { icon: CircleDot, className: "text-accent bg-accent/10" },
  Converted: { icon: CheckCircle2, className: "text-good-ink bg-good/10" },
  Lost: { icon: XCircle, className: "text-critical bg-critical/10" },
}

export function StatusBadge({ status }: { status: Status }) {
  const { icon: Icon, className } = STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  )
}
