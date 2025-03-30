"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, MapPin, Search } from "lucide-react"
import { marketplaceApi } from "@/lib/api"

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
  const [selectedSector, setSelectedSector] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("")

  const fetchProviders = async (queryParams: string = "") => {
    try {
      const data: PaginatedProviders = await marketplaceApi.getProviders(queryParams)
      setProviders(data.results)
      setNextPage(data.next)
      setPrevPage(data.previous)
    } catch (err) {
      console.error("Error fetching providers:", err)
      setError("Failed to load providers")
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

        const sectorParam = searchParams.get("sector")
        const subcategoryParam = searchParams.get("subcategory")

        if (sectorParam) {
          setSelectedSector(sectorParam)
          const filteredSubs = subcategoriesData.filter((sub: Subcategory) => 
            sub.sector.toString() === sectorParam
          )
          setFilteredSubcategories(filteredSubs)
        }
        
        if (subcategoryParam) {
          setSelectedSubcategory(subcategoryParam)
        }

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
      setSelectedSubcategory("")
    }
  }, [selectedSector, subcategories])

  const handleSearch = async () => {
    try {
      setLoading(true)
      let queryParams = ""
      if (searchQuery) {
        queryParams += `?search=${encodeURIComponent(searchQuery)}`
      }
      if (selectedSector && selectedSector !== "all") {
        queryParams += queryParams ? `&sector=${selectedSector}` : `?sector=${selectedSector}`
      }
      if (selectedSubcategory && selectedSubcategory !== "all") {
        queryParams += queryParams ? `&subcategory=${selectedSubcategory}` : `?subcategory=${selectedSubcategory}`
      }

      await fetchProviders(queryParams)
      setLoading(false)
    } catch (err) {
      console.error("Error searching providers:", err)
      setError("Failed to search providers")
      setLoading(false)
    }
  }

  const resetFilters = async () => {
    setSearchQuery("")
    setSelectedSector("")
    setSelectedSubcategory("")
    setFilteredSubcategories([])

    try {
      setLoading(true)
      await fetchProviders()
      setLoading(false)
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

        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search providers..."
                className="pl-8"
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
          <div>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <SelectValue placeholder="All sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sectors</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id.toString()}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} disabled={!selectedSector}>
              <SelectTrigger>
                <SelectValue placeholder="All subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subcategories</SelectItem>
                {filteredSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 md:col-span-4">
            <Button onClick={handleSearch}>Search</Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {loading ? (
            Array(6)
              .fill(null)
              .map((_, index) => (
                <Card key={index} className="overflow-hidden">
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
              ))
          ) : providers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium mb-2">No providers found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button onClick={resetFilters}>Clear Filters</Button>
            </div>
          ) : (
            providers.map((provider) => (
              <Card key={provider.id} className="overflow-hidden">
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
            ))
          )}
        </div>

        {!loading && providers.length > 0 && (
          <div className="flex justify-center mt-8 gap-4">
            {prevPage && (
              <Button onClick={handlePrevPage}>
                Previous
              </Button>
            )}
            {nextPage && (
              <Button onClick={handleNextPage}>
                Next
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}