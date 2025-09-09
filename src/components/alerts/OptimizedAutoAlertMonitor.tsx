import React, { useEffect, useRef } from 'react';
import { useOptimizedAutoAlerts } from '@/hooks/useOptimizedAutoAlerts';
import { useEnhancedProductManager } from '@/hooks/useEnhancedProductManager';
import { useAuth } from '@/hooks/useAuth';

const AlertMonitorCore: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { generateAlerts } = useOptimizedAutoAlerts();
  const { products, fetchProducts } = useEnhancedProductManager();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    // Only run if authenticated
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkAndGenerateAlerts = async () => {
      try {
        // Prevent too frequent checks
        const now = Date.now();
        if (now - lastCheckRef.current < 60000) return; // Min 1 minute between checks
        
        lastCheckRef.current = now;

        // Get fresh products if needed
        let currentProducts = products;
        if (!currentProducts || currentProducts.length === 0) {
          currentProducts = await fetchProducts();
        }

        if (currentProducts && currentProducts.length > 0) {
          await generateAlerts(currentProducts);
        }
      } catch (error) {
        // Don't log in production - already handled by logger system
        
        // Stop monitoring on authentication errors
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    };

    // Initial check after a short delay
    const timeoutId = setTimeout(checkAndGenerateAlerts, 5000);

    // Set up interval (every 2 minutes to reduce load)
    intervalRef.current = setInterval(checkAndGenerateAlerts, 120000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, generateAlerts, products, fetchProducts]);

  return null;
};

const OptimizedAutoAlertMonitor: React.FC = () => {
  // Add a delay before mounting the core component to ensure providers are ready
  const [isReady, setIsReady] = React.useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) return null;
  
  return <AlertMonitorCore />;
};

export default OptimizedAutoAlertMonitor;