// Global request throttler to prevent API spam
class GlobalRequestThrottler {
  private requestCounts = new Map<string, number>();
  private resetTimers = new Map<string, NodeJS.Timeout>();
  private readonly maxRequestsPerSecond = 5;
  private readonly windowMs = 1000;

  canMakeRequest(endpoint: string): boolean {
    const count = this.requestCounts.get(endpoint) || 0;
    
    if (count >= this.maxRequestsPerSecond) {
      console.warn(`🚫 Request rate limit exceeded for ${endpoint}: ${count}/${this.maxRequestsPerSecond}`);
      return false;
    }
    
    return true;
  }

  recordRequest(endpoint: string): void {
    const currentCount = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, currentCount + 1);
    
    // Clear existing timer
    const existingTimer = this.resetTimers.get(endpoint);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new reset timer
    const timer = setTimeout(() => {
      this.requestCounts.delete(endpoint);
      this.resetTimers.delete(endpoint);
    }, this.windowMs);
    
    this.resetTimers.set(endpoint, timer);
  }

  reset(): void {
    // Clear all timers
    for (const timer of this.resetTimers.values()) {
      clearTimeout(timer);
    }
    
    this.requestCounts.clear();
    this.resetTimers.clear();
  }

  getStats(): { endpoint: string; count: number }[] {
    return Array.from(this.requestCounts.entries()).map(([endpoint, count]) => ({
      endpoint,
      count,
    }));
  }
}

export const globalRequestThrottler = new GlobalRequestThrottler();