"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, MapPin, Search, Filter, X } from "lucide-react"
import { marketplaceApi } from "@/lib/api"
import kenyaCounties from "@/lib/kenya-counties.json"
import { motion, AnimatePresence } from "framer-motion"

type Provider = {
  id: number
  business_name: string
  sector: number
  sector_name: string
  user_profile_picture: string
  profile_picture?: string
  subcategory: number
  subcategory_name: string
  address: string
  average_rating?: number
  description: string
  county?: string
  subcounty?: string
}

type Sector = {
  id: number
  name: string
}

type Subcategory = {
  id: number
  name: string
  sector: number
}

type PaginatedProviders = {
  count: number
  next: string | null
  previous: string | null
  results: Provider[]
}

const getCountiesData = () => {
  try {
    return kenyaCounties?.counties || []
  } catch (error) {
    console.error("Error loading counties data:", error)
    return []
  }
}

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const [providers, setProviders] = useState<Provider[]>([])
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [prevPage, setPrevPage] = useState<string | null>(null)
  const [sectors, setSectors] = useState<Sector[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSector, setSelectedSector] = useState<string>("all")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all")
  const [selectedCounty, setSelectedCounty] = useState<string>("all")
  const [selectedSubcounty, setSelectedSubcounty] = useState<string>("all")
  const [minRating, setMinRating] = useState<string>("all")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const countiesData = getCountiesData()
  const filteredSubcounties = selectedCounty && selectedCounty !== "all"
    ? countiesData.find((c) => c.county === selectedCounty)?.subcounties || []
    : []

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const fetchProviders = async (queryParams: string = "") => {
    try {
      setLoading(true)
      const data: PaginatedProviders = await marketplaceApi.getProviders(queryParams)
      setProviders(data.results)
      setNextPage(data.next)
      setPrevPage(data.previous)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching providers:", err)
      setError("Failed to load providers")
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const searchParam = searchParams.get("search")
        if (searchParam) {
          setSearchQuery(searchParam)
        }

        let queryParams = ""
        if (searchParam) {
          queryParams += `?search=${encodeURIComponent(searchParam)}`
        }

        const [providersData, sectorsData, subcategoriesData] = await Promise.all([
          marketplaceApi.getProviders(queryParams),
          marketplaceApi.getSectors(),
          marketplaceApi.getSubcategories(),
        ])

        setProviders(providersData.results)
        setNextPage(providersData.next)
        setPrevPage(providersData.previous)
        setSectors(sectorsData)
        setSubcategories(subcategoriesData)

        const sectorParam = searchParams.get("sector") || "all"
        const subcategoryParam = searchParams.get("subcategory") || "all"
        const countyParam = searchParams.get("county") || "all"
        const subcountyParam = searchParams.get("subcounty") || "all"
        const ratingParam = searchParams.get("rating") || "all"

        setSelectedSector(sectorParam)
        if (sectorParam && sectorParam !== "all") {
          const filteredSubs = subcategoriesData.filter((sub: Subcategory) => 
            sub.sector.toString() === sectorParam
          )
          setFilteredSubcategories(filteredSubs)
        }
        
        setSelectedSubcategory(subcategoryParam)
        setSelectedCounty(countyParam)
        setSelectedSubcounty(subcountyParam)
        setMinRating(ratingParam)

        setLoading(false)
      } catch (err) {
        console.error("Error fetching marketplace data:", err)
        setError("Failed to load marketplace data")
        setLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  useEffect(() => {
    if (selectedSector && selectedSector !== "all") {
      const filtered = subcategories.filter((sub) => sub.sector.toString() === selectedSector)
      setFilteredSubcategories(filtered)
    } else {
      setFilteredSubcategories([])
      setSelectedSubcategory("all")
    }
  }, [selectedSector, subcategories])

  const handleSearch = async () => {
    try {
      setLoading(true);
      let queryParams = "";
  
      if (searchQuery) {
        queryParams += `?search=${encodeURIComponent(searchQuery)}`;
      }
  
      if (selectedSector && selectedSector !== "all") {
        queryParams += queryParams ? `&sector=${selectedSector}` : `?sector=${selectedSector}`;
      }
  
      if (selectedSubcategory && selectedSubcategory !== "all") {
        queryParams += queryParams ? `&subcategory=${selectedSubcategory}` : `?subcategory=${selectedSubcategory}`;
      }
  
      if (selectedCounty && selectedCounty !== "all") {
        queryParams += queryParams ? `&county=${selectedCounty}` : `?county=${selectedCounty}`;
      }
  
      if (selectedSubcounty && selectedSubcounty !== "all") {
        queryParams += queryParams ? `&subcounty=${selectedSubcounty}` : `?subcounty=${selectedSubcounty}`;
      }
  
      if (minRating && minRating !== "all") {
        queryParams += queryParams ? `&min_avg_rating=${minRating}` : `?min_avg_rating=${minRating}`;
      }
  
      await fetchProviders(queryParams);
      setLoading(false);
    } catch (err) {
      console.error("Error searching providers:", err);
      setError("Failed to search providers");
      setLoading(false);
    }
  };

  const resetFilters = async () => {
    setSearchQuery("")
    setSelectedSector("all")
    setSelectedSubcategory("all")
    setSelectedCounty("all")
    setSelectedSubcounty("all")
    setMinRating("all")
    setFilteredSubcategories([])
    setShowMobileFilters(false)

    try {
      setLoading(true)
      await fetchProviders()
    } catch (err) {
      console.error("Error resetting filters:", err)
      setError("Failed to reset filters")
      setLoading(false)
    }
  }

  const handleNextPage = async () => {
    if (nextPage) {
      try {
        setLoading(true)
        const nextUrl = new URL(nextPage)
        const query = nextUrl.search
        const data: PaginatedProviders = await marketplaceApi.getProviders(query)
        setProviders(data.results)
        setNextPage(data.next)
        setPrevPage(data.previous)
        setLoading(false)
      } catch (err) {
        console.error("Error loading next page:", err)
        setError("Failed to load next page")
        setLoading(false)
      }
    }
  }
  
  const handlePrevPage = async () => {
    if (prevPage) {
      try {
        setLoading(true)
        const prevUrl = new URL(prevPage)
        const query = prevUrl.search
        const data: PaginatedProviders = await marketplaceApi.getProviders(query)
        setProviders(data.results)
        setNextPage(data.next)
        setPrevPage(data.previous)
        setLoading(false)
      } catch (err) {
        console.error("Error loading previous page:", err)
        setError("Failed to load previous page")
        setLoading(false)
      }
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
              fetchProviders().then(() => setLoading(false))
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">Find and connect with service providers in your area</p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <span>Filters</span>
            <motion.div
              animate={{ rotate: showMobileFilters ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Filter className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>

        {/* Filter Section */}
        <AnimatePresence>
          {(showMobileFilters || !isMobile) && (
            <motion.div
              initial={isMobile ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
              animate={isMobile ? { 
                opacity: showMobileFilters ? 1 : 0,
                height: showMobileFilters ? 'auto' : 0
              } : { opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <motion.div
                className="bg-background p-4 rounded-lg border shadow-sm"
                initial={isMobile ? { y: -20 } : { y: 0 }}
                animate={isMobile ? { y: showMobileFilters ? 0 : -20 } : { y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-medium text-lg">Filter Providers</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear all
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSearch}
                      className="hidden md:inline-flex"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Search Input */}
                  <div className="md:col-span-2 lg:col-span-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search providers..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearch()
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Sector Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Sector
                    </label>
                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All sectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sectors</SelectItem>
                        {sectors?.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id.toString()}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcategory Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Subcategory
                    </label>
                    <Select 
                      value={selectedSubcategory} 
                      onValueChange={setSelectedSubcategory} 
                      disabled={!selectedSector || selectedSector === "all"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All subcategories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All subcategories</SelectItem>
                        {filteredSubcategories?.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* County Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      County
                    </label>
                    <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All counties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All counties</SelectItem>
                        {countiesData?.map((county) => (
                          <SelectItem key={county.county} value={county.county}>
                            {county.county}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcounty Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Subcounty
                    </label>
                    <Select 
                      value={selectedSubcounty} 
                      onValueChange={setSelectedSubcounty} 
                      disabled={!selectedCounty || selectedCounty === "all"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All subcounties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All subcounties</SelectItem>
                        {filteredSubcounties?.map((subcounty) => (
                          <SelectItem key={subcounty} value={subcounty}>
                            {subcounty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Minimum Rating
                    </label>
                    <Select value={minRating} onValueChange={setMinRating}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any rating</SelectItem>
                        <SelectItem value="4">4+ stars</SelectItem>
                        <SelectItem value="3">3+ stars</SelectItem>
                        <SelectItem value="2">2+ stars</SelectItem>
                        <SelectItem value="1">1+ stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mobile Apply Button */}
                <div className="mt-4 md:hidden">
                  <Button onClick={handleSearch} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6)
              .fill(null)
              .map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-6 pt-0">
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
          ) : providers?.length === 0 ? (
            <motion.div
              className="col-span-full text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-medium mb-2">No providers found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button onClick={resetFilters}>Clear Filters</Button>
            </motion.div>
          ) : (
            providers?.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <img
                      src={provider.user_profile_picture || "/placeholder.svg?height=200&width=400"}
                      alt={provider.business_name}
                      className="h-48 w-full object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-lg font-semibold">{provider.business_name}</h3>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <span>
                          {provider.sector_name} • {provider.subcategory_name}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        {provider.average_rating && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-primary text-primary mr-1" />
                            <span className="text-sm font-medium">{provider.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                        {provider.address && (
                          <div className="flex items-center ml-4">
                            <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                            <span className="text-sm text-muted-foreground line-clamp-1">{provider.address}</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-sm line-clamp-2">{provider.description}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between p-6 pt-0">
                    <Link href={`/marketplace/providers/${provider.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && providers?.length > 0 && (
          <motion.div 
            className="flex justify-center mt-8 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {prevPage && (
              <Button variant="outline" onClick={handlePrevPage}>
                Previous
              </Button>
            )}
            {nextPage && (
              <Button variant="outline" onClick={handleNextPage}>
                Next
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}