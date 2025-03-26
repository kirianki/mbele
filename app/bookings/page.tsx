"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { transactionsApi } from "@/lib/api"

type Booking = {
  id: number
  client: number
  provider: number
  provider_name: string
  service_date: string
  status: "pending" | "confirmed" | "cancelled"
  created_at: string
}

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }

    if (user) {
      fetchBookings()
    }
  }, [user, authLoading, router])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const data = await transactionsApi.getBookings()
      setBookings(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching bookings:", err)
      setError("Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Confirmed</span>
          </div>
        )
      case "cancelled":
        return (
          <div className="flex items-center text-destructive">
            <XCircle className="h-4 w-4 mr-1" />
            <span>Cancelled</span>
          </div>
        )
      case "pending":
      default:
        return (
          <div className="flex items-center text-amber-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Pending</span>
          </div>
        )
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
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage your service appointments</p>
        </div>

        <div className="flex justify-between items-center">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              <Button onClick={() => router.push("/bookings/new")}>New Booking</Button>
            </div>

            <TabsContent value="all" className="mt-6">
              <BookingsList
                bookings={bookings}
                loading={loading}
                error={error}
                getStatusBadge={getStatusBadge}
                onRetry={fetchBookings}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <BookingsList
                bookings={bookings.filter((b) => b.status === "pending")}
                loading={loading}
                error={error}
                getStatusBadge={getStatusBadge}
                onRetry={fetchBookings}
              />
            </TabsContent>

            <TabsContent value="confirmed" className="mt-6">
              <BookingsList
                bookings={bookings.filter((b) => b.status === "confirmed")}
                loading={loading}
                error={error}
                getStatusBadge={getStatusBadge}
                onRetry={fetchBookings}
              />
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              <BookingsList
                bookings={bookings.filter((b) => b.status === "cancelled")}
                loading={loading}
                error={error}
                getStatusBadge={getStatusBadge}
                onRetry={fetchBookings}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

type BookingsListProps = {
  bookings: Booking[]
  loading: boolean
  error: string | null
  getStatusBadge: (status: string) => JSX.Element
  onRetry: () => void
}

function BookingsList({ bookings, loading, error, getStatusBadge, onRetry }: BookingsListProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={onRetry}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No bookings found</h3>
          <p className="text-sm text-muted-foreground mb-4">You don't have any bookings in this category</p>
          <Button onClick={() => router.push("/bookings/new")}>Create a Booking</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <h3 className="font-semibold text-lg">{booking.provider_name}</h3>
                  <div className="ml-4">{getStatusBadge(booking.status)}</div>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{new Date(booking.service_date).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {new Date(booking.service_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm">Booking ID: #{booking.id}</p>
              </div>
              <div className="flex items-center gap-2 md:self-end">
                <Button variant="outline" size="sm" onClick={() => router.push(`/bookings/${booking.id}`)}>
                  View Details
                </Button>
                {booking.status === "pending" && (
                  <>
                    <Button variant="default" size="sm">
                      Confirm
                    </Button>
                    <Button variant="destructive" size="sm">
                      Cancel
                    </Button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <Button variant="outline" size="sm">
                    Reschedule
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

