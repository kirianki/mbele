"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, MapPin, Phone, Globe, MessageSquare, Calendar, Heart, Image as ImageIcon, ChevronLeft, ChevronRight, X, Video } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { marketplaceApi, transactionsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

type Provider = {
  id: number
  user_id: number
  user_username: string
  business_name: string
  user_profile_picture: string
  address: string
  location: any
  sector: number
  sector_name: string
  subcategory: number
  subcategory_name: string
  description: string
  website: string
  county: string
  subcounty: string
  town: string
  is_verified: boolean
  membership_tier: string
  portfolio_media: Array<{
    id: number
    media_type: string
    file: string
    caption: string
    uploaded_at: string
  }>
  average_rating: number
}

type Review = {
  id: number
  provider: number
  provider_name: string
  client: number
  client_username: string
  rating: number
  comment: string
  created_at: string
  is_approved: boolean
  provider_response?: string
}

export default function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favorites, setFavorites] = useState<any[]>([])
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState("")
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false)

  // Unwrap params (assumed not to be a promise in actual usage)
  const { id } = use(params)
  const providerId = Number.parseInt(id)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [providerData, reviewsData] = await Promise.all([
          marketplaceApi.getProviderById(providerId),
          marketplaceApi.getReviews(providerId),
        ])

        setProvider(providerData)
        setReviews(reviewsData)

        if (user) {
          const favoritesData = await transactionsApi.getFavorites()
          setFavorites(favoritesData)
          setIsFavorite(favoritesData.some((fav: any) => fav.provider === providerId))
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching provider data:", err)
        setError("Failed to load provider data")
        setLoading(false)
      }
    }

    fetchData()
  }, [providerId, user])

  const getFullImageUrl = (filePath: string) => {
    if (!filePath) return "/placeholder.svg"
    if (filePath.startsWith('http')) return filePath
    return `${process.env.NEXT_PUBLIC_API_URL}${filePath}`
  }

  const openSlideshow = (index: number) => {
    setCurrentSlideIndex(index)
    setIsSlideshowOpen(true)
  }

  const closeSlideshow = () => {
    setIsSlideshowOpen(false)
  }

  const goToPreviousSlide = () => {
    if (!provider) return
    setCurrentSlideIndex(prev =>
      prev === 0 ? provider.portfolio_media.length - 1 : prev - 1
    )
  }

  const goToNextSlide = () => {
    if (!provider) return
    setCurrentSlideIndex(prev =>
      prev === provider.portfolio_media.length - 1 ? 0 : prev + 1
    )
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isSlideshowOpen || !provider) return;
    
    // Don't navigate if a video is playing and has focus
    const currentMedia = provider.portfolio_media[currentSlideIndex];
    if (currentMedia.media_type === 'video') {
      const videoElement = document.querySelector('video');
      if (videoElement && document.activeElement === videoElement) {
        return;
      }
    }

    switch (e.key) {
      case 'ArrowLeft':
        goToPreviousSlide();
        break;
      case 'ArrowRight':
        goToNextSlide();
        break;
      case 'Escape':
        closeSlideshow();
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSlideshowOpen, currentSlideIndex, provider])

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save providers to your favorites",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    try {
      if (isFavorite) {
        const favorite = favorites.find((fav: any) => fav.provider === providerId)
        if (favorite) {
          await transactionsApi.removeFavorite(favorite.id)
          setIsFavorite(false)
          toast({
            title: "Removed from favorites",
            description: "Provider has been removed from your favorites",
          })
        }
      } else {
        await transactionsApi.addFavorite(providerId)
        setIsFavorite(true)
        toast({
          title: "Added to favorites",
          description: "Provider has been added to your favorites",
        })
      }
    } catch (err) {
      console.error("Error toggling favorite:", err)
      toast({
        title: "Action failed",
        description: "There was an error processing your request",
        variant: "destructive",
      })
    }
  }

  const handleBooking = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book services",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    router.push(`/bookings/new?provider=${providerId}`)
  }

  const handleMessage = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to send messages",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    router.push(`/messages/${provider?.user_id}`)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to leave a review",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }
    try {
      const createdReview = await marketplaceApi.createReview({
        provider: providerId,
        rating: newRating,
        comment: newComment,
      })
      setReviews([createdReview, ...reviews])
      setNewRating(5)
      setNewComment("")
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully",
      })
    } catch (err) {
      console.error("Error creating review:", err)
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null)
              setLoading(true)
              marketplaceApi
                .getProviderById(providerId)
                .then((data) => {
                  setProvider(data)
                  setLoading(false)
                })
                .catch((err) => {
                  console.error("Error retrying:", err)
                  setError("Failed to load provider data")
                  setLoading(false)
                })
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        {loading ? (
          <>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
              <div className="md:w-2/3 space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </>
        ) : provider ? (
          <>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img
                  src={getFullImageUrl(provider.user_profile_picture) || "/placeholder.svg?height=200&width=400"}
                  alt={provider.business_name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div className="md:w-2/3">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{provider.business_name}</h1>
                    <p className="text-muted-foreground">
                      {provider.sector_name} • {provider.subcategory_name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    className={isFavorite ? "text-red-500" : ""}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                </div>

                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-primary text-primary mr-1" />
                    <span className="font-medium">{provider.average_rating?.toFixed(1) || "New"}</span>
                    <span className="text-muted-foreground ml-1">
                      ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                  {provider.is_verified && (
                    <div className="ml-4 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                      Verified
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                    <span>{provider.address}</span>
                  </div>
                  {provider.website && (
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                      <a
                        href={provider.website.startsWith("http") ? provider.website : `https://${provider.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {provider.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  <Button onClick={handleBooking}>
                    <Calendar className="mr-2 h-4 w-4" /> Book Service
                  </Button>
                  <Button variant="outline" onClick={handleMessage}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                  </Button>
                  <Button variant="secondary">
                    <Phone className="mr-2 h-4 w-4" /> Contact
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="about" className="mt-8">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>About {provider.business_name}</CardTitle>
                    <CardDescription>Learn more about this service provider</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p>{provider.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2">Location</h3>
                        <ul className="space-y-1">
                          <li>
                            <span className="text-muted-foreground">County:</span> {provider.county}
                          </li>
                          <li>
                            <span className="text-muted-foreground">Sub-county:</span> {provider.subcounty}
                          </li>
                          <li>
                            <span className="text-muted-foreground">Town:</span> {provider.town}
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Membership</h3>
                        <p>
                          <span className="text-muted-foreground">Tier:</span> {provider.membership_tier || "Standard"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Member since:</span> January 2023
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="reviews" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                    <CardDescription>See what others are saying about this provider</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No reviews yet</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b pb-6 last:border-0">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarFallback>{review.client_username[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{review.client_username}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex">
                                {Array(5)
                                  .fill(null)
                                  .map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating ? "fill-primary text-primary" : "text-muted"
                                      }`}
                                    />
                                  ))}
                              </div>
                            </div>
                            <p className="mt-3">{review.comment}</p>
                            {review.provider_response && (
                              <div className="mt-3 bg-muted p-3 rounded-md">
                                <p className="text-sm font-medium">Response from {provider.business_name}</p>
                                <p className="text-sm mt-1">{review.provider_response}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {user && user.id !== provider.user_id && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold">Leave a Review</h3>
                        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-2">
                          <label>Rating:</label>
                          <select
                            value={newRating}
                            onChange={(e) => setNewRating(Number(e.target.value))}
                            className="border p-1"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                          <label>Comment:</label>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            required
                            className="border p-2"
                          ></textarea>
                          <Button type="submit">Submit Review</Button>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="portfolio" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio</CardTitle>
                    <CardDescription>View examples of previous work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {provider.portfolio_media && provider.portfolio_media.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {provider.portfolio_media.map((item, index) => (
                          <div
                            key={item.id}
                            className="group relative cursor-pointer rounded-md overflow-hidden"
                            onClick={() => item.media_type === 'image' ? openSlideshow(index) : null}
                          >
                            <div className="aspect-square bg-muted relative">
                              {item.media_type === 'image' ? (
                                <>
                                  <img
                                    src={getFullImageUrl(item.file)}
                                    alt={item.caption || "Portfolio item"}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-white text-center p-4">
                                      <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                      <p className="font-medium">{item.caption || "No caption"}</p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <video
                                    src={getFullImageUrl(item.file)}
                                    className="w-full h-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-white text-center p-4">
                                      <Video className="h-8 w-8 mx-auto mb-2" />
                                      <p className="font-medium">{item.caption || "No caption"}</p>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No portfolio items available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Slideshow Modal */}
            {isSlideshowOpen && provider && (
              <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                <button
                  onClick={closeSlideshow}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
                >
                  <X className="h-8 w-8" />
                </button>
                
                <div className="relative w-full max-w-6xl h-full flex items-center">
                  <button
                    onClick={goToPreviousSlide}
                    className="absolute left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  
                  <div className="w-full h-full flex items-center justify-center">
                    {provider.portfolio_media[currentSlideIndex].media_type === 'image' ? (
                      <img
                        src={getFullImageUrl(provider.portfolio_media[currentSlideIndex].file)}
                        alt={provider.portfolio_media[currentSlideIndex].caption || "Portfolio item"}
                        className="max-w-full max-h-[90vh] object-contain"
                      />
                    ) : (
                      <video
                        src={getFullImageUrl(provider.portfolio_media[currentSlideIndex].file)}
                        className="max-w-full max-h-[90vh] object-contain"
                        controls
                        autoPlay
                      />
                    )}
                  </div>
                  
                  <button
                    onClick={goToNextSlide}
                    className="absolute right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </div>

                <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                  <p className="text-lg">
                    {currentSlideIndex + 1} / {provider.portfolio_media.length}
                  </p>
                  <p className="text-sm mt-1">
                    {provider.portfolio_media[currentSlideIndex].caption}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Provider not found</h2>
            <p className="text-muted-foreground mb-6">
              The provider you're looking for doesn't exist or has been removed
            </p>
            <Button onClick={() => router.push("/marketplace")}>Back to Marketplace</Button>
          </div>
        )}
      </div>
    </div>
  )
}