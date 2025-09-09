import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Edit,
  Trash2,
  Database,
  Zap,
  Shield,
  Monitor,
  Wrench,
  Activity,
  Server,
  HardDrive,
  Clock,
  Users
} from 'lucide-react';

interface SystemConfig {
  _id: string;
  category: 'security' | 'performance' | 'features' | 'maintenance' | 'monitoring';
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  isEditable: boolean;
  requiresRestart: boolean;
  validationRules?: {
    min?: number;
    max?: number;
    options?: string[];
    pattern?: string;
  };
  updatedBy: {
    name: string;
    email: string;
  };
  updatedAt: string;
  createdAt: string;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
    };
    memory: {
      used: number;
      total: number;
      percentage: string;
    };
    uptime: number;
    version: string;
  };
}

export const SystemConfigurationPanel: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, SystemConfig[]>>({});
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [newConfig, setNewConfig] = useState({
    category: 'security' as const,
    key: '',
    value: '' as any,
    dataType: 'string' as const,
    description: '',
    isEditable: true,
    requiresRestart: false
  });
  const [showNewConfigDialog, setShowNewConfigDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      const [configRes, healthRes] = await Promise.all([
        fetch('/api/system/config', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/system/health/check', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfigs(configData.data);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch system data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createConfig = async () => {
    try {
      let processedValue = newConfig.value;
      
      // Process value based on data type
      const dataType = newConfig.dataType as string;
      switch (dataType) {
        case 'number':
          processedValue = parseFloat(String(newConfig.value));
          if (isNaN(processedValue)) {
            toast({
              title: "Error",
              description: "Invalid number value",
              variant: "destructive"
            });
            return;
          }
          break;
        case 'boolean':
          processedValue = String(newConfig.value) === 'true';
          break;
        case 'array':
          try {
            processedValue = JSON.parse(String(newConfig.value));
            if (!Array.isArray(processedValue)) {
              throw new Error('Not an array');
            }
          } catch {
            toast({
              title: "Error",
              description: "Invalid array JSON format",
              variant: "destructive"
            });
            return;
          }
          break;
        case 'object':
          try {
            processedValue = JSON.parse(String(newConfig.value));
            if (Array.isArray(processedValue) || typeof processedValue !== 'object') {
              throw new Error('Not an object');
            }
          } catch {
            toast({
              title: "Error",
              description: "Invalid object JSON format",
              variant: "destructive"
            });
            return;
          }
          break;
      }

      const response = await fetch('/api/system/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newConfig,
          value: processedValue
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Configuration created successfully"
        });
        setShowNewConfigDialog(false);
        setNewConfig({
          category: 'security',
          key: '',
          value: '',
          dataType: 'string',
          description: '',
          isEditable: true,
          requiresRestart: false
        });
        fetchSystemData();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create configuration",
        variant: "destructive"
      });
    }
  };

  const updateConfig = async () => {
    if (!editingConfig) return;

    try {
      let processedValue = editingConfig.value;
      
      // Process value based on data type for non-primitives
      if (editingConfig.dataType === 'array' || editingConfig.dataType === 'object') {
        if (typeof processedValue === 'string') {
          try {
            processedValue = JSON.parse(processedValue);
          } catch {
            toast({
              title: "Error",
              description: `Invalid ${editingConfig.dataType} JSON format`,
              variant: "destructive"
            });
            return;
          }
        }
      }

      const response = await fetch(`/api/system/config/${editingConfig.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          value: processedValue,
          description: editingConfig.description
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Configuration updated successfully",
          ...(result.requiresRestart && {
            description: "Configuration updated. System restart required for changes to take effect."
          })
        });
        setShowEditDialog(false);
        setEditingConfig(null);
        fetchSystemData();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive"
      });
    }
  };

  const deleteConfig = async (key: string) => {
    try {
      const response = await fetch(`/api/system/config/${key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Configuration deleted successfully"
        });
        fetchSystemData();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete configuration",
        variant: "destructive"
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'features': return <Settings className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'monitoring': return <Monitor className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const renderConfigValue = (config: SystemConfig) => {
    if (config.dataType === 'boolean') {
      return (
        <Switch 
          checked={config.value} 
          disabled={!config.isEditable}
          onCheckedChange={(checked) => {
            if (config.isEditable) {
              setEditingConfig({ ...config, value: checked });
              setShowEditDialog(true);
            }
          }}
        />
      );
    }

    const displayValue = typeof config.value === 'object' 
      ? JSON.stringify(config.value, null, 2)
      : String(config.value);

    return (
      <code className="text-sm bg-muted px-2 py-1 rounded max-w-xs truncate block">
        {displayValue}
      </code>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading system configuration...</p>
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
            <Settings className="w-6 h-6" />
            System Configuration
          </h2>
          <p className="text-muted-foreground">
            Manage system settings and monitor health
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSystemData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showNewConfigDialog} onOpenChange={setShowNewConfigDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Config
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Configuration</DialogTitle>
                <DialogDescription>
                  Create a new system configuration setting
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newConfig.category} 
                      onValueChange={(value: any) => setNewConfig({...newConfig, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="features">Features</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dataType">Data Type</Label>
                    <Select 
                      value={newConfig.dataType} 
                      onValueChange={(value: any) => setNewConfig({...newConfig, dataType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="array">Array</SelectItem>
                        <SelectItem value="object">Object</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="key">Configuration Key</Label>
                  <Input
                    id="key"
                    value={newConfig.key}
                    onChange={(e) => setNewConfig({...newConfig, key: e.target.value})}
                    placeholder="e.g., max_login_attempts"
                  />
                </div>
                <div>
                  <Label htmlFor="value">Value</Label>
                  {(newConfig.dataType as string) === 'boolean' ? (
                    <Select 
                      value={newConfig.value} 
                      onValueChange={(value) => setNewConfig({...newConfig, value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : ((newConfig.dataType as string) === 'array' || (newConfig.dataType as string) === 'object') ? (
                    <Textarea
                      id="value"
                      value={newConfig.value}
                      onChange={(e) => setNewConfig({...newConfig, value: e.target.value})}
                      placeholder={`Enter ${newConfig.dataType} as JSON`}
                    />
                  ) : (
                    <Input
                      id="value"
                      value={newConfig.value}
                      onChange={(e) => setNewConfig({...newConfig, value: e.target.value})}
                      type={(newConfig.dataType as string) === 'number' ? 'number' : 'text'}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newConfig.description}
                    onChange={(e) => setNewConfig({...newConfig, description: e.target.value})}
                    placeholder="Describe what this configuration does"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiresRestart"
                    checked={newConfig.requiresRestart}
                    onCheckedChange={(checked) => setNewConfig({...newConfig, requiresRestart: checked})}
                  />
                  <Label htmlFor="requiresRestart">Requires system restart</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createConfig}>Create Configuration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* System Health Overview */}
      {health && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {health.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm capitalize">{health.status}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {health.services.database.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">{health.services.database.responseTime}ms</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.services.memory.percentage}%</div>
              <p className="text-xs text-muted-foreground">
                {Math.round(health.services.memory.used)}MB / {Math.round(health.services.memory.total)}MB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">{formatUptime(health.services.uptime)}</div>
              <p className="text-xs text-muted-foreground">v{health.services.version}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Configuration Categories */}
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        {Object.entries(configs).map(([category, categoryConfigs]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Settings
                </CardTitle>
                <CardDescription>
                  Configure {category} related system parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryConfigs.map((config) => (
                    <div key={config._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{config.key}</h4>
                            <Badge variant="outline">{config.dataType}</Badge>
                            {config.requiresRestart && (
                              <Badge variant="destructive">Restart Required</Badge>
                            )}
                            {!config.isEditable && (
                              <Badge variant="secondary">Read Only</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {config.description}
                          </p>
                          <div className="mb-2">
                            {renderConfigValue(config)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Last updated by {config.updatedBy.name} on{' '}
                            {new Date(config.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {config.isEditable && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingConfig(config);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteConfig(config.key)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {categoryConfigs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No {category} configurations found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Configuration Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Modify the configuration value and description
            </DialogDescription>
          </DialogHeader>
          {editingConfig && (
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-value">Value ({editingConfig.dataType})</Label>
                {(editingConfig.dataType as string) === 'boolean' ? (
                  <Switch
                    checked={editingConfig.value}
                    onCheckedChange={(checked) => 
                      setEditingConfig({...editingConfig, value: checked})
                    }
                  />
                ) : (editingConfig.dataType as string) === 'array' || (editingConfig.dataType as string) === 'object' ? (
                  <Textarea
                    id="edit-value"
                    value={typeof editingConfig.value === 'object' 
                      ? JSON.stringify(editingConfig.value, null, 2)
                      : editingConfig.value
                    }
                    onChange={(e) => setEditingConfig({...editingConfig, value: e.target.value})}
                  />
                ) : (
                  <Input
                    id="edit-value"
                    value={editingConfig.value}
                    onChange={(e) => setEditingConfig({...editingConfig, value: e.target.value})}
                    type={(editingConfig.dataType as string) === 'number' ? 'number' : 'text'}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingConfig.description}
                  onChange={(e) => setEditingConfig({...editingConfig, description: e.target.value})}
                />
              </div>
              {editingConfig.requiresRestart && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This configuration requires a system restart to take effect.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateConfig}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};