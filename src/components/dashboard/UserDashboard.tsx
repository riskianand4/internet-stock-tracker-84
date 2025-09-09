import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, BarChart3, FileText, Package, TrendingUp, AlertTriangle, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import WelcomeCard from '@/components/onboarding/WelcomeCard';
import { User } from '@/types/auth';
import { motion } from 'framer-motion';
import { useDashboardData } from '@/hooks/useDashboardData';

interface UserDashboardProps {
  user: User;
  onStartTour?: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onStartTour }) => {
  const {
    stats,
    recentActivities,
    loading,
    error
  } = useDashboardData();

  const quickActions = [
    {
      title: 'View Products',
      description: 'Browse product catalog and check availability',
      icon: Package,
      href: '/products',
      color: 'bg-primary/10 hover:bg-primary/20 border-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30'
    },
    {
      title: 'Check Analytics',
      description: 'View sales trends and inventory insights',
      icon: BarChart3,
      href: '/stats',
      color: 'bg-success/10 hover:bg-success/20 border-success/20 dark:bg-success/20 dark:hover:bg-success/30'
    },
    {
      title: 'Generate Reports',
      description: 'Create detailed inventory reports',
      icon: FileText,
      href: '/reports',
      color: 'bg-accent/10 hover:bg-accent/20 border-accent/20 dark:bg-accent/20 dark:hover:bg-accent/30'
    },
    {
      title: 'View Alerts',
      description: 'Check stock alerts and notifications',
      icon: AlertTriangle,
      href: '/alerts',
      color: 'bg-warning/10 hover:bg-warning/20 border-warning/20 dark:bg-warning/20 dark:hover:bg-warning/30'
    }
  ];

  const recentStats = stats ? [
    { label: 'Total Products', value: stats.productsManaged.toLocaleString(), icon: Package, trend: stats.productsTrend },
    { label: 'Low Stock Items', value: stats.lowStockItems.toString(), icon: AlertTriangle, trend: stats.stockTrend },
    { label: 'Active Users', value: stats.activeUsers.toString(), icon: Users, trend: stats.usersTrend },
    { label: 'Pending Approvals', value: stats.pendingApprovals.toString(), icon: Clock, trend: stats.approvalsTrend }
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <WelcomeCard user={user} onStartTour={onStartTour || (() => {})} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-sm font-bold mb-4">Quick Overview</h2>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-16 bg-muted/50 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            recentStats.map((stat) => (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-md font-bold">{stat.value}</p>
                      <p className="text-xs text-success">{stat.trend} from last month</p>
                    </div>
                    <stat.icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-sm font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <motion.div key={action.title} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className={`cursor-pointer transition-all duration-200 ${action.color}`}>
                <Link to={action.href}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <action.icon className="h-6 w-6" />
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-muted/50 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 3).map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span className="text-sm">{activity.message}</span>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
                {recentActivities.length === 0 && !loading && (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent activities available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default UserDashboard;