/**
 * Tests for base API utility functions
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '@/src/mocks/server';
import { http, HttpResponse, delay } from 'msw';
import { fetchAPI, buildURL, clearCache, APIError } from './base';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  clearCache();
});
afterAll(() => server.close());

describe('buildURL', () => {
  it('should build URL with query parameters', () => {
    const url = buildURL('https://api.example.com/data', {
      key: 'test-key',
      limit: 10,
      active: true,
    });

    expect(url).toBe('https://api.example.com/data?key=test-key&limit=10&active=true');
  });

  it('should handle empty parameters', () => {
    const url = buildURL('https://api.example.com/data', {});
    expect(url).toBe('https://api.example.com/data');
  });

  it('should encode special characters', () => {
    const url = buildURL('https://api.example.com/search', {
      query: 'hello world',
      filter: 'type=photo',
    });

    expect(url).toContain('hello+world');
    expect(url).toContain('type%3Dphoto');
  });
});

describe('fetchAPI', () => {
  const testUrl = 'https://api.test.com/data';

  it('should fetch data successfully', async () => {
    server.use(
      http.get(testUrl, async () => {
        return HttpResponse.json({ success: true, data: 'test' });
      })
    );

    const result = await fetchAPI<{ success: boolean; data: string }>(testUrl);

    expect(result).toEqual({ success: true, data: 'test' });
  });

  it('should handle 404 errors', async () => {
    server.use(
      http.get(testUrl, async () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    await expect(fetchAPI(testUrl)).rejects.toThrow(APIError);
    await expect(fetchAPI(testUrl)).rejects.toThrow('API request failed');
  });

  it('should handle 500 errors with retry', async () => {
    let attempts = 0;

    server.use(
      http.get(testUrl, async () => {
        attempts++;
        if (attempts < 3) {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        }
        return HttpResponse.json({ success: true });
      })
    );

    // retries=2 means: 1 initial attempt + 2 retries = 3 total attempts
    const result = await fetchAPI(testUrl, { retries: 2, retryDelay: 10 });

    expect(result).toEqual({ success: true });
    expect(attempts).toBe(3);
  });

  it('should not retry on 4xx errors', async () => {
    clearCache(); // Ensure no cached response
    let attempts = 0;

    server.use(
      http.get(testUrl, async () => {
        attempts++;
        return HttpResponse.json({ error: 'Bad request' }, { status: 400 });
      })
    );

    await expect(
      fetchAPI(testUrl, { retries: 3 })
    ).rejects.toThrow();

    expect(attempts).toBe(1); // Should not retry on 4xx
  });

  it('should handle timeout', async () => {
    clearCache(); // Ensure no cached response

    server.use(
      http.get(testUrl, async () => {
        await delay(2000); // 2 second delay
        return HttpResponse.json({ success: true });
      })
    );

    await expect(
      fetchAPI(testUrl, { timeout: 100 }) // 100ms timeout
    ).rejects.toThrow('timeout');
  }, 10000); // Increase test timeout to 10 seconds

  it('should cache responses when enabled', async () => {
    clearCache(); // Start with clean cache
    let callCount = 0;

    server.use(
      http.get(testUrl, async () => {
        callCount++;
        return HttpResponse.json({ count: callCount });
      })
    );

    // First call should hit the API
    const result1 = await fetchAPI(testUrl, { cache: true, cacheDuration: 5000 });
    expect(result1).toEqual({ count: 1 });

    // Second call should use cache
    const result2 = await fetchAPI(testUrl, { cache: true, cacheDuration: 5000 });
    expect(result2).toEqual({ count: 1 });
    expect(callCount).toBe(1); // API should only be called once
  });

  it('should not cache when cache is disabled', async () => {
    clearCache(); // Start with clean cache
    let callCount = 0;

    server.use(
      http.get(testUrl, async () => {
        callCount++;
        return HttpResponse.json({ count: callCount });
      })
    );

    // First call
    const result1 = await fetchAPI(testUrl, { cache: false });
    expect(result1).toEqual({ count: 1 });

    // Second call should hit API again
    const result2 = await fetchAPI(testUrl, { cache: false });
    expect(result2).toEqual({ count: 2 });
    expect(callCount).toBe(2);
  });

  it('should handle network errors', async () => {
    server.use(
      http.get(testUrl, async () => {
        throw new Error('Network error');
      })
    );

    await expect(
      fetchAPI(testUrl, { retries: 1, retryDelay: 10 })
    ).rejects.toThrow();
  });
});

describe('clearCache', () => {
  const testUrl = 'https://api.test.com/cached';

  it('should clear specific cache entry', async () => {
    clearCache(); // Start with clean cache
    let callCount = 0;

    server.use(
      http.get(testUrl, async () => {
        callCount++;
        return HttpResponse.json({ count: callCount });
      })
    );

    // Cache a response
    await fetchAPI(testUrl, { cache: true });
    expect(callCount).toBe(1);

    // Clear the cache
    clearCache(testUrl);

    // Should hit API again
    await fetchAPI(testUrl, { cache: true });
    expect(callCount).toBe(2);
  });

  it('should clear all cache entries', async () => {
    clearCache(); // Start with clean cache
    const url1 = 'https://api.test.com/data1';
    const url2 = 'https://api.test.com/data2';
    let callCount = 0;

    server.use(
      http.get(url1, async () => {
        callCount++;
        return HttpResponse.json({ id: 1 });
      }),
      http.get(url2, async () => {
        callCount++;
        return HttpResponse.json({ id: 2 });
      })
    );

    // Cache both responses
    await fetchAPI(url1, { cache: true });
    await fetchAPI(url2, { cache: true });
    expect(callCount).toBe(2);

    // Clear all cache
    clearCache();

    // Both should hit API again
    await fetchAPI(url1, { cache: true });
    await fetchAPI(url2, { cache: true });
    expect(callCount).toBe(4);
  });
});
