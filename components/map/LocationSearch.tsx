'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2, MapPin, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMapStore } from '@/src/stores/mapStore';
import { searchLocations } from '@/app/actions/geocoding';
import type { GeocodeResult } from '@/src/types/geocoding.types';

const DEBOUNCE_DELAY = 300;

export function LocationSearch() {
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    recentSearches,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    setSearchError,
    clearSearch,
    selectSearchResult,
  } = useMapStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Perform search
  const performSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      const { data, error } = await searchLocations(query);

      setIsSearching(false);

      if (error) {
        setSearchError(error);
        setSearchResults([]);
      } else if (data) {
        setSearchResults(data);
      }
    },
    [setIsSearching, setSearchError, setSearchResults]
  );

  // Debounced search on input change
  const handleInputChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the search
      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, DEBOUNCE_DELAY);
    },
    [setSearchQuery, performSearch]
  );

  // Handle result selection
  const handleSelectResult = useCallback(
    (result: GeocodeResult) => {
      selectSearchResult(result);
      setShowDropdown(false);
    },
    [selectSearchResult]
  );

  // Handle recent search selection
  const handleSelectRecent = useCallback(
    (result: GeocodeResult) => {
      selectSearchResult(result);
      setShowDropdown(false);
    },
    [selectSearchResult]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    clearSearch();
    setShowDropdown(false);
    inputRef.current?.focus();
  }, [clearSearch]);

  // Handle form submit (search on Enter)
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      }
    },
    [searchQuery, performSearch]
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown on focus or when there are results
  const shouldShowDropdown =
    showDropdown &&
    (searchResults.length > 0 ||
      recentSearches.length > 0 ||
      isSearching ||
      !!searchError);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="pl-9 pr-9"
            aria-label="Search location"
            aria-expanded={shouldShowDropdown || undefined}
            aria-haspopup="listbox"
          />
          {(searchQuery || isSearching) && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClear}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
          role="listbox"
        >
          {/* Error message */}
          {searchError && (
            <div className="p-3 text-sm text-destructive">{searchError}</div>
          )}

          {/* Loading state */}
          {isSearching && !searchError && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {/* Search results */}
          {!isSearching && searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                Results
              </div>
              {searchResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  onSelect={handleSelectResult}
                />
              ))}
            </div>
          )}

          {/* No results */}
          {!isSearching &&
            searchQuery.length >= 2 &&
            searchResults.length === 0 &&
            !searchError && (
              <div className="p-3 text-sm text-muted-foreground">
                No locations found for &quot;{searchQuery}&quot;
              </div>
            )}

          {/* Recent searches (show when no query) */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                Recent Searches
              </div>
              {recentSearches.map((search) => (
                <RecentSearchItem
                  key={search.result.id}
                  result={search.result}
                  onSelect={handleSelectRecent}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SearchResultItemProps {
  result: GeocodeResult;
  onSelect: (result: GeocodeResult) => void;
}

function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-start gap-3 px-3 py-2 text-left text-sm',
        'hover:bg-accent focus:bg-accent focus:outline-none'
      )}
      onClick={() => onSelect(result)}
      role="option"
      aria-selected={false}
    >
      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{result.shortName}</div>
        <div className="truncate text-xs text-muted-foreground">
          {result.displayName}
        </div>
      </div>
    </button>
  );
}

interface RecentSearchItemProps {
  result: GeocodeResult;
  onSelect: (result: GeocodeResult) => void;
}

function RecentSearchItem({ result, onSelect }: RecentSearchItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-start gap-3 px-3 py-2 text-left text-sm',
        'hover:bg-accent focus:bg-accent focus:outline-none'
      )}
      onClick={() => onSelect(result)}
      role="option"
      aria-selected={false}
    >
      <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{result.shortName}</div>
        <div className="truncate text-xs text-muted-foreground">
          {result.address?.city || result.address?.county || ''}
          {result.address?.postcode ? ` · ${result.address.postcode}` : ''}
        </div>
      </div>
    </button>
  );
}
