# Leadboard

A lead analytics dashboard built with Next.js, TypeScript, Tailwind CSS, Recharts and Framer Motion.

All data is fictional and generated in the browser from a seeded random generator. No real customer data is used.

## Features

- **KPI cards** with animated values, change vs. the previous period, and sparklines
- **Charts:** leads over time (with a crosshair tooltip), conversion funnel, leads by channel, and conversion rate by city
- **Filters** for date range, channel, status, city and free-text search, synced to the URL so any view can be shared as a link
- **Data table** with sorting, pagination and CSV export
- **Columns discovered from JSON:** each lead carries a free-form JSON payload. Its keys are scanned at runtime and turned into typed columns you can show, hide and drag to reorder. Your layout is saved in the browser.
- **Lead detail drawer** that shows the raw JSON payload
- **Light and dark themes**, with chart colors validated for color-blind safety and contrast in both
- **Accessible:** keyboard-navigable rows, status shown with icon + label (never color alone), and respects reduced motion

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project structure

```
app/            layout, page, global styles and theme tokens
components/     dashboard, filters, KPI cards, charts, table, drawer
lib/data.ts     seeded demo data generator
lib/columns.ts  column discovery from JSON payloads
lib/analytics.ts filtering, KPIs and aggregations
lib/format.ts   number, currency, date formatting and CSV export
```
