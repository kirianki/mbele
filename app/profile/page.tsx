"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Upload,
  Search,
  X,
  Edit,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Home,
  Wrench,
  Car,
  Utensils,
  Scissors,
  Laptop,
  BookOpen,
  Heart,
  Paintbrush,
  Truck,
  ShoppingBag,
  Camera,
  MapPin,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { marketplaceApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { getAllCounties, getSubcountiesForCounty, getPopularCounties } from "@/lib/location-utils"

const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  profile_picture: z.string().optional(),
})

const businessProfileSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address is required"),
  website: z.string().optional(),
  county: z.string().min(1, "County is required"),
  subcounty: z.string().min(1, "Sub-county is required"),
  town: z.string().min(1, "Town is required"),
  sector: z.string().min(1, "Sector is required"),
  subcategory: z.string().min(1, "Subcategory is required"),
})

// Map sector names to icons for visual representation
const sectorIcons: Record<string, any> = {
  Construction: Briefcase,
  "Home Services": Home,
  Plumbing: Wrench,
  Electrical: Wrench,
  Automotive: Car,
  "Food & Catering": Utensils,
  "Beauty & Wellness": Scissors,
  Technology: Laptop,
  Education: BookOpen,
  Healthcare: Heart,
  "Art & Design": Paintbrush,
  Transportation: Truck,
  Retail: ShoppingBag,
  Photography: Camera,
  // Default icon for any other sector
  default: Briefcase,
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, updateProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [businessSubmitting, setBusinessSubmitting] = useState(false)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false)
  const [loadingBusinessProfile, setLoadingBusinessProfile] = useState(true)
  const [sectors, setSectors] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([])
  const [selectedSector, setSelectedSector] = useState<string>("")
  const [sectorSearchQuery, setSectorSearchQuery] = useState("")
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState("")

  // Location data
  const [counties] = useState<string[]>(getAllCounties())
  const [popularCounties] = useState<string[]>(getPopularCounties())
  const [subcounties, setSubcounties] = useState<string[]>([])
  const [selectedCounty, setSelectedCounty] = useState<string>("")

  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<Array<{ imageUrl: string; title: string; description: string }>>(
    [],
  )
  const [portfolioUploadPreview, setPortfolioUploadPreview] = useState<string | null>(null)
  const [portfolioItemTitle, setPortfolioItemTitle] = useState("")
  const [portfolioItemDescription, setPortfolioItemDescription] = useState("")
  const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<number | null>(null)
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Business profile creation wizard
  const [showBusinessWizard, setShowBusinessWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardData, setWizardData] = useState({
    business_name: "",
    description: "",
    sector: "",
    subcategory: "",
    address: "",
    website: "",
    county: "",
    subcounty: "",
    town: "",
  })

  // Refs for file inputs
  const profileImageInputRef = useRef<HTMLInputElement>(null)
  const portfolioImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === "service_provider") {
      fetchBusinessProfile()
      fetchSectorsAndSubcategories()
    } else {
      setLoadingBusinessProfile(false)
    }
  }, [user])

  const fetchBusinessProfile = async () => {
    try {
      setLoadingBusinessProfile(true)
      // Simulated API call
      const response = await marketplaceApi.getProviderByUserId(user?.id || 0)
  
      if (response && response.id) {
        setBusinessProfile(response)
        setHasBusinessProfile(true)
        // Check if sector exists before calling toString()
        setSelectedSector(response.sector ? response.sector.toString() : "")
  
        // Set county and load subcounties if available
        if (response.county) {
          setSelectedCounty(response.county)
          setSubcounties(getSubcountiesForCounty(response.county))
        }
      } else {
        setHasBusinessProfile(false)
      }
    } catch (error) {
      console.error("Error fetching business profile:", error)
      setHasBusinessProfile(false)
    } finally {
      setLoadingBusinessProfile(false)
    }
  }
  

  const fetchSectorsAndSubcategories = async () => {
    try {
      const [sectorsData, subcategoriesData] = await Promise.all([
        marketplaceApi.getSectors(),
        marketplaceApi.getSubcategories(),
      ])
      setSectors(sectorsData)
      setSubcategories(subcategoriesData)
    } catch (error) {
      console.error("Error fetching sectors and subcategories:", error)
      toast({
        title: "Error",
        description: "Failed to load sectors and subcategories",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (selectedSector) {
      const filtered = subcategories.filter((sub) => sub.sector.toString() === selectedSector)
      setFilteredSubcategories(filtered)
    } else {
      setFilteredSubcategories([])
    }
  }, [selectedSector, subcategories])

  // Update subcounties when county changes
  useEffect(() => {
    if (selectedCounty) {
      setSubcounties(getSubcountiesForCounty(selectedCounty))
    } else {
      setSubcounties([])
    }
  }, [selectedCounty])

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      profile_picture: user?.profile_picture || "",
    },
  })

  const businessForm = useForm<z.infer<typeof businessProfileSchema>>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      business_name: "",
      description: "",
      address: "",
      website: "",
      county: "",
      subcounty: "",
      town: "",
      sector: "",
      subcategory: "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        profile_picture: user.profile_picture || "",
      })
    }
  }, [user, form])

  useEffect(() => {
    if (businessProfile) {
      businessForm.reset({
        business_name: businessProfile.business_name || "",
        description: businessProfile.description || "",
        address: businessProfile.address || "",
        website: businessProfile.website || "",
        county: businessProfile.county || "",
        subcounty: businessProfile.subcounty || "",
        town: businessProfile.town || "",
        sector: businessProfile.sector?.toString() || "",
        subcategory: businessProfile.subcategory?.toString() || "",
      })
      setSelectedSector(businessProfile.sector?.toString() || "")
      setSelectedCounty(businessProfile.county || "")
    }
  }, [businessProfile, businessForm])

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      await updateProfile(values)
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Now update the onBusinessSubmit function to use the API methods:

  const onBusinessSubmit = async (values: z.infer<typeof businessProfileSchema>) => {
    if (!user) return

    setBusinessSubmitting(true)
    try {
      const formattedData = {
        business_name: values.business_name,
        description: values.description,
        address: values.address,
        website: values.website,
        county: values.county,
        subcounty: values.subcounty,
        town: values.town,
        sector: Number.parseInt(values.sector),
        subcategory: Number.parseInt(values.subcategory),
      }

      let updatedProfile
      if (hasBusinessProfile && businessProfile?.id) {
        updatedProfile = await marketplaceApi.updateBusinessProfile(businessProfile.id, formattedData)
      } else {
        updatedProfile = await marketplaceApi.createBusinessProfile(formattedData)
      }

      // Update local state to reflect changes
      setBusinessProfile({
        ...businessProfile,
        ...updatedProfile,
      })

      setHasBusinessProfile(true)

      toast({
        title: hasBusinessProfile ? "Business profile updated" : "Business profile created",
        description: hasBusinessProfile
          ? "Your business profile has been successfully updated"
          : "Your business profile has been successfully created",
      })
    } catch (error) {
      console.error("Error updating business profile:", error)
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "There was an error updating your business profile",
        variant: "destructive",
      })
    } finally {
      setBusinessSubmitting(false)
    }
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const saveProfileImage = async () => {
    if (!profileImage) return

    setIsSubmitting(true)
    try {
      // In a real app, you would upload the image to your server/cloud storage
      // and then update the user profile with the new image URL

      // For now, we'll simulate this by updating the form value
      form.setValue("profile_picture", profileImage)

      // Then submit the form
      await updateProfile({
        ...form.getValues(),
        profile_picture: profileImage,
      })

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated",
      })

      setProfileImage(null)
    } catch (error) {
      console.error("Error updating profile picture:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your profile picture",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePortfolioImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPortfolioUploadPreview(event.target.result as string)
          setPortfolioItemTitle("")
          setPortfolioItemDescription("")
          setIsPortfolioModalOpen(true)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Also update the savePortfolioItem function to actually upload the portfolio item:

  const savePortfolioItem = async () => {
    if (!portfolioUploadPreview || !businessProfile || !businessProfile.id) return

    try {
      // In a real app, you would first upload the image to a storage service
      // and then save the URL to your database
      const portfolioData = {
        title: portfolioItemTitle || "Untitled Item",
        description: portfolioItemDescription || "No description provided",
        image_url: portfolioUploadPreview, // In a real app, this would be the URL from your storage service
      }

      // Upload the portfolio item
      await marketplaceApi.uploadPortfolioItem(businessProfile.id, portfolioData)

      // Add to local state
      setPortfolioItems([
        ...portfolioItems,
        {
          imageUrl: portfolioUploadPreview,
          title: portfolioItemTitle || "Untitled Item",
          description: portfolioItemDescription || "No description provided",
        },
      ])

      // Reset the form
      setPortfolioUploadPreview(null)
      setPortfolioItemTitle("")
      setPortfolioItemDescription("")
      setIsPortfolioModalOpen(false)

      toast({
        title: "Portfolio item added",
        description: "Your portfolio item has been successfully added",
      })
    } catch (error) {
      console.error("Error saving portfolio item:", error)
      toast({
        title: "Failed to add portfolio item",
        description: error instanceof Error ? error.message : "There was an error adding your portfolio item",
        variant: "destructive",
      })
    }
  }

  const cancelPortfolioUpload = () => {
    setPortfolioUploadPreview(null)
    setPortfolioItemTitle("")
    setPortfolioItemDescription("")
    setIsPortfolioModalOpen(false)
  }

  const handleEditPortfolioItem = (index: number) => {
    setEditingPortfolioIndex(index)
    setPortfolioItemTitle(portfolioItems[index].title)
    setPortfolioItemDescription(portfolioItems[index].description)
    setIsEditModalOpen(true)
  }

  const updatePortfolioItem = () => {
    if (editingPortfolioIndex === null) return

    const updatedItems = [...portfolioItems]
    updatedItems[editingPortfolioIndex] = {
      ...updatedItems[editingPortfolioIndex],
      title: portfolioItemTitle || "Untitled Item",
      description: portfolioItemDescription || "No description provided",
    }

    setPortfolioItems(updatedItems)
    setEditingPortfolioIndex(null)
    setPortfolioItemTitle("")
    setPortfolioItemDescription("")
    setIsEditModalOpen(false)

    toast({
      title: "Portfolio item updated",
      description: "Your portfolio item has been successfully updated",
    })
  }

  const cancelPortfolioEdit = () => {
    setEditingPortfolioIndex(null)
    setPortfolioItemTitle("")
    setPortfolioItemDescription("")
    setIsEditModalOpen(false)
  }

  const handleDeletePortfolioItem = (index: number) => {
    const updatedItems = portfolioItems.filter((_, i) => i !== index)
    setPortfolioItems(updatedItems)

    toast({
      title: "Portfolio item deleted",
      description: "Your portfolio item has been successfully deleted",
    })
  }

  // Business profile wizard functions
  const startBusinessWizard = () => {
    setWizardStep(1)
    setWizardData({
      business_name: businessForm.getValues().business_name || "",
      description: businessForm.getValues().description || "",
      sector: businessForm.getValues().sector || "",
      subcategory: businessForm.getValues().subcategory || "",
      address: businessForm.getValues().address || "",
      website: businessForm.getValues().website || "",
      county: businessForm.getValues().county || "",
      subcounty: businessForm.getValues().subcounty || "",
      town: businessForm.getValues().town || "",
    })
    setShowBusinessWizard(true)
  }

  // And update the completeBusinessWizard function:

  const completeBusinessWizard = async () => {
    setBusinessSubmitting(true)
    try {
      const formattedData = {
        business_name: wizardData.business_name,
        description: wizardData.description,
        address: wizardData.address,
        website: wizardData.website,
        county: wizardData.county,
        subcounty: wizardData.subcounty,
        town: wizardData.town,
        sector: Number.parseInt(wizardData.sector),
        subcategory: Number.parseInt(wizardData.subcategory),
      }

      let updatedProfile
      if (hasBusinessProfile && businessProfile?.id) {
        updatedProfile = await marketplaceApi.updateBusinessProfile(businessProfile.id, formattedData)
      } else {
        updatedProfile = await marketplaceApi.createBusinessProfile(formattedData)
      }

      // Update the form with wizard data
      Object.entries(wizardData).forEach(([key, value]) => {
        businessForm.setValue(key as any, value)
      })

      // Update local state to reflect changes
      setBusinessProfile({
        ...businessProfile,
        ...updatedProfile,
        portfolio_media: portfolioItems.length > 0 ? portfolioItems : [], // Ensure portfolio is initialized
      })

      setHasBusinessProfile(true)
      setShowBusinessWizard(false)

      toast({
        title: hasBusinessProfile ? "Business profile updated" : "Business profile created",
        description: hasBusinessProfile
          ? "Your business profile has been successfully updated"
          : "Your business profile has been successfully created. You can add portfolio items later.",
      })
    } catch (error) {
      console.error("Error updating business profile:", error)
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "There was an error updating your business profile",
        variant: "destructive",
      })
    } finally {
      setBusinessSubmitting(false)
    }
  }

  const nextWizardStep = () => {
    setWizardStep(wizardStep + 1)
  }

  const prevWizardStep = () => {
    setWizardStep(wizardStep - 1)
  }

  const updateWizardData = (field: string, value: string) => {
    setWizardData({
      ...wizardData,
      [field]: value,
    })

    // Update subcounties if county is selected
    if (field === "county") {
      setSelectedCounty(value)
    }
  }

  // Get sector icon
  const getSectorIcon = (sectorName: string) => {
    const name = sectorName.toLowerCase()

    // Find the matching icon or use default
    for (const [key, icon] of Object.entries(sectorIcons)) {
      if (name.includes(key.toLowerCase())) {
        return icon
      }
    }

    return sectorIcons.default
  }

  useEffect(() => {
    if (businessProfile && businessProfile.portfolio_media) {
      // Convert the portfolio media from the API to our format
      const items = businessProfile.portfolio_media.map((item: any, index: number) => ({
        imageUrl: item.url || `/placeholder.svg?height=200&width=300`,
        title: item.title || `Item ${index + 1}`,
        description: item.description || "",
      }))

      setPortfolioItems(items)
    }
  }, [businessProfile])

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

  // Filter sectors based on search query
  const filteredSectors = sectors.filter((sector) =>
    sector.name.toLowerCase().includes(sectorSearchQuery.toLowerCase()),
  )

  // Filter subcategories based on search query
  const searchFilteredSubcategories = filteredSubcategories.filter((subcategory) =>
    subcategory.name.toLowerCase().includes(subcategorySearchQuery.toLowerCase()),
  )

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and profile information</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            {user.role === "service_provider" && <TabsTrigger value="business">Business Profile</TabsTrigger>}
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update your personal information and profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileImage || user.profile_picture || ""} alt={user.username} />
                      <AvatarFallback className="text-2xl">{user.first_name?.[0] || user.username[0]}</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => profileImageInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="sr-only">Upload profile picture</span>
                    </button>
                    <input
                      ref={profileImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageChange}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Role: {user.role_display || (user.role === "client" ? "Client" : "Service Provider")}
                    </p>
                    {profileImage && (
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={saveProfileImage}>
                          Save Image
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setProfileImage(null)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="profile_picture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/avatar.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter a URL for your profile picture or use the upload button above
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Update your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <FormLabel htmlFor="current-password">Current Password</FormLabel>
                      <Input id="current-password" type="password" />
                    </div>
                    <div>
                      <FormLabel htmlFor="new-password">New Password</FormLabel>
                      <Input id="new-password" type="password" />
                    </div>
                    <div>
                      <FormLabel htmlFor="confirm-password">Confirm New Password</FormLabel>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <Button>Update Password</Button>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <div>
                    <h3 className="text-lg font-medium">Account Security</h3>
                    <p className="text-sm text-muted-foreground">Manage your account security settings</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Active Sessions</p>
                        <p className="text-sm text-muted-foreground">Manage devices where you're currently logged in</p>
                      </div>
                      <Button variant="outline">Manage</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {user.role === "service_provider" && (
            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle>Business Profile</CardTitle>
                      <CardDescription>
                        {hasBusinessProfile
                          ? "Update your business information and service details"
                          : "Create your business profile to start offering services"}
                      </CardDescription>
                    </div>
                    <Button onClick={startBusinessWizard}>
                      {hasBusinessProfile ? "Edit with Wizard" : "Create Profile"}
                    </Button>
                  </div>
                </CardHeader>
                {loadingBusinessProfile ? (
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                ) : (
                  <>
                    {!hasBusinessProfile && (
                      <CardContent>
                        <Alert className="mb-6">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Business profile not found</AlertTitle>
                          <AlertDescription>
                            You don't have a business profile yet. Click the "Create Profile" button above to get
                            started with our step-by-step wizard.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    )}
                    {hasBusinessProfile && (
                      <CardContent>
                        <Form {...businessForm}>
                          <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-4">
                            <FormField
                              control={businessForm.control}
                              name="business_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your Business Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={businessForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Describe your business and services"
                                      className="min-h-[120px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Provide a detailed description of your services, expertise, and what sets you apart
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={businessForm.control}
                                name="sector"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Sector</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value)
                                        setSelectedSector(value)
                                        // Reset subcategory when sector changes
                                        businessForm.setValue("subcategory", "")
                                      }}
                                      defaultValue={field.value}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a sector" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {sectors.map((sector) => (
                                          <SelectItem key={sector.id} value={sector.id.toString()}>
                                            {sector.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={businessForm.control}
                                name="subcategory"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Subcategory</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      value={field.value}
                                      disabled={!selectedSector}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a subcategory" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {filteredSubcategories.map((subcategory) => (
                                          <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                            {subcategory.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={businessForm.control}
                                name="address"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                      <Input placeholder="123 Main St" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={businessForm.control}
                                name="website"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://yourbusiness.com" {...field} />
                                    </FormControl>
                                    <FormDescription>Optional</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={businessForm.control}
                                name="county"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>County</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value)
                                        setSelectedCounty(value)
                                        // Reset subcounty when county changes
                                        businessForm.setValue("subcounty", "")
                                      }}
                                      defaultValue={field.value}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select county" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {counties.map((county) => (
                                          <SelectItem key={county} value={county}>
                                            {county}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={businessForm.control}
                                name="subcounty"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Sub-County</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      value={field.value}
                                      disabled={!selectedCounty}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select sub-county" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {subcounties.map((subcounty) => (
                                          <SelectItem key={subcounty} value={subcounty}>
                                            {subcounty}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={businessForm.control}
                                name="town"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Town</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Town" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <Button type="submit" disabled={businessSubmitting}>
                              {businessSubmitting
                                ? "Saving..."
                                : hasBusinessProfile
                                  ? "Update Business Profile"
                                  : "Create Business Profile"}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    )}
                  </>
                )}
                {hasBusinessProfile && (
                  <CardFooter className="flex flex-col items-start pt-6 border-t">
                    <div className="space-y-4 w-full">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium">Portfolio</h3>
                          <p className="text-sm text-muted-foreground">Showcase your work with photos and videos</p>
                        </div>
                        <Button
                          onClick={() => portfolioImageInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Add Portfolio Item</span>
                          <input
                            ref={portfolioImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePortfolioImageUpload}
                          />
                        </Button>
                      </div>

                      {portfolioItems.length === 0 ? (
                        <div className="text-center py-8 border rounded-md">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            No portfolio items yet. Add some to showcase your work.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {portfolioItems.map((item, index) => (
                            <div key={index} className="border rounded-md overflow-hidden group relative">
                              <div className="relative h-48 w-full">
                                <img
                                  src={item.imageUrl || "/placeholder.svg"}
                                  alt={`Portfolio item ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-white border-white hover:bg-white/20"
                                    onClick={() => handleEditPortfolioItem(index)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeletePortfolioItem(index)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                  </Button>
                                </div>
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
                      )}
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Business Profile Wizard */}
      {showBusinessWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {hasBusinessProfile ? "Edit Business Profile" : "Create Business Profile"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowBusinessWizard(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex justify-between mb-6">
              <div className={`flex-1 text-center ${wizardStep === 1 ? "text-primary font-medium" : ""}`}>
                <div
                  className={`rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-1 ${wizardStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  1
                </div>
                <p className="text-sm">Basic Info</p>
              </div>
              <div className={`flex-1 text-center ${wizardStep === 2 ? "text-primary font-medium" : ""}`}>
                <div
                  className={`rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-1 ${wizardStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  2
                </div>
                <p className="text-sm">Category</p>
              </div>
              <div className={`flex-1 text-center ${wizardStep === 3 ? "text-primary font-medium" : ""}`}>
                <div
                  className={`rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-1 ${wizardStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  3
                </div>
                <p className="text-sm">Location</p>
              </div>
            </div>

            {/* Step 1: Basic Info */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tell us about your business</h3>
                <div>
                  <FormLabel htmlFor="wizard-business-name">Business Name</FormLabel>
                  <Input
                    id="wizard-business-name"
                    placeholder="Your Business Name"
                    value={wizardData.business_name}
                    onChange={(e) => updateWizardData("business_name", e.target.value)}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="wizard-description">Business Description</FormLabel>
                  <Textarea
                    id="wizard-description"
                    placeholder="Describe your business and services"
                    className="min-h-[150px]"
                    value={wizardData.description}
                    onChange={(e) => updateWizardData("description", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Provide a detailed description of your services, expertise, and what sets you apart
                  </p>
                </div>
                <div>
                  <FormLabel htmlFor="wizard-website">Website (Optional)</FormLabel>
                  <Input
                    id="wizard-website"
                    placeholder="https://yourbusiness.com"
                    value={wizardData.website}
                    onChange={(e) => updateWizardData("website", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Category Selection */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select your business category</h3>

                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search sectors..."
                    className="pl-8"
                    value={sectorSearchQuery}
                    onChange={(e) => setSectorSearchQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {filteredSectors.map((sector) => {
                    const SectorIcon = getSectorIcon(sector.name)
                    const isSelected = wizardData.sector === sector.id.toString()

                    return (
                      <div
                        key={sector.id}
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all hover:border-primary",
                          isSelected ? "border-primary bg-primary/5" : "",
                        )}
                        onClick={() => {
                          updateWizardData("sector", sector.id.toString())
                          setSelectedSector(sector.id.toString())
                          updateWizardData("subcategory", "")
                        }}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <div
                            className={cn(
                              "p-2 rounded-full",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            <SectorIcon className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium">{sector.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {selectedSector && (
                  <>
                    <h4 className="font-medium">Select a subcategory</h4>

                    <div className="relative mb-4">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search subcategories..."
                        className="pl-8"
                        value={subcategorySearchQuery}
                        onChange={(e) => setSubcategorySearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {searchFilteredSubcategories.map((subcategory) => {
                        const isSelected = wizardData.subcategory === subcategory.id.toString()

                        return (
                          <div
                            key={subcategory.id}
                            className={cn(
                              "border rounded-lg p-3 cursor-pointer transition-all hover:border-primary",
                              isSelected ? "border-primary bg-primary/5" : "",
                            )}
                            onClick={() => updateWizardData("subcategory", subcategory.id.toString())}
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn("w-4 h-4 rounded-full", isSelected ? "bg-primary" : "bg-muted")}></div>
                              <span>{subcategory.name}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Location */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Where is your business located?</h3>

                <div>
                  <FormLabel htmlFor="wizard-address">Address</FormLabel>
                  <Input
                    id="wizard-address"
                    placeholder="123 Main St"
                    value={wizardData.address}
                    onChange={(e) => updateWizardData("address", e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <FormLabel>County</FormLabel>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {popularCounties.map((county) => (
                          <Badge
                            key={county}
                            variant={wizardData.county === county ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => updateWizardData("county", county)}
                          >
                            {county}
                          </Badge>
                        ))}
                      </div>
                      <Combobox
                        items={counties.map((county) => ({ label: county, value: county }))}
                        placeholder="Search for a county..."
                        value={wizardData.county}
                        onChange={(value) => {
                          updateWizardData("county", value)
                          updateWizardData("subcounty", "")
                        }}
                      />
                    </div>
                  </div>

                  {wizardData.county && (
                    <div>
                      <FormLabel>Sub-County</FormLabel>
                      <Combobox
                        items={subcounties.map((subcounty) => ({ label: subcounty, value: subcounty }))}
                        placeholder="Select a sub-county..."
                        value={wizardData.subcounty}
                        onChange={(value) => updateWizardData("subcounty", value)}
                        disabled={!wizardData.county}
                      />
                    </div>
                  )}

                  <div>
                    <FormLabel htmlFor="wizard-town">Town</FormLabel>
                    <Input
                      id="wizard-town"
                      placeholder="Town"
                      value={wizardData.town}
                      onChange={(e) => updateWizardData("town", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center p-4 bg-muted rounded-lg mt-4">
                  <MapPin className="h-5 w-5 text-primary mr-2" />
                  <div className="text-sm">
                    <p className="font-medium">Location Preview</p>
                    <p className="text-muted-foreground">
                      {wizardData.address && `${wizardData.address}, `}
                      {wizardData.town && `${wizardData.town}, `}
                      {wizardData.subcounty && `${wizardData.subcounty}, `}
                      {wizardData.county}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              {wizardStep > 1 ? (
                <Button variant="outline" onClick={prevWizardStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setShowBusinessWizard(false)}>
                  Cancel
                </Button>
              )}

              {wizardStep === 3 ? (
                <Button
                  onClick={completeBusinessWizard}
                  disabled={
                    businessSubmitting ||
                    !wizardData.address ||
                    !wizardData.county ||
                    !wizardData.subcounty ||
                    !wizardData.town
                  }
                >
                  {businessSubmitting ? "Saving..." : "Complete"}
                </Button>
              ) : (
                <Button
                  onClick={nextWizardStep}
                  disabled={
                    (wizardStep === 1 && (!wizardData.business_name || !wizardData.description)) ||
                    (wizardStep === 2 && (!wizardData.sector || !wizardData.subcategory))
                  }
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Item Add Modal */}
      <Dialog open={isPortfolioModalOpen} onOpenChange={setIsPortfolioModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Portfolio Item</DialogTitle>
            <DialogDescription>Add details about your work to showcase your skills and experience</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {portfolioUploadPreview && (
              <div className="relative h-48 w-full">
                <img
                  src={portfolioUploadPreview || "/placeholder.svg"}
                  alt="Preview"
                  className="h-full w-full object-contain rounded-md"
                />
              </div>
            )}

            <div>
              <label htmlFor="portfolio-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="portfolio-title"
                placeholder="e.g., Kitchen Renovation"
                value={portfolioItemTitle}
                onChange={(e) => setPortfolioItemTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="portfolio-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="portfolio-description"
                placeholder="Describe this work..."
                value={portfolioItemDescription}
                onChange={(e) => setPortfolioItemDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelPortfolioUpload}>
              Cancel
            </Button>
            <Button onClick={savePortfolioItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portfolio Item Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Portfolio Item</DialogTitle>
            <DialogDescription>Update the details of your portfolio item</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editingPortfolioIndex !== null && portfolioItems[editingPortfolioIndex] && (
              <div className="relative h-48 w-full">
                <img
                  src={portfolioItems[editingPortfolioIndex].imageUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="h-full w-full object-contain rounded-md"
                />
              </div>
            )}

            <div>
              <label htmlFor="edit-portfolio-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="edit-portfolio-title"
                value={portfolioItemTitle}
                onChange={(e) => setPortfolioItemTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="edit-portfolio-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="edit-portfolio-description"
                value={portfolioItemDescription}
                onChange={(e) => setPortfolioItemDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelPortfolioEdit}>
              Cancel
            </Button>
            <Button onClick={updatePortfolioItem}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

