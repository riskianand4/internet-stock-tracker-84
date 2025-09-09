import { useHybridData } from '@/hooks/useHybridData';
import { useApi } from '@/contexts/ApiContext';
import type { AnalyticsOverview, TrendData, CategoryData, VelocityData, SmartInsight, StockAlert } from '@/types/analytics';

// Hook for analytics overview/KPI data
export function useAnalyticsOverview(timeFilter: string = 'month'): ReturnType<typeof useHybridData<AnalyticsOverview>> {
  return useHybridData<AnalyticsOverview>({
    localData: {
      totalProducts: 247,
      totalValue: 89500000,
      totalValueGrowth: 12.5,
      lowStockCount: 8,
      outOfStockCount: 3,
      stockMovements: 156,
      avgDailyMovements: 5.2,
      turnoverRate: 8.7,
      stockHealth: 85
    },
    localFunction: () => ({
      totalProducts: 247,
      totalValue: 89500000,
      totalValueGrowth: 12.5,
      lowStockCount: 8,
      outOfStockCount: 3,
      stockMovements: 156,
      avgDailyMovements: 5.2,
      turnoverRate: 8.7,
      stockHealth: 85
    }),
    apiFunction: async () => {
      // Get products data and calculate analytics from it
      const { getApiService } = await import('@/services/inventoryApi');
      const service = getApiService();
      if (service) {
        // Get products data
        const productsResponse = await service.getProducts();
        const products = productsResponse?.data || [];
        
        // Calculate analytics from products
        const totalProducts = products.length;
        const totalValue = products.reduce((sum: number, product: any) => {
          const stock = typeof product.stock === 'object' ? product.stock?.current : product.stock;
          const price = product.price || 0;
          return sum + (stock * price);
        }, 0);
        
        const lowStockCount = products.filter((product: any) => {
          const current = typeof product.stock === 'object' ? product.stock?.current : product.stock;
          const minimum = typeof product.stock === 'object' ? product.stock?.minimum : product.minStock;
          return current <= (minimum || 10);
        }).length;
        
        const outOfStockCount = products.filter((product: any) => {
          const current = typeof product.stock === 'object' ? product.stock?.current : product.stock;
          return current === 0;
        }).length;
        
        // Return data in the format expected by useHybridData (wrapped in ApiResponse)
        return {
          success: true,
          data: {
            totalProducts,
            totalValue,
            totalValueGrowth: 12.5, // Mock growth for now
            lowStockCount,
            outOfStockCount,
            stockMovements: 156, // Mock for now
            avgDailyMovements: 5.2, // Mock for now
            turnoverRate: 8.7, // Mock for now
            stockHealth: totalProducts > 0 ? Math.round(((totalProducts - outOfStockCount) / totalProducts) * 100) : 0
          }
        };
      }
      throw new Error('API service not available');
    },
    autoRefresh: true,
  });
}

// Hook for trend analysis data
export function useAnalyticsTrends(timeFilter: string = 'month'): ReturnType<typeof useHybridData<TrendData[]>> {
  return useHybridData<TrendData[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const { getApiService } = await import('@/services/inventoryApi');
      const service = getApiService();
      if (service) {
        return service.getAnalyticsTrends({ timeFilter });
      }
      throw new Error('API service not available');
    },
    autoRefresh: true,
  });
}

// Hook for category analysis data
export function useCategoryAnalysis(): ReturnType<typeof useHybridData<CategoryData[]>> {
  return useHybridData<CategoryData[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const { getApiService } = await import('@/services/inventoryApi');
      const service = getApiService();
      if (service) {
        return service.getCategoryAnalysis();
      }
      throw new Error('API service not available');
    },
    autoRefresh: true,
  });
}

// Hook for stock velocity data
export function useStockVelocity(): ReturnType<typeof useHybridData<VelocityData[]>> {
  return useHybridData<VelocityData[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const { getApiService } = await import('@/services/inventoryApi');
      const service = getApiService();
      if (service) {
        return service.getStockVelocity();
      }
      throw new Error('API service not available');
    },
    autoRefresh: true,
  });
}

// Hook for stock alerts data
export function useStockAlerts(): ReturnType<typeof useHybridData<StockAlert[]>> {
  return useHybridData<StockAlert[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const { getApiService } = await import('@/services/inventoryApi');
      const service = getApiService();
      if (service) {
        return service.getStockAlerts();
      }
      throw new Error('API service not available');
    },
    autoRefresh: true,
  });
}

// Hook for smart insights data
export function useSmartInsights(timeFilter: string = 'month'): ReturnType<typeof useHybridData<SmartInsight[]>> {
  return useHybridData<SmartInsight[]>({
    localData: [],
    localFunction: () => [],
    apiFunction: async () => {
      const { getApiService } = await import('@/services/inventoryApi');
      const service = getApiService();
      if (service) {
        return service.getSmartInsights({ timeFilter });
      }
      throw new Error('API service not available');
    },
    autoRefresh: true,
  });
}