import { useState, useEffect } from 'react';
import { 
  getDashboardStats, 
  getPendingApprovals, 
  getRecentActivities, 
  getInventoryHealth,
  approveRequest,
  rejectRequest,
  DashboardStats,
  PendingApproval,
  RecentActivity,
  InventoryHealth
} from '@/services/dashboardApi';

export interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  pendingApprovals: PendingApproval[];
  recentActivities: RecentActivity[];
  inventoryHealth: InventoryHealth | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  handleApprove: (id: string) => Promise<void>;
  handleReject: (id: string) => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, approvalsData, activitiesData, healthData] = await Promise.all([
        getDashboardStats(),
        getPendingApprovals(),
        getRecentActivities(),
        getInventoryHealth()
      ]);

      setStats(statsData);
      setPendingApprovals(approvalsData);
      setRecentActivities(activitiesData);
      setInventoryHealth(healthData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id);
      // Remove the approved item from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id));
      // Refresh stats to get updated counts
      const updatedStats = await getDashboardStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectRequest(id);
      // Remove the rejected item from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id));
      // Refresh stats to get updated counts
      const updatedStats = await getDashboardStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    stats,
    pendingApprovals,
    recentActivities,
    inventoryHealth,
    loading,
    error,
    refreshData,
    handleApprove,
    handleReject
  };
};

export default useDashboardData;