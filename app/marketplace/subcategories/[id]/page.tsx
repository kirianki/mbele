"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, Star, MapPin } from "lucide-react"
import { marketplaceApi } from "@/lib/api"

type Subcategory = {
  id: number
  name: string
  description?: string
  sector: number
  sector_name?: string
}

type Provider = {
  id: number
  business_name: string
  user_profile_picture: string
  sector: number
  sector_name: string
  subcategory: number
  subcategory_name: string
  address: string
  average_rating?: number
  description: string
}

export default function SubcategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use React.use to unwrap the params promise
  const { id } = use(params)
  const subcategoryId = Number(id)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all subcategories to find the current one
        const subcategoriesResponse = await marketplaceApi.getSubcategories()
        const subcategoriesData = subcategoriesResponse.data || subcategoriesResponse
        const currentSubcategory = Array.isArray(subcategoriesData) 
          ? subcategoriesData.find((s: Subcategory) => s.id === subcategoryId)
          : null

        if (!currentSubcategory) {
          setError("Subcategory not found")
          setLoading(false)
          return
        }

        setSubcategory(currentSubcategory)

        // Fetch all providers and filter by subcategory
        const providersResponse = await marketplaceApi.getProviders()
        const allProviders = providersResponse.results || providersResponse.data || providersResponse
        const filteredProviders = Array.isArray(allProviders)
          ? allProviders.filter((provider: Provider) => Number(provider.subcategory) === subcategoryId)
          : []

        setProviders(filteredProviders)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching subcategory data:", err)
        setError("Failed to load subcategory data")
        setLoading(false)
      }
    }

    fetchData()
  }, [subcategoryId])

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6)
                .fill(null)
                .map((_, index) => (
                  <Skeleton key={index} className="h-64" />
                ))}
            </div>
          </>
        ) : subcategory ? (
          <>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{subcategory.name}</h1>
              <p className="text-muted-foreground">
                {subcategory.sector_name && `Category: ${subcategory.sector_name}`}
              </p>
              {subcategory.description && <p className="text-muted-foreground mt-2">{subcategory.description}</p>}
            </div>

            <h2 className="text-xl font-semibold mt-8">Service Providers</h2>

            {providers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => (
                  <Card key={provider.id} className="overflow-hidden hover-lift">
                    <CardContent className="p-0">
                      <img
                        src={provider.user_profile_picture || "/placeholder.svg?height=200&width=400"}
                        alt={provider.business_name}
                        className="h-48 w-full object-cover"
                      />
                      <div className="p-6">
                        <h3 className="text-lg font-semibold">{provider.business_name}</h3>
                        <div className="flex items-center mt-2">
                          {provider.average_rating && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-primary text-primary mr-1" />
                              <span className="text-sm font-medium">{provider.average_rating.toFixed(1)}</span>
                            </div>
                          )}
                          {provider.address && (
                            <div className="flex items-center ml-4">
                              <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground line-clamp-1">{provider.address}</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-3 text-sm line-clamp-2">{provider.description}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-6 pt-0">
                      <Link href={`/marketplace/providers/${provider.id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No providers found for this subcategory.</p>
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