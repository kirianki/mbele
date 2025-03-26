"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { marketplaceApi } from "@/lib/api"

export default function SearchBar({ className = "", placeholder = "Search providers..." }) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Handle clicks outside the search component to close results
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        performSearch()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const performSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const results = await marketplaceApi.getProviders(`?search=${encodeURIComponent(query)}`)
      setSearchResults(results.slice(0, 5)) // Limit to 5 results for dropdown
      setShowResults(true)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    router.push(`/marketplace?search=${encodeURIComponent(query)}`)
    setShowResults(false)
  }

  const handleResultClick = (providerId: number) => {
    router.push(`/marketplace/providers/${providerId}`)
    setShowResults(false)
    setQuery("")
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            className="pl-8 pr-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
          />
          {isSearching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <Button type="submit" className="sr-only">
          Search
        </Button>
      </form>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border bg-background shadow-md">
          <ul className="py-2">
            {searchResults.map((result) => (
              <li key={result.id}>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-muted flex items-center"
                  onClick={() => handleResultClick(result.id)}
                >
                  <div>
                    <div className="font-medium">{result.business_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.sector_name} • {result.subcategory_name}
                    </div>
                  </div>
                </button>
              </li>
            ))}
            <li className="px-4 py-2 border-t">
              <button className="w-full text-center text-sm text-primary hover:underline" onClick={handleSearch}>
                See all results for "{query}"
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

