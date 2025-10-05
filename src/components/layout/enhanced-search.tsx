'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, TrendingUp, Folder, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { SafeImage } from '@/components/ui/safe-image'
import { searchResultImages } from '@/lib/utils/category-images'

interface SearchResult {
  id: string
  name: string
  price: number
  image: string
  category: string
  slug: string
}

interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'category' | 'brand'
  count?: number
}

// Mock data for search suggestions and results
const mockRecentSearches = [
  'iPhone 15',
  'Nike ayakkabı',
  'Laptop',
  'Kitap'
]

const mockTrendingSearches = [
  'AirPods Pro',
  'MacBook Air',
  'Samsung Galaxy',
  'PlayStation 5'
]

const mockSuggestions: SearchSuggestion[] = [
  { id: '1', text: 'iPhone 15 Pro', type: 'product' },
  { id: '2', text: 'iPhone 14', type: 'product' },
  { id: '3', text: 'Elektronik', type: 'category', count: 1250 },
  { id: '4', text: 'Apple', type: 'brand', count: 89 },
]

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max 256GB',
    price: 65999,
    image: searchResultImages[0],
    category: 'Elektronik',
    slug: 'iphone-15-pro-max-256gb'
  },
  {
    id: '2',
    name: 'iPhone 15 Pro 128GB',
    price: 54999,
    image: searchResultImages[1],
    category: 'Elektronik',
    slug: 'iphone-15-pro-128gb'
  },
  {
    id: '3',
    name: 'iPhone 15 Plus 256GB',
    price: 49999,
    image: searchResultImages[2],
    category: 'Elektronik',
    slug: 'iphone-15-plus-256gb'
  }
]

interface EnhancedSearchProps {
  className?: string
  placeholder?: string
}

export function EnhancedSearch({ className, placeholder = "Ürün, kategori veya marka arayın..." }: EnhancedSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>(mockRecentSearches)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mock search function
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (searchQuery.length > 0) {
      // Filter suggestions based on query
      const filteredSuggestions = mockSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSuggestions(filteredSuggestions)
      
      // Filter results based on query
      const filteredResults = mockSearchResults.filter(result =>
        result.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setResults(filteredResults)
    } else {
      setSuggestions([])
      setResults([])
    }
    
    setIsLoading(false)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(true)
    
    if (value.length > 0) {
      performSearch(value)
    } else {
      setSuggestions([])
      setResults([])
    }
  }

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(item => item !== searchQuery)]
        return updated.slice(0, 4)
      })
      
      // Navigate to search results
      window.location.href = `/arama?q=${encodeURIComponent(searchQuery)}`
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setIsOpen(false)
    handleSearch(suggestion.text)
  }

  // Handle recent search click
  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
    setIsOpen(false)
    handleSearch(search)
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query)
              setIsOpen(false)
            }
          }}
          className="pl-10 pr-10 h-11 text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-[500px] overflow-y-auto">
          {query.length === 0 ? (
            // Empty state - show recent and trending searches
            <div className="p-4 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                    <Clock className="h-4 w-4" />
                    Son Aramalar
                  </h3>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="flex items-center gap-2 w-full text-left p-2 hover:bg-accent rounded-md"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  <TrendingUp className="h-4 w-4" />
                  Popüler Aramalar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mockTrendingSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Search results
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Öneriler</h3>
                      <div className="space-y-1">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="flex items-center justify-between w-full p-2 text-left hover:bg-accent rounded-md touch-manipulation"
                            style={{ 
                              WebkitTapHighlightColor: 'transparent',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none',
                              userSelect: 'none'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {suggestion.type === 'category' ? (
                                <Folder className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Tag className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm">{suggestion.text}</span>
                            </div>
                            {suggestion.count && (
                              <span className="text-xs text-muted-foreground">
                                {suggestion.count} ürün
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Results */}
                  {results.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Ürünler</h3>
                      <div className="space-y-1">
                        {results.map((result) => (
                          <Link
                            key={result.id}
                            href={`/urunler/${result.slug}`}
                            className="flex items-center gap-3 p-2 hover:bg-accent rounded-md touch-manipulation"
                            onClick={() => setIsOpen(false)}
                            style={{ 
                              WebkitTapHighlightColor: 'transparent',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none',
                              userSelect: 'none'
                            }}
                          >
                            <SafeImage
                              src={result.image}
                              alt={result.name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.name}</p>
                              <p className="text-xs text-muted-foreground">{result.category}</p>
                            </div>
                            <div className="text-sm font-medium">
                              {result.price.toLocaleString('tr-TR')} ₺
                            </div>
                          </Link>
                        ))}
                      </div>
                      
                      {results.length >= 3 && (
                        <div className="pt-2 border-t mt-2">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-center"
                            onClick={() => handleSearch(query)}
                          >
                            Tüm sonuçları görüntüle
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No results */}
                  {!isLoading && suggestions.length === 0 && results.length === 0 && query.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        &quot;{query}&quot; için sonuç bulunamadı
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}