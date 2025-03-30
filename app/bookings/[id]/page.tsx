"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { transactionsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type Booking = {
  id: number
  client: number
  provider: number
  provider_name: string
  service_date: string
  status: "pending" | "confirmed" | "cancelled"
  created_at: string
}

export default function BookingDetailsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bookingId = Number(params.id)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchBooking()
  }, [user, bookingId])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const data = await transactionsApi.getBooking(bookingId)
      setBooking(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching booking:", err)
      setError("Failed to load booking details")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    try {
      await transactionsApi.confirmBooking(bookingId)
      toast({
        title: "Booking Confirmed",
        description: "The booking has been successfully confirmed",
      })
      fetchBooking()
    } catch (err) {
      console.error("Error confirming booking:", err)
      toast({
        title: "Confirmation Failed",
        description: "There was an error confirming the booking",
        variant: "destructive",
      })
    }
  }

  const handleCancel = async () => {
    try {
      await transactionsApi.cancelBooking(bookingId)
      toast({
        title: "Booking Cancelled",
        description: "The booking has been successfully cancelled",
      })
      router.push("/bookings")
    } catch (err) {
      console.error("Error cancelling booking:", err)
      toast({
        title: "Cancellation Failed",
        description: "There was an error cancelling the booking",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchBooking}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container py-10">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Booking not found</h2>
          <Button onClick={() => router.push("/bookings")}>Back to Bookings</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
          <p className="text-muted-foreground">View and manage your booking</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{booking.provider_name}</span>
              {booking.status === "pending" && (
                <Badge className="bg-amber-100 text-amber-800">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Pending
                </Badge>
              )}
              {booking.status === "confirmed" && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmed
                </Badge>
              )}
              {booking.status === "cancelled" && (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelled
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{new Date(booking.service_date).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <Clock className="h-5 w-5 mr-2" />
              <span>
                {new Date(booking.service_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex gap-2 pt-4">
              {booking.status === "pending" && (
                <>
                  <Button onClick={handleConfirm}>Confirm Booking</Button>
                  <Button variant="destructive" onClick={handleCancel}>
                    Cancel Booking
                  </Button>
                </>
              )}
              {booking.status === "confirmed" && (
                <Button variant="destructive" onClick={handleCancel}>
                  Cancel Booking
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push("/bookings")}>
                Back to Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}