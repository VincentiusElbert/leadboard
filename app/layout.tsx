import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Leadboard - Lead Analytics Dashboard",
  description:
    "A lead analytics dashboard demo built with Next.js, TypeScript, Tailwind CSS, Recharts and Framer Motion. Fictional demo data.",
}

// Applies the saved theme before first paint, so there is no light/dark flash
const themeScript = `try{var t=localStorage.getItem("leadboard-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
