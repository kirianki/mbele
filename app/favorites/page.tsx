"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, MapPin, Trash2, MessageSquare, Calendar, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { transactionsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

type Favorite = {
  id: number
  provider: number
  provider_name: string
  provider_sector: string
  provider_subcategory: string
  provider_address?: string
  provider_rating?: number
}

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }

    if (user) {
      fetchFavorites()
    }
  }, [user, authLoading, router])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const data = await transactionsApi.getFavorites()
      setFavorites(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching favorites:", err)
      setError("Failed to load favorites")
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: number) => {
    try {
      await transactionsApi.removeFavorite(favoriteId)
      setFavorites(favorites.filter((fav) => fav.id !== favoriteId))
      toast({
        title: "Removed from favorites",
        description: "Provider has been removed from your favorites",
      })
    } catch (err) {
      console.error("Error removing favorite:", err)
      toast({
        title: "Action failed",
        description: "There was an error removing this provider from your favorites",
        variant: "destructive",
      })
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container py-10">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
          <p className="text-muted-foreground">Quick access to your saved service providers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Favorite Providers</CardTitle>
            <CardDescription>Service providers you've saved for quick access</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array(3)
                  .fill(null)
                  .map((_, index) => (
                    <Skeleton key={index} className="h-24" />
                  ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchFavorites}>Retry</Button>
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No favorites yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  You haven't added any service providers to your favorites
                </p>
                <Button onClick={() => router.push("/marketplace")}>Discover Providers</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map((favorite) => (
                  <Card key={favorite.id} className="overflow-hidden hover-lift">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{favorite.provider_name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>
                              {favorite.provider_sector} • {favorite.provider_subcategory}
                            </span>
                          </div>
                          {favorite.provider_address && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{favorite.provider_address}</span>
                            </div>
                          )}
                          {favorite.provider_rating && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-primary text-primary mr-1" />
                              <span className="text-sm font-medium">{favorite.provider_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 items-start">
                          <Link href={`/marketplace/providers/${favorite.provider}`}>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                          <Link href={`/messages/${favorite.provider}`}>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" /> Message
                            </Button>
                          </Link>
                          <Link href={`/bookings/new?provider=${favorite.provider}`}>
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-1" /> Book
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeFavorite(favorite.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="pt-4 text-center">
                  <Button variant="outline" className="w-full" onClick={() => router.push("/marketplace")}>
                    Find More Providers <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

