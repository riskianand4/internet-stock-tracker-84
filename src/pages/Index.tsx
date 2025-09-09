import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import MainLayout from '@/components/layout/MainLayout';
import UserDashboard from '@/components/dashboard/UserDashboard';
import EnhancedAdminDashboard from '@/components/dashboard/EnhancedAdminDashboard';
import EnhancedSuperAdminDashboard from '@/components/dashboard/EnhancedSuperAdminDashboard';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import AIAssistant from '@/components/ai/AIAssistant';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const Index = () => {
  const { user, isLoading, isAuthenticated } = useApp();
  const [showTour, setShowTour] = useState(false);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated or no user
  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'user':
        return <UserDashboard user={user} onStartTour={() => setShowTour(true)} />;
      case 'admin':
        return <EnhancedAdminDashboard user={user} onStartTour={() => setShowTour(true)} />;
      case 'superadmin':
        return <EnhancedSuperAdminDashboard user={user} onStartTour={() => setShowTour(true)} />;
      default:
        return <UserDashboard user={user} onStartTour={() => setShowTour(true)} />;
    }
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        {renderDashboard()}
      </MainLayout>
      <OnboardingTour 
        isOpen={showTour} 
        onClose={() => setShowTour(false)} 
        user={user} 
      />
      <AIAssistant />
    </ErrorBoundary>
  );
};

export default Index;
