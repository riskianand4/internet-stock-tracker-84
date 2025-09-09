import { ENV, API_ENDPOINTS } from '@/config/environment';
import { logger } from '@/utils/logger';
import { apiCircuitBreakers, requestDeduplicator } from '@/utils/circuitBreaker';
import { globalRequestThrottler } from '@/utils/requestThrottler';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse extends ApiResponse {
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    permissions?: string[];
  };
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class ApiClient {
  private config: ApiClientConfig;
  private token: string | null = null;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseURL: ENV.API_BASE_URL,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
  }

  getBaseURL(): string {
    return this.config.baseURL;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 1
  ): Promise<ApiResponse<T>> {
    // Check global rate limiting
    if (!globalRequestThrottler.canMakeRequest(endpoint)) {
      throw new ApiClientError('Rate limit exceeded', 429, 'RATE_LIMITED', endpoint);
    }
    
    globalRequestThrottler.recordRequest(endpoint);
    
    const url = `${this.config.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response statuses
      if (response.status === 401) {
        this.token = null; // Clear invalid token
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        logger.info('401 Unauthorized - clearing auth tokens');
        throw new ApiClientError('Authentication required', 401, 'UNAUTHORIZED', endpoint);
      }

      if (response.status === 403) {
        throw new ApiClientError('Access forbidden', 403, 'FORBIDDEN', endpoint);
      }

      if (response.status === 429) {
        // Rate limited - implement exponential backoff
        if (attempt <= this.config.retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          return this.makeRequest(endpoint, options, attempt + 1);
        }
        throw new ApiClientError('Too many requests', 429, 'RATE_LIMITED', endpoint);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiClientError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          endpoint
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiClientError(`Request timeout: ${endpoint}`, 408, 'TIMEOUT', endpoint);
      }

      // Network error - retry if possible
      if (attempt <= this.config.retries && !(error instanceof ApiClientError)) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        return this.makeRequest(endpoint, options, attempt + 1);
      }

      throw new ApiClientError(
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        'NETWORK_ERROR',
        endpoint
      );
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    // Stable key per endpoint + token to properly deduplicate concurrent calls
    const requestKey = `GET:${endpoint}:${this.token?.substring(0, 10) || 'anonymous'}`;
    
    return requestDeduplicator.deduplicate(requestKey, () =>
      circuitBreaker.execute(() => 
        this.makeRequest<T>(endpoint, { method: 'GET' })
      )
    );
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.execute(() =>
      this.makeRequest<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.execute(() =>
      this.makeRequest<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.execute(() =>
      this.makeRequest<T>(endpoint, {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return circuitBreaker.execute(() =>
      this.makeRequest<T>(endpoint, { method: 'DELETE' })
    );
  }

  private getCircuitBreaker(endpoint: string) {
    if (endpoint.includes('/products')) return apiCircuitBreakers.products;
    if (endpoint.includes('/analytics')) return apiCircuitBreakers.analytics;
    if (endpoint.includes('/auth')) return apiCircuitBreakers.auth;
    return apiCircuitBreakers.products; // default
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    // Skip circuit breaker for health checks
    return this.makeRequest(API_ENDPOINTS.HEALTH, { method: 'GET' });
  }

  // Auth methods (disable retry for auth)
  async login(email: string, password: string): Promise<LoginResponse> {
    // Reset circuit breakers on login attempt
    Object.values(apiCircuitBreakers).forEach(cb => cb.reset());
    
    return this.makeRequest(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }, 1); // Single attempt, no retries
  }

  async refreshToken(): Promise<ApiResponse> {
    return this.post(API_ENDPOINTS.AUTH.REFRESH);
  }

  async verifyToken(): Promise<ApiResponse> {
    return this.get(API_ENDPOINTS.AUTH.VERIFY);
  }
}

// Default client instance
export const apiClient = new ApiClient();
export default apiClient;