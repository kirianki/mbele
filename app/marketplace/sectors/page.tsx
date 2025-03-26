import type { Metadata } from "next"
import SectorsList from "@/components/sectors-list"

export const metadata: Metadata = {
  title: "All Sectors | Service Platform",
  description: "Browse all service sectors available on our platform",
}

export default function AllSectorsPage() {
  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Sectors</h1>
          <p className="text-muted-foreground">Browse all service categories available on our platform</p>
        </div>

        <SectorsList limit={0} showViewAll={false} />
      </div>
    </div>
  )
}

