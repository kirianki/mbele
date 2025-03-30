"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { marketplaceApi, transactionsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface Provider {
  id: number
  business_name: string
  sector_name: string
}

const bookingFormSchema = z.object({
  provider: z.string().min(1, "Please select a service provider"),
  service_date: z.date({
    required_error: "Please select a date",
  }),
})

export default function NewBookingPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const providerId = searchParams.get("provider")

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      provider: providerId || "",
      service_date: undefined,
    },
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }

    if (user) {
      fetchProviders()
    }
  }, [user, authLoading, router])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const response = await marketplaceApi.getProviders()

      if (response && Array.isArray(response.results)) {
        if (response.results.length > 0) {
          setProviders(response.results)
          setError(null)
          
          // If coming from provider page, find and preselect the provider
          if (providerId) {
            const preselectedProvider = response.results.find(p => p.id.toString() === providerId)
            if (preselectedProvider) {
              form.setValue('provider', providerId)
              form.trigger('provider') // Validate the field
            }
          }
        } else {
          setError("No service providers available")
          setProviders([])
        }
      } else {
        console.error("Unexpected providers format:", response)
        setError("Service providers data is not available")
        setProviders([])
      }
    } catch (err) {
      console.error("Error fetching providers:", err)
      setError("Failed to load service providers. Please try again later.")
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof bookingFormSchema>) => {
    if (!user) return

    // Double-check provider is selected
    if (!values.provider) {
      toast({
        title: "Provider required",
        description: "Please select a service provider",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      // Prepare payload according to expected format
      const payload = {
        provider_id: Number(values.provider), // Ensure this is a number
        service_date: values.service_date.toISOString(), // ISO 8601 format
      }

      console.log("Submitting booking payload:", payload) // Debug log

      await transactionsApi.createBooking(payload)

      toast({
        title: "Booking created",
        description: "Your booking has been successfully created",
      })

      router.push("/bookings")
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        title: "Booking failed",
        description: "There was an error creating your booking",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
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
          <h1 className="text-3xl font-bold tracking-tight">New Booking</h1>
          <p className="text-muted-foreground">Schedule a service with a provider</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Fill in the details to create a new booking</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchProviders}>Retry</Button>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No service providers available at this time</p>
                <Button onClick={fetchProviders}>Refresh</Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Provider</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id.toString()}>
                                {provider.business_name} - {provider.sector_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Choose the service provider you want to book</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Service Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 3))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Select the date for your service appointment</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Creating..." : "Create Booking"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}