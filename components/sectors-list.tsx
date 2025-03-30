"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight } from "lucide-react"
import { marketplaceApi } from "@/lib/api"

type Sector = {
  id: number
  name: string
  description: string
  thumbnail: string
}

interface SectorsListProps {
  limit?: number
  showViewAll?: boolean
}

export default function SectorsList({ limit = 4, showViewAll = true }: SectorsListProps) {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const data = await marketplaceApi.getSectors()
        setSectors(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching sectors:", err)
        setError("Failed to load sectors")
        setLoading(false)
      }
    }

    fetchSectors()
  }, [])

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>
  }

  // Limit the number of sectors shown
  const displayedSectors = limit ? sectors.slice(0, limit) : sectors

  // Function to get sector image based on name (for demo purposes)
  const getSectorImage = (sectorName: string) => {
    const name = sectorName?.toLowerCase() || ""
    if (name.includes("cleaning")) return "/images/sectors/cleaning.png"
    if (name.includes("plumbing")) return "/images/sectors/plumbing.png"
    if (name.includes("electrical")) return "/images/sectors/electrical.png"
    if (name.includes("garden")) return "/images/sectors/gardening.png"
    return "/placeholder.svg?height=160&width=320"
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading
          ? Array(limit)
              .fill(null)
              .map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Skeleton className="h-40 w-full" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
          : displayedSectors.map((sector) => (
              <Link key={sector.id} href={`/marketplace/sectors/${sector.id}`}>
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover-lift">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={sector.thumbnail || "/placeholder.svg"}
                        alt={sector.name}
                        className="h-40 w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-semibold text-white">{sector.name}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">{sector.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {showViewAll && sectors.length > limit && (
        <div className="flex justify-center mt-8">
          <Link href="/marketplace/sectors">
            <Button variant="outline" className="group">
              View All Sectors
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

