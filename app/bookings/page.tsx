"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { transactionsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

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
  const { toast } = useToast()
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
      setError("Failed to load bookings. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await transactionsApi.cancelBooking(bookingId)
      toast({
        title: "Booking Cancelled",
        description: "The booking has been successfully cancelled.",
      })
      fetchBookings()
    } catch (err) {
      console.error("Error cancelling booking:", err)
      toast({
        title: "Cancellation Failed",
        description: "There was an error cancelling the booking.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>
      case "pending":
      default:
        return <Badge className="bg-amber-100 text-amber-800"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>
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

  const isClient = user.role === 'client' // Assuming user object has a 'role' property

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
            <p className="text-muted-foreground">Manage your service appointments</p>
          </div>
          {isClient && (
            <Button onClick={() => router.push("/bookings/new")}>New Booking</Button>
          )}
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <BookingsList
              bookings={bookings}
              loading={loading}
              error={error}
              getStatusBadge={getStatusBadge}
              onRetry={fetchBookings}
              onCancel={handleCancelBooking}
              isClient={isClient}
            />
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <BookingsList
              bookings={bookings.filter((b) => b.status === "pending")}
              loading={loading}
              error={error}
              getStatusBadge={getStatusBadge}
              onRetry={fetchBookings}
              onCancel={handleCancelBooking}
              isClient={isClient}
            />
          </TabsContent>

          <TabsContent value="confirmed" className="mt-6">
            <BookingsList
              bookings={bookings.filter((b) => b.status === "confirmed")}
              loading={loading}
              error={error}
              getStatusBadge={getStatusBadge}
              onRetry={fetchBookings}
              onCancel={handleCancelBooking}
              isClient={isClient}
            />
          </TabsContent>

          <TabsContent value="cancelled" className="mt-6">
            <BookingsList
              bookings={bookings.filter((b) => b.status === "cancelled")}
              loading={loading}
              error={error}
              getStatusBadge={getStatusBadge}
              onRetry={fetchBookings}
              isClient={isClient}
            />
          </TabsContent>
        </Tabs>
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
  onCancel?: (id: number) => void
  isClient: boolean
}

function BookingsList({
  bookings,
  loading,
  error,
  getStatusBadge,
  onRetry,
  onCancel,
  isClient
}: BookingsListProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
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
          <p className="text-sm text-muted-foreground mb-4">
            {bookings.length === 0 ? "You don't have any bookings" : "No bookings match this filter"}
          </p>
          {isClient && (
            <Button onClick={() => router.push("/bookings/new")}>Create a Booking</Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-lg">{booking.provider_name}</h3>
                  {getStatusBadge(booking.status)}
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
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(booking.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 md:self-end">
                {!isClient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                  >
                    View Details
                  </Button>
                )}
                {isClient && onCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onCancel(booking.id)}
                  >
                    Cancel
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