interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  name?: string;
}

export class CircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttempt = Date.now();
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: options.failureThreshold,
      resetTimeout: options.resetTimeout,
      name: options.name || 'CircuitBreaker',
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        console.log(`🚫 ${this.options.name}: Circuit breaker is OPEN, blocking request`);
        throw new Error(`Circuit breaker is OPEN for ${this.options.name}`);
      }
      
      // Try to close the circuit
      this.state = 'HALF_OPEN';
      console.log(`🔄 ${this.options.name}: Circuit breaker moving to HALF_OPEN`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log(`✅ ${this.options.name}: Circuit breaker reset to CLOSED`);
  }

  private onFailure() {
    this.failureCount++;
    
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      console.log(`❌ ${this.options.name}: Circuit breaker OPEN for ${this.options.resetTimeout}ms`);
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      isOpen: this.state === 'OPEN',
    };
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
    console.log(`🔄 ${this.options.name}: Circuit breaker manually reset`);
  }
}

// Global circuit breakers for different API endpoints
export const apiCircuitBreakers = {
  products: new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute
    name: 'ProductsAPI',
  }),
  
  analytics: new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    name: 'AnalyticsAPI',
  }),
  
  auth: new CircuitBreaker({
    failureThreshold: 2,
    resetTimeout: 120000, // 2 minutes
    name: 'AuthAPI',
  }),
};

// Enhanced request deduplication and throttling utility
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private lastRequestTime = new Map<string, number>();
  private readonly minInterval = 1000; // Minimum 1 second between requests

  async deduplicate<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const lastTime = this.lastRequestTime.get(key) || 0;
    
    // If there's a pending request, return it
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return this.pendingRequests.get(key)!;
    }
    
    // Throttling: prevent rapid requests
    if (now - lastTime < this.minInterval) {
      console.log(`⏳ Throttling request: ${key} (${this.minInterval - (now - lastTime)}ms remaining)`);
      
      // Return cached promise if exists, otherwise create a delayed promise
      if (this.pendingRequests.has(key)) {
        return this.pendingRequests.get(key)!;
      }
      
      // Create a delayed operation
      const delayedPromise = new Promise<T>((resolve, reject) => {
        setTimeout(async () => {
          try {
            this.lastRequestTime.set(key, Date.now());
            const result = await operation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, this.minInterval - (now - lastTime));
      }).finally(() => {
        this.pendingRequests.delete(key);
      });
      
      this.pendingRequests.set(key, delayedPromise);
      return delayedPromise;
    }

    // Record the request time
    this.lastRequestTime.set(key, now);
    
    const promise = operation().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
    this.lastRequestTime.clear();
  }

  // Force clear specific request
  clearRequest(key: string) {
    this.pendingRequests.delete(key);
    this.lastRequestTime.delete(key);
  }
}

export const requestDeduplicator = new RequestDeduplicator();