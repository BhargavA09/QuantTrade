/**
 * Resilient HTTP Transport Client with Request Deduplication, Fast-Fail Retry,
 * and In-Memory / Session Storage Caching.
 * 
 * Follows Single Responsibility (SRP) and Dependency Inversion (DIP).
 */

export class ApiClientError extends Error {
  public status?: number;
  public details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

export class ApiNotFoundError extends ApiClientError {
  constructor(resource: string) {
    super(`Resource not found: ${resource}`, 404);
    this.name = 'ApiNotFoundError';
  }
}

export class ApiNetworkError extends ApiClientError {
  constructor(message: string, details?: any) {
    super(message, 0, details);
    this.name = 'ApiNetworkError';
  }
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface RequestOptions extends RequestInit {
  maxRetries?: number;
  timeoutMs?: number;
  skipCache?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultTtlMs: number;

  constructor(
    baseUrl: string = import.meta.env.VITE_API_URL || '',
    defaultTtlMs: number = 1000 * 60 * 60 // 1 hour
  ) {
    this.baseUrl = baseUrl;
    this.defaultTtlMs = defaultTtlMs;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Retrieves data from in-memory cache if not expired.
   */
  public getMemoryCache<T>(key: string, ttlMs: number = this.defaultTtlMs): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Stores data into in-memory cache.
   */
  public setMemoryCache<T>(key: string, data: T): void {
    this.memoryCache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Retrieves data from browser sessionStorage if available and valid.
   */
  public getSessionCache<T>(key: string, ttlMs: number = this.defaultTtlMs): T | null {
    try {
      const cached = sessionStorage.getItem(`logistics_alpha_cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttlMs) {
          return data as T;
        }
      }
    } catch (e) {
      console.warn("Session cache retrieval failed:", e);
    }
    return null;
  }

  /**
   * Stores data in browser sessionStorage.
   */
  public setSessionCache<T>(key: string, data: T): void {
    try {
      sessionStorage.setItem(`logistics_alpha_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Session cache storage failed:", e);
    }
  }

  /**
   * Executes a deduplicated async request so multiple identical concurrent calls share the same Promise.
   */
  public async deduplicate<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(requestId)) {
      return this.pendingRequests.get(requestId) as Promise<T>;
    }
    const promise = fn().finally(() => {
      this.pendingRequests.delete(requestId);
    });
    this.pendingRequests.set(requestId, promise);
    return promise;
  }

  /**
   * Robust fetch wrapper with fast-fail on 400/404, configurable retry, and JSON error handling.
   */
  public async fetchWithRetry<T = any>(
    url: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const { maxRetries = 2, timeoutMs = 12000, ...fetchOptions } = options;
    const fullUrl = `${this.baseUrl}${url}`;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(fullUrl, {
          ...fetchOptions,
          signal: controller.signal
        });
        clearTimeout(timer);

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
          let errorData: any = {};
          if (contentType.includes('application/json')) {
            errorData = await response.json().catch(() => ({}));
          }

          if (response.status === 404) {
            throw new ApiNotFoundError(url);
          }
          if (response.status === 400) {
            throw new ApiClientError(errorData.error || `Bad Request: HTTP ${response.status}`, 400, errorData);
          }
          throw new ApiClientError(errorData.error || `HTTP error! status: ${response.status}`, response.status, errorData);
        }

        if (!contentType.includes('application/json')) {
          throw new ApiClientError(`Expected JSON response but received ${contentType}`, response.status);
        }

        return await response.json();
      } catch (error: any) {
        clearTimeout(timer);
        lastError = error;

        // Immediately fail on non-retryable conditions
        if (error instanceof ApiNotFoundError || (error instanceof ApiClientError && error.status === 400)) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          // Exponential backoff with small jitter
          const delay = 200 * Math.pow(1.5, attempt) + Math.random() * 50;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new ApiNetworkError(`Request to ${url} failed after ${maxRetries} attempts`);
  }

  /**
   * Safely parses JSON string, removing markdown wrappers and handling malformed strings.
   */
  public safeJsonParse<T = any>(text: string | undefined, fallback: T): T {
    if (!text) return fallback;
    try {
      let cleaned = text.replace(/```json\n?|```/g, '').trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      const arrayStart = cleaned.indexOf('[');
      const arrayEnd = cleaned.lastIndexOf(']');

      let start = -1;
      let end = -1;

      if (jsonStart !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) {
        start = jsonStart;
        end = jsonEnd;
      } else if (arrayStart !== -1) {
        start = arrayStart;
        end = arrayEnd;
      }

      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
      }

      try {
        return JSON.parse(cleaned);
      } catch {
        const fixed = cleaned.replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(fixed);
      }
    } catch (e) {
      console.warn("safeJsonParse fallback used:", e);
      return fallback;
    }
  }
}

// Global default singleton client
export const defaultApiClient = new ApiClient();
