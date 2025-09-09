import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Plus, Download, Upload, AlertTriangle, Bell, 
  BellOff, Eye, Edit, Trash2, Filter, Settings, CheckCircle, Clock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useOptimizedStockAlerts } from '@/hooks/useOptimizedStockAlerts';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import OptimizedAutomatedStockAlerts from '@/components/alerts/OptimizedAutomatedStockAlerts';
import OptimizedAutoAlertMonitor from '@/components/alerts/OptimizedAutoAlertMonitor';
import { createStockAlert, acknowledgeStockAlert } from '@/services/stockMovementApi';
import { InventoryApiService } from '@/services/inventoryApi';

export default function AlertsPage() {
  const { user, isAuthenticated } = useApp();
  const { alerts: stockAlerts, refresh } = useOptimizedStockAlerts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Alert form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const inventoryApi = new InventoryApiService();
  const [formData, setFormData] = useState({
    type: '',
    severity: 'MEDIUM',
    title: '',
    message: '',
    productId: ''
  });

  // Convert stock alerts to the expected format and add system alerts
  const allAlerts = [
    ...stockAlerts.map(alert => ({
      id: alert.id,
      type: alert.type.toLowerCase(),
      severity: alert.severity.toLowerCase(),
      title: `Stock Alert: ${alert.productName}`,
      message: alert.message,
      timestamp: new Date(alert.timestamp),
      isRead: alert.acknowledged,
      isResolved: false,
      category: 'inventory'
    })),
    // System alerts can be added here when backend supports them
  ];

  const filteredAlerts = allAlerts.filter(alert => {
    const matchesSearch = 
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const matchesType = selectedType === 'all' || alert.type === selectedType;
    const matchesReadStatus = !showOnlyUnread || !alert.isRead;
    return matchesSearch && matchesSeverity && matchesType && matchesReadStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'low_stock': return 'bg-warning text-warning-foreground';
      case 'out_of_stock': return 'bg-destructive text-destructive-foreground';
      case 'system': return 'bg-primary text-primary-foreground';
      case 'security': return 'bg-destructive text-destructive-foreground';
      case 'performance': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalAlerts = allAlerts.length;
  const unreadAlerts = allAlerts.filter(alert => !alert.isRead).length;
  const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical').length;
  const resolvedAlerts = allAlerts.filter(alert => alert.isResolved).length;

  // Map alert type to category
  const getAlertCategory = (type: string) => {
    switch (type) {
      case 'SYSTEM': return 'system_health';
      case 'SECURITY': return 'security';
      case 'PERFORMANCE': return 'performance';
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
      case 'OVERSTOCK':
      case 'EXPIRING': return 'inventory';
      default: return 'system_health';
    }
  };

  // Load products when dialog opens and type is stock-related
  useEffect(() => {
    if (isCreateDialogOpen && ['LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRING'].includes(formData.type)) {
      loadProducts();
    }
  }, [isCreateDialogOpen, formData.type]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await inventoryApi.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar produk",
        variant: "destructive"
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle form submission
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is superadmin
    if (user?.role !== 'superadmin') {
      toast({
        title: "Akses Ditolak",
        description: "Hanya superadmin yang dapat membuat custom alert",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.type || !formData.title || !formData.message) {
      toast({
        title: "Error",
        description: "Harap lengkapi semua field yang wajib diisi",
        variant: "destructive"
      });
      return;
    }

    // Check if product is required for stock alerts
    const isStockAlert = ['LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRING'].includes(formData.type);
    if (isStockAlert && !formData.productId) {
      toast({
        title: "Error",
        description: "Pilih produk untuk alert tipe stok",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const alertData = {
        type: formData.type.toUpperCase(),
        severity: formData.severity,
        title: formData.title,
        message: formData.message,
        category: getAlertCategory(formData.type),
        ...(isStockAlert && { productId: formData.productId })
      };

      await createStockAlert(alertData);

      toast({
        title: "Berhasil",
        description: "Alert berhasil dibuat",
        variant: "default"
      });

      // Reset form and close dialog
      setFormData({
        type: '',
        severity: 'MEDIUM',
        title: '',
        message: '',
        productId: ''
      });
      setIsCreateDialogOpen(false);
      
      // Refresh alerts
      refresh();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Error",
        description: "Gagal membuat alert. Periksa data dan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeStockAlert(alertId);
      toast({
        title: "Berhasil",
        description: "Alert telah ditandai sebagai dibaca",
        variant: "default"
      });
      refresh();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Gagal memproses alert",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated || !user) {
    return <ModernLoginPage />;
  }

  return (
    <ErrorBoundary>
      <MainLayout>
      <div className="mobile-responsive-spacing">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="mobile-responsive-text font-bold text-foreground">Peringatan & Notifikasi</h1>
            <p className="text-muted-foreground text-sm md:text-base">Monitor alert sistem dan konfigurasi notifikasi</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.role === 'superadmin' && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Alert
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Alert Baru</DialogTitle>
                  <DialogDescription>Buat custom alert atau reminder</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAlert}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="alertType">Tipe Alert *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value, productId: ''})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe alert" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SYSTEM">System Alert</SelectItem>
                          <SelectItem value="SECURITY">Security Alert</SelectItem>
                          <SelectItem value="PERFORMANCE">Performance Alert</SelectItem>
                          <SelectItem value="LOW_STOCK">Low Stock Alert</SelectItem>
                          <SelectItem value="OUT_OF_STOCK">Out of Stock Alert</SelectItem>
                          <SelectItem value="OVERSTOCK">Overstock Alert</SelectItem>
                          <SelectItem value="EXPIRING">Expiring Alert</SelectItem>
                        </SelectContent>
                      </Select>
                      {['LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRING'].includes(formData.type) && (
                        <p className="text-xs text-muted-foreground">
                          Untuk tipe stok, pilih produk di bawah.
                        </p>
                      )}
                    </div>
                    {/* Product Selection for Stock Alerts */}
                    {['LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRING'].includes(formData.type) && (
                      <div className="grid gap-2">
                        <Label htmlFor="productId">Produk *</Label>
                        <Select 
                          value={formData.productId} 
                          onValueChange={(value) => setFormData({...formData, productId: value})}
                          disabled={loadingProducts}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingProducts ? "Memuat produk..." : "Pilih produk"} />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="severity">Severity</Label>
                      <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tingkat severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Judul Alert *</Label>
                      <Input 
                        id="title" 
                        placeholder="Masukkan judul alert" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="message">Pesan *</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Deskripsi detail alert..." 
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Membuat...' : 'Buat Alert'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            )}
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan
            </Button>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alert</CardTitle>
              <Bell className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalAlerts}</div>
              <p className="text-xs text-muted-foreground">Total alert aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-warning/10 border-warning/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Belum Dibaca</CardTitle>
              <BellOff className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{unreadAlerts}</div>
              <p className="text-xs text-muted-foreground">Alert belum dibaca</p>
            </CardContent>
          </Card>

          <Card className="bg-destructive/10 border-destructive/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kritikal</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
              <p className="text-xs text-muted-foreground">Alert critical</p>
            </CardContent>
          </Card>

          <Card className="bg-success/10 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diselesaikan</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{resolvedAlerts}</div>
              <p className="text-xs text-muted-foreground">Alert diselesaikan</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari alert berdasarkan judul atau pesan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-2 md:gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 col-span-2 md:col-span-1 lg:w-auto">
              <Switch
                id="unread-only"
                checked={showOnlyUnread}
                onCheckedChange={setShowOnlyUnread}
              />
              <Label htmlFor="unread-only" className="text-sm">Belum dibaca saja</Label>
            </div>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Tabs defaultValue="alerts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="alerts">Peringatan</TabsTrigger>
              <TabsTrigger value="settings">Pengaturan Notifikasi</TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-4">
              <OptimizedAutoAlertMonitor />
              <OptimizedAutomatedStockAlerts />
              
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Alert</CardTitle>
                  <CardDescription>
                    Alert sistem, stok, dan notifikasi lainnya
                    {filteredAlerts.length !== totalAlerts && (
                      <span className="ml-2 text-primary">
                        ({filteredAlerts.length} dari {totalAlerts} alert)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead>Pesan</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => (
                        <TableRow key={alert.id} className={!alert.isRead ? 'bg-muted/30' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!alert.isRead && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                              {alert.isResolved ? (
                                <CheckCircle className="w-4 h-4 text-success" />
                              ) : (
                                <Clock className="w-4 h-4 text-warning" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(alert.type)}>
                              {alert.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate">
                            {alert.title || `${alert.type} Alert`}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {alert.message}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {alert.timestamp.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Detail Alert",
                                    description: alert.message,
                                    variant: "default"
                                  });
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!alert.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleAcknowledgeAlert(alert.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {(user?.role === 'admin' || user?.role === 'superadmin') && !alert.isResolved && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    // Mark alert as resolved - implement this later
                                    toast({
                                      title: "Info",
                                      description: "Fitur resolve alert akan segera tersedia",
                                      variant: "default"
                                    });
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 text-success" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Notifikasi</CardTitle>
                  <CardDescription>
                    Atur preferensi notifikasi untuk berbagai jenis alert
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Pengaturan notifikasi akan tersedia setelah backend notification system diimplementasikan</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      </MainLayout>
    </ErrorBoundary>
  );
}