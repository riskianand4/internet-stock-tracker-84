/**
 * Role Mapping Utility
 * Standardizes role format between backend (super_admin) and frontend (superadmin)
 */

export type FrontendRole = 'user' | 'admin' | 'superadmin';
export type BackendRole = 'user' | 'admin' | 'super_admin';

/**
 * Convert backend role format to frontend format
 */
export const mapBackendToFrontendRole = (backendRole: string): FrontendRole => {
  switch (backendRole?.toLowerCase()) {
    case 'super_admin':
      return 'superadmin';
    case 'admin':
      return 'admin';
    case 'user':
    default:
      return 'user';
  }
};

/**
 * Convert frontend role format to backend format
 */
export const mapFrontendToBackendRole = (frontendRole: FrontendRole): BackendRole => {
  switch (frontendRole) {
    case 'superadmin':
      return 'super_admin';
    case 'admin':
      return 'admin';
    case 'user':
    default:
      return 'user';
  }
};

/**
 * Check if user has required permission level
 */
export const hasPermission = (userRole: FrontendRole, requiredRole: FrontendRole): boolean => {
  const roleHierarchy: Record<FrontendRole, number> = {
    user: 1,
    admin: 2,
    superadmin: 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: FrontendRole): string => {
  switch (role) {
    case 'superadmin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'user':
    default:
      return 'User';
  }
};

/**
 * Get role color class for badges
 */
export const getRoleColorClass = (role: FrontendRole): string => {
  switch (role) {
    case 'superadmin':
      return 'bg-destructive text-destructive-foreground';
    case 'admin':
      return 'bg-warning text-warning-foreground';
    case 'user':
    default:
      return 'bg-success text-success-foreground';
  }
};