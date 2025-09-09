import React, { useEffect } from 'react';
import { useAutoAlerts } from '@/hooks/useAutoAlerts';
import { useEnhancedProductManager } from '@/hooks/useEnhancedProductManager';

const AutoAlertMonitor: React.FC = () => {
  const { generateAlerts } = useAutoAlerts();
  const { products, fetchProducts } = useEnhancedProductManager();

  // Monitor products and generate alerts - only when authenticated
  useEffect(() => {
    const checkAndGenerateAlerts = async () => {
      try {
        // Skip if not authenticated to prevent API spam
        const token = localStorage.getItem('auth-token');
        if (!token) {
          console.log('🔒 Skipping alert check - user not authenticated');
          return;
        }

        const currentProducts = await fetchProducts();
        if (currentProducts && currentProducts.length > 0) {
          await generateAlerts(currentProducts);
        }
      } catch (error) {
        console.error('Error in auto alert monitor:', error);
        
        // If authentication error, stop the monitor
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
          console.log('🔑 Authentication error in alert monitor, stopping checks');
          return;
        }
      }
    };

    // Check if user is authenticated before starting
    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.log('🔒 Auto alert monitor stopped - user not authenticated');
      return;
    }

    // Check immediately
    checkAndGenerateAlerts();

    // Set up interval to check every 60 seconds (reduced frequency)
    const interval = setInterval(checkAndGenerateAlerts, 60000);

    return () => clearInterval(interval);
  }, [generateAlerts, fetchProducts]);

  // This component doesn't render anything visible
  return null;
};

export default AutoAlertMonitor;