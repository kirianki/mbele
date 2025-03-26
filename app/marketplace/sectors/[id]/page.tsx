"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft } from "lucide-react"
import { marketplaceApi } from "@/lib/api"

type Sector = {
  id: number
  name: string
  description: string
}

type Subcategory = {
  id: number
  name: string
  description?: string
  sector: number
}

export default function SectorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [sector, setSector] = useState<Sector | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use React.use to unwrap the params promise
  const { id } = use(params)
  const sectorId = Number(id)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all sectors to find the current one
        const sectorsData = await marketplaceApi.getSectors()
        const currentSector = sectorsData.find((s: Sector) => s.id === sectorId)

        if (!currentSector) {
          setError("Sector not found")
          setLoading(false)
          return
        }

        setSector(currentSector)

        // Fetch all subcategories and filter by sector
        const allSubcategories = await marketplaceApi.getSubcategories()
        const filteredSubcategories = allSubcategories.filter((sub: Subcategory) => sub.sector === sectorId)

        setSubcategories(filteredSubcategories)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching sector data:", err)
        setError("Failed to load sector data")
        setLoading(false)
      }
    }

    fetchData()
  }, [sectorId])

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  // Function to get sector image based on name (for demo purposes)
  const getSectorImage = (sectorName: string) => {
    const name = sectorName.toLowerCase()
    if (name.includes("cleaning")) return "/images/sectors/cleaning.png"
    if (name.includes("plumbing")) return "/images/sectors/plumbing.png"
    if (name.includes("electrical")) return "/images/sectors/electrical.png"
    if (name.includes("garden")) return "/images/sectors/gardening.png"
    return "/placeholder.svg?height=160&width=320"
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {loading ? (
          <>
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(4)
                .fill(null)
                .map((_, index) => (
                  <Skeleton key={index} className="h-40" />
                ))}
            </div>
          </>
        ) : sector ? (
          <>
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="md:w-1/3">
                <img
                  src={getSectorImage(sector.name) || "/placeholder.svg"}
                  alt={sector.name}
                  className="rounded-lg w-full h-48 object-cover"
                />
              </div>
              <div className="md:w-2/3">
                <h1 className="text-3xl font-bold tracking-tight">{sector.name}</h1>
                <p className="text-muted-foreground mt-2">{sector.description}</p>
              </div>
            </div>

            {subcategories.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold mt-8">Subcategories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {subcategories.map((subcategory) => (
                    <Link key={subcategory.id} href={`/marketplace/subcategories/${subcategory.id}`}>
                      <Card className="hover-lift">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg mb-2">{subcategory.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {subcategory.description || `Browse providers in ${subcategory.name}`}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No subcategories found for this sector.</p>
                <Button className="mt-4" onClick={() => router.push("/marketplace")}>
                  Browse Marketplace
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

