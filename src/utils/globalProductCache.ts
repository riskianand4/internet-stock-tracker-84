import { Product } from '@/types/inventory';

// Global product cache singleton to prevent multiple simultaneous requests
class GlobalProductCache {
  private cache: Product[] | null = null;
  private isLoading = false;
  private promise: Promise<Product[]> | null = null;
  private lastFetch = 0;
  private readonly cacheTimeout = 30000; // 30 seconds
  private listeners = new Set<() => void>();

  // Subscribe to cache updates
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of cache updates
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    return this.cache !== null && (Date.now() - this.lastFetch < this.cacheTimeout);
  }

  // Get products from cache or fetch if needed
  async getProducts(fetcher?: () => Promise<Product[]>): Promise<Product[]> {
    // Return cached data if valid
    if (this.isCacheValid() && this.cache) {
      return this.cache;
    }

    // If already loading, wait for existing promise
    if (this.isLoading && this.promise) {
      return this.promise;
    }

    // If no fetcher provided and no cache, return empty array
    if (!fetcher) {
      return this.cache || [];
    }

    // Start new fetch
    this.isLoading = true;
    this.promise = this.fetchProducts(fetcher);
    
    try {
      const result = await this.promise;
      return result;
    } finally {
      this.isLoading = false;
      this.promise = null;
    }
  }

  private async fetchProducts(fetcher: () => Promise<Product[]>): Promise<Product[]> {
    try {
      const products = await fetcher();
      
      // Update cache
      this.cache = products;
      this.lastFetch = Date.now();
      
      // Notify all subscribers
      this.notify();
      
      return products;
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      
      // Return cached data if available, otherwise empty array
      return this.cache || [];
    }
  }

  // Manually update cache (for mutations)
  updateCache(products: Product[]) {
    this.cache = products;
    this.lastFetch = Date.now();
    this.notify();
  }

  // Add product to cache
  addProduct(product: Product) {
    if (this.cache) {
      this.cache = [...this.cache, product];
      this.notify();
    }
  }

  // Update product in cache
  updateProduct(id: string, updates: Partial<Product>) {
    if (this.cache) {
      this.cache = this.cache.map(p => 
        p.id === id ? { ...p, ...updates } : p
      );
      this.notify();
    }
  }

  // Remove product from cache
  removeProduct(id: string) {
    if (this.cache) {
      this.cache = this.cache.filter(p => p.id !== id);
      this.notify();
    }
  }

  // Clear cache
  clearCache() {
    this.cache = null;
    this.lastFetch = 0;
    this.notify();
  }

  // Get current cache state
  getCacheInfo() {
    return {
      hasCache: this.cache !== null,
      cacheSize: this.cache?.length || 0,
      isLoading: this.isLoading,
      isValid: this.isCacheValid(),
      lastFetch: this.lastFetch,
    };
  }
}

export const globalProductCache = new GlobalProductCache();