import { Suspense } from "react"
import { Dashboard } from "@/components/dashboard"

export default function Page() {
  return (
    // useSearchParams needs a Suspense boundary
    <Suspense>
      <Dashboard />
    </Suspense>
  )
}
