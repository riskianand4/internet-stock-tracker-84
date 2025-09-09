// Lazy-loaded route components for better performance
import { lazy } from 'react';
import { lazyLoadComponent } from '@/utils/build-optimizer';

// Lazy load all page components
export const LazyIndex = lazyLoadComponent(() => import('@/pages/Index'));
export const LazyStatsPage = lazyLoadComponent(() => import('@/pages/StatsPage'));
export const LazyProductsPage = lazyLoadComponent(() => import('@/pages/ProductsPage'));
export const LazyInventoryPage = lazyLoadComponent(() => import('@/pages/InventoryPage'));
export const LazyAssetsPage = lazyLoadComponent(() => import('@/pages/AssetsPage'));
export const LazyOrdersPage = lazyLoadComponent(() => import('@/pages/OrdersPage'));
export const LazyAlertsPage = lazyLoadComponent(() => import('@/pages/AlertsPage'));
export const LazyUsersPage = lazyLoadComponent(() => import('@/pages/UsersPage'));
export const LazySettingsPage = lazyLoadComponent(() => import('@/pages/SettingsPage'));
export const LazyDatabasePage = lazyLoadComponent(() => import('@/pages/DatabasePage'));
export const LazySecurityPage = lazyLoadComponent(() => import('@/pages/SecurityPage'));
export const LazyStockReportPage = lazyLoadComponent(() => import('@/pages/StockReportPage'));
export const LazyStockMovementPage = lazyLoadComponent(() => import('@/pages/StockMovementPage'));
export const LazyStockOpnamePage = lazyLoadComponent(() => import('@/pages/StockOpnamePage'));
export const LazyDocumentationPage = lazyLoadComponent(() => import('@/pages/DocumentationPage'));
export const LazyAIStudioPage = lazyLoadComponent(() => import('@/pages/AIStudioPage'));
export const LazyApiManagementPage = lazyLoadComponent(() => import('@/pages/ApiManagementPage').then(module => ({ default: module.ApiManagementPage })));
export const LazyVendorsPage = lazyLoadComponent(() => import('@/pages/VendorsPage'));
export const LazyAdminMonitorPage = lazyLoadComponent(() => import('@/pages/AdminMonitorPage'));
export const LazyMorePage = lazyLoadComponent(() => import('@/pages/MorePage'));
export const LazyNotFound = lazyLoadComponent(() => import('@/pages/NotFound'));