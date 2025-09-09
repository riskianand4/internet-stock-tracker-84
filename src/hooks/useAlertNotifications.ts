import { useState, useEffect, useCallback } from 'react';
import { getStockAlerts } from '@/services/stockMovementApi';
import useNotifications from './useNotifications';
import { useAuth } from '@/contexts/AuthContext';

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  acknowledged: boolean;
}

const useAlertNotifications = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [seenAlertIds, setSeenAlertIds] = useState<string[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Load seen alert IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('seen-alert-ids');
    if (saved) {
      try {
        setSeenAlertIds(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load seen alert IDs:', error);
      }
    }
  }, []);

  // Save seen alert IDs to localStorage
  useEffect(() => {
    localStorage.setItem('seen-alert-ids', JSON.stringify(seenAlertIds));
  }, [seenAlertIds]);

  const pollForAlerts = useCallback(async () => {
    if (isPolling || !user || user.role !== 'user') {
      return;
    }

    setIsPolling(true);
    try {
      const alerts = await getStockAlerts({ acknowledged: false });
      
      // Find new alerts that haven't been seen
      const newAlerts = alerts.filter(alert => 
        !seenAlertIds.includes(alert.id) && !alert.acknowledged
      );

      // Add notifications for new alerts
      newAlerts.forEach(alert => {
        const notificationType = getSeverityNotificationType(alert.severity);
        
        addNotification(
          notificationType,
          `Alert: ${alert.productName || 'System'}`,
          alert.message,
          [
            {
              label: 'View Details',
              action: () => {
                // This could navigate to alert details or open modal
                console.log('View alert details:', alert.id);
              },
            }
          ]
        );
      });

      // Mark new alerts as seen
      if (newAlerts.length > 0) {
        const newSeenIds = newAlerts.map(alert => alert.id);
        setSeenAlertIds(prev => [...prev, ...newSeenIds]);
      }

    } catch (error) {
      console.error('Error polling for alerts:', error);
    } finally {
      setIsPolling(false);
    }
  }, [isPolling, user, seenAlertIds, addNotification]);

  const getSeverityNotificationType = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
      default:
        return 'info';
    }
  };

  // Set up polling interval (only for regular users)
  useEffect(() => {
    if (!user || user.role !== 'user') {
      return;
    }

    // Initial poll
    pollForAlerts();

    // Set up interval polling every 5 minutes (reduced from 1 minute)
    const interval = setInterval(pollForAlerts, 300000);

    return () => clearInterval(interval);
  }, [user, pollForAlerts]);

  // Clean up old seen IDs periodically (keep only last 100)
  useEffect(() => {
    if (seenAlertIds.length > 100) {
      setSeenAlertIds(prev => prev.slice(-100));
    }
  }, [seenAlertIds]);

  return {
    pollForAlerts,
    seenAlertIds,
    isPolling
  };
};

export default useAlertNotifications;
