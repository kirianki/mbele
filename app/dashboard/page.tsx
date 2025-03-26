"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, MessageSquare, Clock, Star, Users, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { transactionsApi, communicationsApi } from "@/lib/api"

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [messages, setMessages] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, authLoading, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [bookingsData, messagesData, favoritesData] = await Promise.all([
        transactionsApi.getBookings(),
        communicationsApi.getMessages(),
        transactionsApi.getFavorites(),
      ])

      setBookings(bookingsData)
      setMessages(messagesData)
      setFavorites(favoritesData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container py-10">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/4" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.first_name || user.username}!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : bookings.length}</div>
              <p className="text-xs text-muted-foreground">
                {bookings.length === 1 ? "booking" : "bookings"} scheduled
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : Array.isArray(messages) ? (
                  messages.filter((msg: any) => !msg.is_read).length
                ) : (
                  0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {(Array.isArray(messages) ? messages.filter((msg: any) => !msg.is_read).length : 0) === 1
                  ? "message"
                  : "messages"}{" "}
                unread
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Providers</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : favorites.length}</div>
              <p className="text-xs text-muted-foreground">{favorites.length === 1 ? "provider" : "providers"} saved</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>View and manage your upcoming service appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No bookings yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't made any bookings with service providers yet
                    </p>
                    <Link href="/marketplace">
                      <Button>Browse Services</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                          <p className="font-medium">Booking with {booking.provider_name}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>{new Date(booking.service_date).toLocaleDateString()}</span>
                            <span className="mx-2">•</span>
                            <Clock className="mr-1 h-4 w-4" />
                            <span>
                              {new Date(booking.service_date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button variant="destructive" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>View your conversations with service providers</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No messages yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't started any conversations with service providers
                    </p>
                    <Link href="/marketplace">
                      <Button>Find Providers</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(messages) && messages.length > 0 ? (
                      messages.map((message: any) => (
                        <div key={message.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {message.sender_id === user.id
                                ? `To: ${message.receiver_username}`
                                : `From: ${message.sender_username}`}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/messages/${message.sender_id === user.id ? message.receiver_id : message.sender_id}`}
                            >
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No messages available.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Providers</CardTitle>
                <CardDescription>Quick access to your saved service providers</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No favorites yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't added any service providers to your favorites
                    </p>
                    <Link href="/marketplace">
                      <Button>Discover Providers</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {favorites.map((favorite: any) => (
                      <div key={favorite.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{favorite.provider_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {favorite.provider_sector} • {favorite.provider_subcategory}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/marketplace/providers/${favorite.provider}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              transactionsApi.removeFavorite(favorite.id).then(() => {
                                setFavorites(favorites.filter((f: any) => f.id !== favorite.id))
                              })
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

