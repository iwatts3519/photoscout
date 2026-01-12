/**
 * Base API utility with error handling, retry logic, and caching
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export interface APIOptions extends Omit<RequestInit, 'cache'> {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  cache?: boolean; // Our custom cache option
  cacheDuration?: number; // in milliseconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError('Request timeout', undefined, url);
    }
    throw error;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get cached data if available and not expired
 */
function getCached<T>(key: string, maxAge: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > maxAge) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cache entry
 */
function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Fetch data from an API with retry logic, caching, and error handling
 */
export async function fetchAPI<T>(
  url: string,
  options?: APIOptions
): Promise<T> {
  const opts = options || {};
  const retries = opts.retries ?? 3;
  const retryDelay = opts.retryDelay ?? 1000;
  const timeout = opts.timeout ?? 10000;
  const shouldCache = opts.cache ?? false;
  const cacheDuration = opts.cacheDuration ?? 30 * 60 * 1000;

  // Extract fetch options (exclude our custom APIOptions keys)
  const fetchOptions: RequestInit = {};
  const excludeKeys = ['retries', 'retryDelay', 'timeout', 'cache', 'cacheDuration'];
  for (const key in opts) {
    if (!excludeKeys.includes(key)) {
      (fetchOptions as Record<string, unknown>)[key] = (opts as Record<string, unknown>)[key];
    }
  }

  // Check cache if enabled
  if (shouldCache) {
    const cached = getCached<T>(url, cacheDuration);
    if (cached) {
      return cached;
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions, timeout);

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(
          `API request failed: ${response.statusText} - ${errorText}`,
          response.status,
          url
        );
      }

      const data = await response.json();

      // Cache successful response if enabled
      if (shouldCache) {
        setCache(url, data);
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.statusCode && error.statusCode < 500) {
        throw error;
      }

      // Don't retry if no retries left
      if (attempt === retries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw new APIError(
    `API request failed after ${retries + 1} attempts: ${lastError?.message}`,
    undefined,
    url
  );
}

/**
 * Build URL with query parameters
 */
export function buildURL(base: string, params: Record<string, string | number | boolean>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  return url.toString();
}

/**
 * Clear cache for a specific URL or all cache
 */
export function clearCache(url?: string): void {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}
