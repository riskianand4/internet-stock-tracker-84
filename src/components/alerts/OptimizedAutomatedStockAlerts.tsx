import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, BellOff, CheckCircle, Clock, AlertCircle, Settings, Filter } from 'lucide-react';
import { useOptimizedStockAlerts } from '@/hooks/useOptimizedStockAlerts';
import { StockAlert } from '@/types/stock-movement';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
const OptimizedAutomatedStockAlerts = () => {
  const {
    alerts,
    acknowledgeAlert,
    getAlertStats
  } = useOptimizedStockAlerts();
  const {
    user
  } = useAuth();
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const stats = getAlertStats;

  // Memoized color functions
  const getSeverityColor = useMemo(() => (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'LOW':
        return 'bg-muted text-muted-foreground border-muted/20';
      default:
        return 'bg-muted text-muted-foreground border-muted/20';
    }
  }, []);
  const getSeverityIcon = useMemo(() => (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM':
        return <Clock className="w-4 h-4" />;
      case 'LOW':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  }, []);
  const getTypeColor = useMemo(() => (type: any) => {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('out_of_stock') || typeStr.includes('out of stock')) {
      return 'bg-destructive';
    }
    if (typeStr.includes('low_stock') || typeStr.includes('low stock')) {
      return 'bg-warning';
    }
    if (typeStr.includes('overstock') || typeStr.includes('overstocked')) {
      return 'bg-primary';
    }
    if (typeStr.includes('expir') || typeStr.includes('expired')) {
      return 'bg-secondary';
    }
    return 'bg-muted';
  }, []);

  // Memoized filtered alerts
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter(alert => {
      const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
      const matchesStatus = statusFilter === 'ALL' || statusFilter === 'ACKNOWLEDGED' && alert.acknowledged || statusFilter === 'UNACKNOWLEDGED' && !alert.acknowledged;
      return matchesSeverity && matchesStatus;
    });
  }, [alerts, severityFilter, statusFilter]);
  const handleAcknowledgeAlert = async (alertId: string) => {
    if (user?.name) {
      await acknowledgeAlert(alertId, user.name);
    }
  };
  if (!alertsEnabled) {
    return <Card>
        <CardContent className="p-6 text-center">
          <BellOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Stock alerts are disabled</p>
          <Button onClick={() => setAlertsEnabled(true)} className="mt-4" variant="outline">
            Enable Alerts
          </Button>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
        <motion.div className="h-full" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex items-center">
              <div className="flex items-center justify-between gap-">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                  <p className="text-md font-bold">{stats.total}</p>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="h-full" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex items-center">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-md font-bold text-destructive">{stats.critical}</p>
                </div>
                <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="h-full" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex items-center">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-md font-bold text-warning">{stats.high}</p>
                </div>
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="h-full" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex items-center">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Medium Priority</p>
                  <p className="text-md font-bold text-primary">{stats.medium}</p>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="h-full" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.5
      }}>
          <Card className="h-full">
            <CardContent className="p-4 h-full flex items-center">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unacknowledged</p>
                  <p className="text-md font-bold">{stats.unacknowledged}</p>
                </div>
                <div className="w-8 h-8 bg-muted/20 rounded-lg flex items-center justify-center">
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alert Settings & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Alert Settings & Filters
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm">Alerts Enabled</span>
              <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                <SelectItem value="UNACKNOWLEDGED">Unacknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Stock Alerts ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No alerts found matching your criteria</p>
              </div> : filteredAlerts.slice(0, 50).map((alert, index) =>
          // Limit to 50 items for performance
          <motion.div key={alert.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: Math.min(index * 0.02, 0.5)
          }} // Cap delay to prevent long waits
          className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${alert.acknowledged ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-16 rounded-full ${getTypeColor(alert.type)}`} />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.productName}</h4>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.productCode} • {String(alert.type).replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    
                    {!alert.acknowledged && <Button onClick={() => handleAcknowledgeAlert(alert.id)} size="sm" variant="outline" className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Acknowledge
                      </Button>}
                  </div>

                  <div className="ml-16">
                    <p className="text-sm mb-2">{alert.message}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Current Stock: {alert.currentStock}</span>
                        <span>Threshold: {alert.threshold}</span>
                        <span>Created: {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                      
                      {alert.acknowledged && alert.acknowledgedAt && <div className="flex items-center gap-1 text-success">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            Acknowledged by {alert.acknowledgedBy} at{' '}
                            {format(new Date(alert.acknowledgedAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>}
                    </div>
                  </div>
                </motion.div>)}
            
            {filteredAlerts.length > 50 && <div className="text-center py-4 text-muted-foreground">
                <p>Showing first 50 alerts. Use filters to narrow down results.</p>
              </div>}
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default OptimizedAutomatedStockAlerts;