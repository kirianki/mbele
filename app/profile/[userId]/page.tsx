// Create a new file for viewing profiles by user ID

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Calendar, MapPin, Globe, Briefcase, Star } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { marketplaceApi } from "@/lib/api"

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<Array<{ imageUrl: string; title: string; description: string }>>(
    [],
  )

  const userId = Number.parseInt(params.userId)
  const isOwnProfile = user?.id === userId

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)

      // In a real app, you would fetch the user profile from the API
      // For now, we'll simulate this with a timeout
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Fetch business profile if this is a service provider
      try {
        const response = await marketplaceApi.getProviderByUserId(userId)

        if (response && response.id) {
          setBusinessProfile(response)

          // Convert the portfolio media from the API to our format
          if (response.portfolio_media) {
            const items = response.portfolio_media.map((item: any, index: number) => ({
              imageUrl: item.url || `/placeholder.svg?height=200&width=300`,
              title: item.title || `Item ${index + 1}`,
              description: item.description || "",
            }))

            setPortfolioItems(items)
          }
        }
      } catch (err) {
        console.error("Error fetching business profile:", err)
      }

      // Simulate fetching user profile
      setProfile({
        id: userId,
        username: `user${userId}`,
        first_name: "John",
        last_name: "Doe",
        email: `user${userId}@example.com`,
        role: "service_provider",
        profile_picture: null,
      })

      setLoading(false)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setError("Failed to load user profile")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/4" />
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <div className="md:w-2/3 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          {isOwnProfile && <Button onClick={() => router.push("/profile")}>Edit Profile</Button>}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profile?.profile_picture || ""} alt={profile?.username} />
                    <AvatarFallback className="text-2xl">
                      {profile?.first_name?.[0] || profile?.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">
                    {profile?.first_name} {profile?.last_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.role === "service_provider" ? "Service Provider" : "Client"}
                  </p>

                  {!isOwnProfile && (
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="gap-1">
                        <MessageSquare className="h-4 w-4" /> Message
                      </Button>
                      {businessProfile && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <Calendar className="h-4 w-4" /> Book
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:w-2/3">
            <Tabs defaultValue={businessProfile ? "business" : "general"} className="space-y-4">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                {businessProfile && <TabsTrigger value="business">Business Profile</TabsTrigger>}
              </TabsList>

              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>About {profile?.first_name}</CardTitle>
                    <CardDescription>General information about this user</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Contact Information</h3>
                      <p className="text-sm text-muted-foreground">Email: {profile?.email}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Account Details</h3>
                      <p className="text-sm text-muted-foreground">Username: {profile?.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Account Type: {profile?.role === "service_provider" ? "Service Provider" : "Client"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {businessProfile && (
                <TabsContent value="business">
                  <Card>
                    <CardHeader>
                      <CardTitle>{businessProfile.business_name}</CardTitle>
                      <CardDescription>
                        {businessProfile.sector_name} • {businessProfile.subcategory_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Business Description</h3>
                        <p>{businessProfile.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium mb-2">Location</h3>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm">{businessProfile.address}</p>
                              <p className="text-sm text-muted-foreground">
                                {businessProfile.town}, {businessProfile.subcounty}, {businessProfile.county}
                              </p>
                            </div>
                          </div>
                        </div>

                        {businessProfile.website && (
                          <div>
                            <h3 className="font-medium mb-2">Website</h3>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={
                                  businessProfile.website.startsWith("http")
                                    ? businessProfile.website
                                    : `https://${businessProfile.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {businessProfile.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Services</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {businessProfile.sector_name}
                          </Badge>
                          <Badge variant="outline">{businessProfile.subcategory_name}</Badge>
                        </div>
                      </div>

                      {businessProfile.average_rating && (
                        <div>
                          <h3 className="font-medium mb-2">Rating</h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-primary text-primary" />
                            <span className="font-medium">{businessProfile.average_rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">
                              ({businessProfile.reviews_count || 0} reviews)
                            </span>
                          </div>
                        </div>
                      )}

                      {portfolioItems.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Portfolio</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {portfolioItems.map((item, index) => (
                              <div key={index} className="border rounded-md overflow-hidden">
                                <div className="relative h-48 w-full">
                                  <img
                                    src={item.imageUrl || "/placeholder.svg"}
                                    alt={`Portfolio item ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="p-3">
                                  <p className="font-medium truncate">{item.title || `Item ${index + 1}`}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {item.description || "No description"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

