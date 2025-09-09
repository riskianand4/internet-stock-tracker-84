import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Users, Database, Settings, Activity, AlertTriangle, TrendingUp, ArrowUpRight, Server, Eye, Lock, Globe, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import WelcomeCard from '@/components/onboarding/WelcomeCard';
import { User } from '@/types/auth';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
interface EnhancedSuperAdminDashboardProps {
  user: User;
  onStartTour?: () => void;
}
const EnhancedSuperAdminDashboard: React.FC<EnhancedSuperAdminDashboardProps> = ({
  user,
  onStartTour
}) => {
  const isMobile = useIsMobile();
  const systemActions = [{
    title: 'User Management',
    description: 'Manage all system users and permissions',
    icon: Users,
    href: '/users',
    color: 'bg-primary/5 hover:bg-primary/10 border-primary/20',
    priority: 'high'
  }, {
    title: 'Security Center',
    description: 'Security logs, audit trails and access controls',
    icon: Shield,
    href: '/security',
    color: 'bg-destructive/5 hover:bg-destructive/10 border-destructive/20',
    priority: 'critical'
  }, {
    title: 'Database Health',
    description: 'Monitor database performance and integrity',
    icon: Database,
    href: '/database',
    color: 'bg-success/5 hover:bg-success/10 border-success/20',
    priority: 'medium'
  }, {
    title: 'Global Analytics',
    description: 'Cross-organization analytics and insights',
    icon: BarChart3,
    href: '/analytics',
    color: 'bg-accent/5 hover:bg-accent/10 border-accent/20',
    priority: 'medium'
  }, {
    title: 'System Settings',
    description: 'Configure global system parameters',
    icon: Settings,
    href: '/settings',
    color: 'bg-warning/5 hover:bg-warning/10 border-warning/20',
    priority: 'high'
  }, {
    title: 'Admin Monitor',
    description: 'Monitor admin activities and permissions',
    icon: Eye,
    href: '/admin-monitor',
    color: 'bg-accent/5 hover:bg-accent/10 border-accent/20',
    priority: 'high'
  }];
  const systemMetrics = [{
    label: 'Total Users',
    value: '3',
    icon: Users,
    trend: '0',
    status: 'good'
  }, {
    label: 'System Load',
    value: '15%',
    icon: Server,
    trend: 'stable',
    status: 'excellent'
  }, {
    label: 'Security Alerts',
    value: '0',
    icon: AlertTriangle,
    trend: 'none',
    status: 'excellent'
  }, {
    label: 'Data Integrity',
    value: '100%',
    icon: Database,
    trend: 'stable',
    status: 'excellent'
  }, {
    label: 'Active Admins',
    value: '1',
    icon: Shield,
    trend: '0',
    status: 'good'
  }, {
    label: 'System Status',
    value: 'Online',
    icon: Globe,
    trend: 'stable',
    status: 'excellent'
  }];
  const adminActivities = [{
    admin: 'System Admin',
    action: 'System initialized successfully',
    location: 'System Core',
    time: '1 hour ago',
    risk: 'low'
  }, {
    admin: 'Auto System',
    action: 'Daily backup completed',
    location: 'Database',
    time: '2 hours ago',
    risk: 'low'
  }, {
    admin: 'System Monitor',
    action: 'Health check passed',
    location: 'All Systems',
    time: '3 hours ago',
    risk: 'low'
  }];
  const criticalAlerts = [{
    message: 'System running smoothly - no critical alerts',
    severity: 'success',
    time: '5 min ago',
    action: 'Monitor',
    affected: 'All Systems'
  }, {
    message: 'Database backup completed successfully',
    severity: 'success',
    time: '1 hour ago',
    action: 'View Log',
    affected: 'Database System'
  }, {
    message: 'All security checks passed',
    severity: 'success',
    time: '2 hours ago',
    action: 'Review',
    affected: 'Security System'
  }, {
    message: 'System health: All services operational',
    severity: 'info',
    time: '3 hours ago',
    action: 'Details',
    affected: 'System Core'
  }];
  const globalInventoryStats = [{
    location: 'Main System',
    products: 0,
    alerts: 0,
    health: 100
  }, {
    location: 'Inventory Module',
    products: 0,
    alerts: 0,
    health: 100
  }, {
    location: 'User Management',
    products: 3,
    alerts: 0,
    health: 100
  }];
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-success';
      case 'good':
        return 'text-primary';
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };
  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-destructive/10 text-destructive border-destructive/20',
      high: 'bg-warning/10 text-warning border-warning/20',
      medium: 'bg-primary/10 text-primary border-primary/20',
      low: 'bg-success/10 text-success border-success/20'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };
  const getHealthColor = (health: number) => {
    if (health >= 98) return 'text-success';
    if (health >= 95) return 'text-primary';
    if (health >= 90) return 'text-warning';
    return 'text-destructive';
  };
  return <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <WelcomeCard user={user} onStartTour={onStartTour || (() => {})} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className={`flex justify-between items-center ${isMobile ? 'mb-3' : 'mb-4'}`}>
          <h2 className={`${isMobile ? 'text-base' : 'text-2xl'} font-bold flex items-center gap-2`}>
            <Crown className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-accent`} />
            Super Admin Command Center
          </h2>
          <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <Button variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? 'text-xs px-2' : ''}>
              <Activity className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
              {isMobile ? 'Logs' : 'System Logs'}
            </Button>
            <Button variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? 'text-xs px-2' : ''}>
              <Shield className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
              Security
            </Button>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
          {systemMetrics.map(metric => <Card key={metric.label} className="hover:shadow-md transition-shadow">
              <CardContent className={isMobile ? "p-3" : "p-4"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>{metric.label}</p>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{metric.value}</p>
                    <p className={`text-xs ${getStatusColor(metric.status)}`}>
                      {metric.trend} {metric.status}
                    </p>
                  </div>
                  <metric.icon className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} ${getStatusColor(metric.status)}`} />
                </div>
              </CardContent>
            </Card>)}
        </div>
      </motion.div>

      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
        <motion.div variants={itemVariants}>
          <h2 className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold ${isMobile ? 'mb-3' : 'mb-4'}`}>System Administration</h2>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-2' : 'gap-3'}`}>
            {systemActions.map(action => <motion.div key={action.title} whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }}>
                <Card className={`cursor-pointer transition-all duration-200 ${action.color}`}>
                  <Link to={action.href}>
                    <CardHeader className={isMobile ? "pb-2 p-3" : "pb-3"}>
                      <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
                        <action.icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mt-0.5`} />
                        <div className="flex-1">
                          <div className={`flex items-center gap-2 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                            <CardTitle className={isMobile ? "text-sm" : "text-base"}>{action.title}</CardTitle>
                            <Badge variant="outline" className={`${getPriorityBadge(action.priority)} ${isMobile ? 'text-xs px-1 py-0' : ''}`}>
                              {action.priority}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">{action.description}</CardDescription>
                        </div>
                        <ArrowUpRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
                      </div>
                    </CardHeader>
                  </Link>
                </Card>
              </motion.div>)}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-fit">
            <CardHeader className={isMobile ? "p-3 pb-2" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
                <AlertTriangle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                {isMobile ? 'System Alerts' : 'Critical System Alerts'}
                <Badge variant="outline" className={`ml-auto ${isMobile ? 'text-xs px-1' : ''}`}>
                  {criticalAlerts.filter(a => a.severity === 'critical').length || 'None'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-3" : ""}>
              <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                {criticalAlerts.map((alert, index) => <div key={index} className={`flex items-start ${isMobile ? 'gap-2 p-2' : 'gap-3 p-3'} rounded-lg bg-muted/50 border`}>
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${alert.severity === 'critical' ? 'bg-destructive' : alert.severity === 'warning' ? 'bg-warning' : alert.severity === 'success' ? 'bg-success' : 'bg-primary'}`} />
                    <div className="flex-1">
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{alert.message}</p>
                      <div className={`flex justify-between items-center ${isMobile ? 'mt-1' : 'mt-2'}`}>
                        <div>
                          <p className="text-xs text-muted-foreground">{alert.time}</p>
                          <p className="text-xs text-muted-foreground">Affected: {alert.affected}</p>
                        </div>
                        <Button variant="outline" size="sm" className={`text-xs py-1 px-2 h-auto ${isMobile ? 'text-xs' : ''}`}>
                          {alert.action}
                        </Button>
                      </div>
                    </div>
                  </div>)}
              </div>
              <Link to="/security">
                <Button variant="outline" className="w-full mt-3" size="sm">
                  View Security Center
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Admin Activity Monitor
              </CardTitle>
              <CardDescription>Recent admin actions across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminActivities.map((activity, index) => <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                    <Shield className="h-4 w-4 mt-1 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{activity.admin}</p>
                        <Badge variant="outline" className={`text-xs ${getRiskColor(activity.risk)}`}>
                          {activity.risk} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">{activity.location}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  </div>)}
              </div>
              <Button variant="outline" className="w-full mt-3" size="sm">
                View Full Admin Log
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Multi-Location Oversight
              </CardTitle>
              <CardDescription>Global inventory health across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {globalInventoryStats.map((location, index) => <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{location.location}</p>
                        <span className={`text-sm font-bold ${getHealthColor(location.health)}`}>
                          {location.health}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{location.products} products</span>
                        <span>{location.alerts} alerts</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div className={`h-2 rounded-full ${location.health >= 98 ? 'bg-success' : location.health >= 95 ? 'bg-primary' : location.health >= 90 ? 'bg-warning' : 'bg-destructive'}`} style={{
                      width: `${location.health}%`
                    }} />
                      </div>
                    </div>
                  </div>)}
              </div>
              <Button variant="outline" className="w-full mt-3" size="sm">
                View Global Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        
      </motion.div>
    </motion.div>;
};
export default EnhancedSuperAdminDashboard;