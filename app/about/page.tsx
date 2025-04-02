import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, Award, Clock, Shield } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">About Service Platform</h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Connecting communities with trusted service providers since 2020. Our mission is to make finding and
                  booking local services simple, transparent, and reliable.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[300px] w-full md:h-[400px] rounded-lg overflow-hidden shadow-md">
                <Image src="/images/our_team.jpg" alt="Our team" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative h-[300px] w-full md:h-[400px] rounded-lg overflow-hidden shadow-md">
                <Image src="/images/our_story.jpg" alt="Our story" fill className="object-cover" />
              </div>
            </div>
            <div className="order-1 lg:order-2 flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">Our Story</h2>
                <p className="text-muted-foreground">
                  Service Platform was founded in 2020 with a simple idea: make it easier for people to find reliable
                  local service providers. What started as a small directory has grown into a comprehensive platform
                  connecting thousands of service providers with clients across the country.
                </p>
                <p className="text-muted-foreground mt-4">
                  Our founders recognized the challenges people faced when trying to find trustworthy professionals for
                  home repairs, personal services, and business needs. The traditional methods were time-consuming and
                  often led to disappointing results.
                </p>
                <p className="text-muted-foreground mt-4">
                  Today, we're proud to have built a platform that values quality, reliability, and transparency. We've
                  helped thousands of clients find the right service providers and enabled small businesses to grow
                  through our platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">Our Values</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                The principles that guide everything we do
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-lift">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Trust</h3>
                <p className="text-muted-foreground">
                  We verify service providers and promote transparency in all interactions.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Quality</h3>
                <p className="text-muted-foreground">
                  We maintain high standards and celebrate excellence in service delivery.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Community</h3>
                <p className="text-muted-foreground">
                  We build connections between service providers and clients to strengthen local economies.
                </p>
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Efficiency</h3>
                <p className="text-muted-foreground">
                  We value your time and strive to make finding and booking services quick and easy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter">Our Leadership Team</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Meet the people behind Service Platform
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Chief Executive Officer",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Sarah has over 15 years of experience in technology and marketplace businesses.",
              },
              {
                name: "Michael Chen",
                role: "Chief Technology Officer",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Michael leads our engineering team with a focus on creating intuitive, reliable technology.",
              },
              {
                name: "Aisha Patel",
                role: "Chief Operating Officer",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Aisha ensures our day-to-day operations run smoothly and efficiently.",
              },
              {
                name: "David Rodriguez",
                role: "Chief Marketing Officer",
                image: "/placeholder.svg?height=300&width=300",
                bio: "David brings creative strategies to connect service providers with clients.",
              },
              {
                name: "Emma Wilson",
                role: "Head of Customer Success",
                image: "/placeholder.svg?height=300&width=300",
                bio: "Emma is dedicated to ensuring both providers and clients have a positive experience.",
              },
              {
                name: "James Thompson",
                role: "Head of Business Development",
                image: "/placeholder.svg?height=300&width=300",
                bio: "James focuses on growing our network of service providers across new regions.",
              },
            ].map((member, index) => (
              <Card key={index} className="overflow-hidden hover-lift">
                <CardContent className="p-0">
                  <div className="relative h-[300px] w-full">
                    <Image src={member.image || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-primary font-medium">{member.role}</p>
                    <p className="mt-2 text-muted-foreground">{member.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">10,000+</p>
              <p className="text-xl font-medium">Active Users</p>
              <p className="text-muted-foreground">Clients using our platform</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">5,000+</p>
              <p className="text-xl font-medium">Service Providers</p>
              <p className="text-muted-foreground">Professionals offering services</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">50+</p>
              <p className="text-xl font-medium">Service Categories</p>
              <p className="text-muted-foreground">Covering diverse needs</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">25,000+</p>
              <p className="text-xl font-medium">Completed Bookings</p>
              <p className="text-muted-foreground">Successful service deliveries</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Join Our Community</h2>
              <p className="text-xl text-primary-foreground/80">
                Whether you're looking for services or offering them, Service Platform is here to help
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/auth/register">
                <Button variant="secondary" size="lg" className="gap-1 group">
                  Sign Up Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white text-white hover:bg-white/10"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

