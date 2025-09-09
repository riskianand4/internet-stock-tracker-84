import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";

import { ScrollRestoration } from "./components/ScrollRestoration";
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OptimizedAutoAlertMonitor from '@/components/alerts/OptimizedAutoAlertMonitor';
import { LayoutSkeleton } from "@/components/ui/layout-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load all page components for better performance
import {
  LazyIndex,
  LazyStatsPage,
  LazyProductsPage,
  LazyInventoryPage,
  LazyAssetsPage,
  LazyOrdersPage,
  LazyAlertsPage,
  LazyUsersPage,
  LazySettingsPage,
  LazyDatabasePage,
  LazySecurityPage,
  LazyStockReportPage,
  LazyStockMovementPage,
  LazyStockOpnamePage,
  LazyDocumentationPage,
  LazyAIStudioPage,
  LazyApiManagementPage,
  LazyVendorsPage,
  LazyAdminMonitorPage,
  LazyMorePage,
  LazyNotFound
} from "./components/optimized/LazyRoutes";



const App = () => {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <ScrollRestoration />
        <Suspense fallback={<AppLoadingSkeleton />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LazyIndex />} />
            <Route path="/stats" element={<LazyStatsPage />} />
            <Route path="/products" element={<LazyProductsPage />} />
            <Route path="/assets" element={<LazyAssetsPage />} />
            <Route path="/inventory" element={<LazyInventoryPage />} />
            <Route path="/orders" element={<LazyOrdersPage />} />
            <Route path="/alerts" element={<LazyAlertsPage />} />
            <Route path="/stock-opname" element={<LazyStockOpnamePage />} />
            <Route path="/documentation" element={<LazyDocumentationPage />} />
            <Route path="/settings" element={<LazySettingsPage />} />
            <Route path="/ai-studio" element={<LazyAIStudioPage />} />
            <Route path="/vendors" element={<LazyVendorsPage />} />
            <Route path="/more" element={<LazyMorePage />} />

          {/* Admin-only routes */}
          <Route path="/users" element={
            <ProtectedRoute requiredRole="admin">
              <LazyUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/stock-movement" element={
            <ProtectedRoute requiredRole="admin">
              <LazyStockMovementPage />
            </ProtectedRoute>
          } />
          <Route path="/api-management" element={
            <ProtectedRoute requiredRole="admin">
              <LazyApiManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/security" element={
            <ProtectedRoute requiredRole="admin">
              <LazySecurityPage />
            </ProtectedRoute>
          } />
          <Route path="/stock-report" element={
            <ProtectedRoute requiredRole="admin">
              <LazyStockReportPage />
            </ProtectedRoute>
          } />

          {/* Super admin-only routes */}
          <Route path="/database" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyDatabasePage />
            </ProtectedRoute>
          } />
          <Route path="/admin-monitor" element={
            <ProtectedRoute requiredRole="superadmin">
              <LazyAdminMonitorPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<LazyNotFound />} />
        </Routes>
      </Suspense>
      <OptimizedAutoAlertMonitor />
    </TooltipProvider>
  </ErrorBoundary>
  );
};

// Loading skeleton component that adapts to mobile/desktop
const AppLoadingSkeleton = () => {
  const isMobile = useIsMobile();
  return <LayoutSkeleton isMobile={isMobile} />;
};

export default App;