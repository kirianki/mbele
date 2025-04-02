"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, MapPin, ArrowRight } from "lucide-react"
import { marketplaceApi } from "@/lib/api"

type Provider = {
  id: number
  business_name: string
  user_profile_picture: string
  distance?: string
  average_rating?: number
  sector_name?: string
  subcategory_name?: string
}

export default function FeaturedProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true)
        // Get user's location if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              const data = await marketplaceApi.getFeaturedProviders(latitude, longitude, 50)
              setProviders(data)
              setLoading(false)
            },
            async (error) => {
              console.error("Geolocation error:", error)
              // Fallback to non-location based featured providers
              const data = await marketplaceApi.getFeaturedProviders()
              setProviders(data)
              setLoading(false)
            },
          )
        } else {
          // Fallback for browsers without geolocation
          const data = await marketplaceApi.getFeaturedProviders()
          setProviders(data)
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching featured providers:", err)
        setError("Failed to load featured providers")
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setLoading(true)
            setError(null)
            marketplaceApi
              .getFeaturedProviders()
              .then((data) => {
                setProviders(data)
                setLoading(false)
              })
              .catch((err) => {
                console.error("Error retrying:", err)
                setError("Failed to load featured providers")
                setLoading(false)
              })
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {loading
        ? Array(3)
            .fill(null)
            .map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between p-6 pt-0">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
        : providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover-lift">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={provider.user_profile_picture || "/placeholder.svg?height=200&width=400"}
                    alt={provider.business_name}
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center bg-white/90 rounded-full px-2 py-1">
                    {provider.average_rating && (
                      <>
                        <Star className="h-3 w-3 fill-primary text-primary mr-1" />
                        <span className="text-xs font-medium">{provider.average_rating.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{provider.business_name}</h3>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    {provider.sector_name && provider.subcategory_name && (
                      <span>
                        {provider.sector_name} • {provider.subcategory_name}
                      </span>
                    )}
                  </div>
                  {provider.distance && (
                    <div className="flex items-center mt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">{provider.distance}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-6 pt-0">
                <Link href={`/marketplace/providers/${provider.id}`} className="w-full">
                  <Button variant="outline" className="w-full group">
                    View Profile
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
    </div>
  )
}

