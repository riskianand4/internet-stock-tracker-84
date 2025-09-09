import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Ban, 
  CheckCircle, 
  XCircle,
  Clock,
  MapPin,
  Computer,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  metadata?: any;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  userId?: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  blocked: boolean;
  createdAt: string;
}

interface SecurityStats {
  overview: {
    securityEvents: number;
    loginAttempts: number;
    failedLogins: number;
    criticalEvents: number;
    successRate: string;
  };
  topThreats: Array<{ _id: string; count: number }>;
  suspiciousIPs: Array<{ _id: string; count: number }>;
}

export const SecurityMonitoringCenter: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [ipFilter, setIpFilter] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
  }, [selectedSeverity, selectedType, ipFilter]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);
      if (selectedType !== 'all') params.append('type', selectedType);
      params.append('limit', '50');

      const [eventsRes, attemptsRes, statsRes] = await Promise.all([
        fetch(`/api/security/events?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/security/login-attempts?limit=100', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/security/stats?days=7', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setSecurityEvents(eventsData.data.events);
      }

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        let attempts = attemptsData.data.attempts;
        
        // Filter by IP if specified
        if (ipFilter) {
          attempts = attempts.filter((attempt: LoginAttempt) => 
            attempt.ipAddress.includes(ipFilter)
          );
        }
        
        setLoginAttempts(attempts);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch security data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveSecurityEvent = async (eventId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/security/events/${eventId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Security event resolved successfully"
        });
        fetchSecurityData();
      } else {
        throw new Error('Failed to resolve event');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve security event",
        variant: "destructive"
      });
    }
  };

  const blockIP = async (ipAddress: string, reason: string) => {
    try {
      const response = await fetch('/api/security/ip-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          ipAddress, 
          action: 'block',
          reason 
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `IP ${ipAddress} blocked successfully`
        });
        fetchSecurityData();
      } else {
        throw new Error('Failed to block IP');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block IP address",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return <XCircle className="w-4 h-4" />;
      case 'suspicious_activity': return <Eye className="w-4 h-4" />;
      case 'rate_limit_exceeded': return <Zap className="w-4 h-4" />;
      case 'unauthorized_access': return <Ban className="w-4 h-4" />;
      case 'data_breach_attempt': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Security Monitoring Center
          </h2>
          <p className="text-muted-foreground">
            Monitor and respond to security events and threats
          </p>
        </div>
        <Button onClick={fetchSecurityData} variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {/* Security Overview Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.securityEvents}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.loginAttempts} total attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.failedLogins}</div>
              <p className="text-xs text-muted-foreground">Potential threats</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overview.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious IPs</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.suspiciousIPs.length}</div>
              <p className="text-xs text-muted-foreground">Multiple failures</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="attempts">Login Attempts</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="failed_login">Failed Login</SelectItem>
                <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                <SelectItem value="rate_limit_exceeded">Rate Limit</SelectItem>
                <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                <SelectItem value="data_breach_attempt">Data Breach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Monitor and investigate security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(event.type)}
                          <span className="capitalize">{event.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(event.severity)}>
                          {event.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {event.description}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{event.ipAddress}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.createdAt).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.resolved ? (
                          <Badge variant="outline">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!event.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveSecurityEvent(event.id, 'Resolved manually')}
                            >
                              Resolve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => blockIP(event.ipAddress, `Blocked due to: ${event.description}`)}
                          >
                            Block IP
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Filter by IP address..."
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Login Attempts</CardTitle>
              <CardDescription>
                Track successful and failed authentication attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Failure Reason</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>{attempt.email}</TableCell>
                      <TableCell>
                        <code className="text-sm">{attempt.ipAddress}</code>
                        {attempt.blocked && (
                          <Badge variant="destructive" className="ml-2">Blocked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {attempt.success ? (
                          <Badge variant="outline">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {attempt.failureReason && (
                          <span className="capitalize">
                            {attempt.failureReason.replace('_', ' ')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {attempt.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {attempt.location.city}, {attempt.location.country}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(attempt.createdAt).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!attempt.success && !attempt.blocked && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => blockIP(attempt.ipAddress, `Blocked due to failed login attempts for ${attempt.email}`)}
                          >
                            Block IP
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Threat Types</CardTitle>
                <CardDescription>Most common security events</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.topThreats.map((threat, index) => (
                  <div key={threat._id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(threat._id)}
                      <span className="capitalize">{threat._id.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="outline">{threat.count} events</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suspicious IP Addresses</CardTitle>
                <CardDescription>IPs with multiple failed attempts</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.suspiciousIPs.map((ip, index) => (
                  <div key={ip._id} className="flex items-center justify-between py-2">
                    <code className="text-sm">{ip._id}</code>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{ip.count} failures</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => blockIP(ip._id, `Auto-blocked due to ${ip.count} failed attempts`)}
                      >
                        Block
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};