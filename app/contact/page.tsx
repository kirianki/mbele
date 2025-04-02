"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
})

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      console.log(values)
      setIsSubmitting(false)
      form.reset()
      toast({
        title: "Message sent",
        description: "We've received your message and will respond shortly.",
      })
    }, 1500)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-muted py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Contact Us</h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Have questions or feedback? We're here to help. Reach out to our team using any of the methods below.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <Tabs defaultValue="contact-form" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contact-form">Contact Form</TabsTrigger>
              <TabsTrigger value="contact-info">Contact Info</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            {/* Contact Form */}
            <TabsContent value="contact-form" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="What is your message about?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Please provide details about your inquiry..."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>Sending...</>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" /> Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Info */}
            <TabsContent value="contact-info" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover-lift">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Multiple ways to reach our team</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p className="text-muted-foreground">kiriankisamuel99@gmail.com</p>
                        <p className="text-muted-foreground">samuelkirianki@outlook.com</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Phone</h3>
                        <p className="text-muted-foreground">+254 793 761 716</p>
                        <p className="text-muted-foreground">Mon-Fri, 9:00 AM - 6:00 PM EST</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Address</h3>
                        <p className="text-muted-foreground">Nairobi</p>
                        <p className="text-muted-foreground">Kenya</p>
                        <p className="text-muted-foreground">HOME</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">Business Hours</h3>
                        <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                        <p className="text-muted-foreground">Saturday: 10:00 AM - 4:00 PM</p>
                        <p className="text-muted-foreground">Sunday: Closed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Our Location</CardTitle>
                    <CardDescription>Find us on the map</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video w-full rounded-md border overflow-hidden">
                      {/* Replace with actual map component if needed */}
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">Map placeholder</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-medium">Service Platform Headquarters</h3>
                      <p className="text-muted-foreground">
                        Conveniently located in downtown with easy access to public transportation.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* FAQ */}
            <TabsContent value="faq" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      question: "How do I create an account?",
                      answer:
                        "You can create an account by clicking the 'Sign Up' button in the top right corner of the page. Follow the prompts to enter your information and choose whether you're a client or service provider.",
                    },
                    {
                      question: "How do I book a service?",
                      answer:
                        "To book a service, browse the marketplace or search for specific providers. Once you find a provider you like, visit their profile and click the 'Book Service' button. Select your preferred date and time, and confirm your booking.",
                    },
                    {
                      question: "How do payments work?",
                      answer:
                        "We offer secure payment processing through our platform. You can pay using credit/debit cards or other supported payment methods. Payments are only released to service providers after the service has been completed.",
                    },
                    {
                      question: "What if I need to cancel a booking?",
                      answer:
                        "You can cancel a booking through your dashboard. Go to 'Bookings', find the booking you want to cancel, and click the 'Cancel' button. Please note that cancellation policies may vary by provider.",
                    },
                    {
                      question: "How do I become a service provider?",
                      answer:
                        "To become a service provider, sign up for an account and select 'Service Provider' as your role. Complete your profile with your business information, services offered, and pricing. Once verified, you'll appear in our marketplace.",
                    },
                  ].map((faq, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
                        <h3 className="font-medium">{faq.question}</h3>
                      </div>
                      <p className="text-muted-foreground ml-8">{faq.answer}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <p className="text-muted-foreground">
                      Can't find what you're looking for? Contact our support team for assistance.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4">
                      <Button variant="outline" className="flex items-center">
                        <Mail className="mr-2 h-4 w-4" /> Email Support
                      </Button>
                      <Button variant="outline" className="flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" /> Live Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">Additional Support Options</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                We're committed to providing excellent support through multiple channels
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover-lift">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Live Chat</h3>
                <p className="text-muted-foreground">
                  Chat with our support team in real-time for immediate assistance with your questions.
                </p>
                <Button variant="outline">Start Chat</Button>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Help Center</h3>
                <p className="text-muted-foreground">
                  Browse our comprehensive knowledge base for tutorials, guides, and troubleshooting tips.
                </p>
                <Button variant="outline">Visit Help Center</Button>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Phone Support</h3>
                <p className="text-muted-foreground">
                  Speak directly with our customer service team for personalized assistance.
                </p>
                <Button variant="outline">Call Support</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter">Ready to Get Started?</h2>
              <p className="text-xl text-primary-foreground/80">
                Join thousands of users who find and book services through our platform
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button variant="secondary" size="lg">
                Sign Up Now
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                Browse Services
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

