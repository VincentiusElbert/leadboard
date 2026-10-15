// Deterministic, fully fictional demo data. A seeded PRNG keeps server and
// client renders identical, so there is no hydration mismatch.

export const CHANNELS = ["Instagram", "TikTok", "Google Ads", "WhatsApp", "Referral", "Organic"] as const
export const STATUSES = ["New", "Contacted", "Qualified", "Converted", "Lost"] as const
export const CITIES = ["Jakarta", "Surabaya", "Bandung", "Medan", "Denpasar", "Makassar", "Yogyakarta"] as const
export const PRODUCTS = ["Starter Plan", "Growth Plan", "Pro Plan", "Enterprise"] as const

export type Channel = (typeof CHANNELS)[number]
export type Status = (typeof STATUSES)[number]

export type Lead = {
  id: string
  createdAt: string // ISO date (yyyy-mm-dd)
  name: string
  email: string
  city: string
  channel: Channel
  product: string
  status: Status
  value: number // IDR
  responseMinutes: number
  // Free-form JSON payload, like data coming from different lead forms.
  // Keys vary per channel, columns for them are discovered at runtime.
  meta: Record<string, string | number>
}

// The demo dataset ends here, date presets are relative to this day.
export const DATA_END = "2026-09-30"
const DAYS = 730

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ["Andi", "Budi", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hadi", "Intan", "Joko", "Kartika", "Lina", "Made", "Nadia", "Oki", "Putri", "Rizky", "Sari", "Tono", "Wulan", "Yoga", "Zahra"]
const LAST = ["Pratama", "Wijaya", "Santoso", "Kusuma", "Saputra", "Lestari", "Hidayat", "Nugroho", "Halim", "Gunawan", "Siregar", "Putra"]

const CHANNEL_WEIGHTS: Record<Channel, number> = {
  Instagram: 26,
  TikTok: 20,
  "Google Ads": 18,
  WhatsApp: 15,
  Referral: 11,
  Organic: 10,
}

// Conversion chance per channel, so the charts tell a believable story
const CHANNEL_QUALITY: Record<Channel, number> = {
  Instagram: 0.9,
  TikTok: 0.75,
  "Google Ads": 1.05,
  WhatsApp: 1.2,
  Referral: 1.5,
  Organic: 1.1,
}

const PRODUCT_VALUE: Record<string, number> = {
  "Starter Plan": 1_500_000,
  "Growth Plan": 4_500_000,
  "Pro Plan": 12_000_000,
  Enterprise: 45_000_000,
}

function weighted<T extends string>(rand: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [key, w] of entries) {
    r -= w
    if (r <= 0) return key
  }
  return entries[entries.length - 1][0]
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function generateLeads(): Lead[] {
  const rand = mulberry32(20260930)
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]
  const leads: Lead[] = []
  let n = 10000

  for (let day = DAYS - 1; day >= 0; day--) {
    const date = addDays(DATA_END, -day)
    const weekday = new Date(date + "T00:00:00Z").getUTCDay()
    // Growth over time + weekend dip + noise + a campaign spike in late March (Ramadan promo)
    const growth = 1 + (DAYS - day) / DAYS
    const weekend = weekday === 0 || weekday === 6 ? 0.65 : 1
    const spike = date >= "2026-03-01" && date <= "2026-03-20" ? 1.8 : 1
    const count = Math.round((4 + rand() * 4) * growth * weekend * spike)

    for (let i = 0; i < count; i++) {
      const channel = weighted(rand, CHANNEL_WEIGHTS)
      const product = weighted(rand, { "Starter Plan": 45, "Growth Plan": 30, "Pro Plan": 18, Enterprise: 7 })
      const quality = CHANNEL_QUALITY[channel]

      // Progress through the funnel. Recent leads are more likely to still be open.
      const age = day / 30
      let status: Status = "New"
      if (rand() < Math.min(0.95, 0.75 + age * 0.6)) {
        status = "Contacted"
        if (rand() < 0.55 * quality) {
          status = "Qualified"
          if (rand() < 0.42 * quality && age > 0.3) status = "Converted"
        } else if (age > 0.5 && rand() < 0.6) {
          status = "Lost"
        }
      }

      const first = pick(FIRST)
      const last = pick(LAST)
      const meta: Record<string, string | number> = {
        device: rand() < 0.78 ? "Mobile" : "Desktop",
        age_group: pick(["18-24", "25-34", "35-44", "45+"]),
      }
      if (channel === "Instagram" || channel === "TikTok" || channel === "Google Ads") {
        meta.utm_campaign = pick(["ramadan_promo", "payday_sale", "brand_awareness", "retargeting"])
        meta.ad_set = `${channel.replace(" ", "").toLowerCase()}_${pick(["a", "b", "c"])}`
      }
      if (channel === "Referral") meta.referral_code = `REF-${Math.floor(rand() * 9000 + 1000)}`
      if (channel === "WhatsApp") meta.chatbot_flow = pick(["register", "promo_inquiry", "support"])
      if (rand() < 0.35) meta.company_size = pick(["1-10", "11-50", "51-200", "200+"])

      leads.push({
        id: `LD-${n++}`,
        createdAt: date,
        name: `${first} ${last}`,
        email: `${first[0].toLowerCase()}***@${pick(["gmail.com", "yahoo.co.id", "outlook.com"])}`,
        city: pick(CITIES),
        channel,
        product,
        status,
        value: Math.round((PRODUCT_VALUE[product] * (0.8 + rand() * 0.4)) / 10000) * 10000,
        responseMinutes: Math.round(5 + rand() * rand() * 240),
        meta,
      })
    }
  }

  return leads.reverse() // newest first
}

export const LEADS = generateLeads()
