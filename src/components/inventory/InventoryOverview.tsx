import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, Eye, Edit, RotateCcw, Plus, Minus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHybridInventoryItems } from '@/hooks/useHybridData';
import { useToast } from '@/hooks/use-toast';
interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location: string;
  lastMovement: Date;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  value: number;
  unit: string;
}
interface InventoryOverviewProps {
  onStockAdjustment?: (productId: string) => void;
}
const InventoryOverview = ({
  onStockAdjustment
}: InventoryOverviewProps) => {
  const {
    toast
  } = useToast();
  const {
    data: inventoryItems,
    isLoading,
    error,
    isFromApi,
    refresh,
    lastUpdated
  } = useHybridInventoryItems();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const filteredItems = (inventoryItems as InventoryItem[]).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesLocation && matchesStatus;
  });
  const handleRefresh = async () => {
    try {
      await refresh();
      toast({
        title: "Data Refreshed",
        description: "Inventory data has been updated successfully"
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh inventory data",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-success text-success-foreground';
      case 'low_stock':
        return 'bg-warning text-warning-foreground';
      case 'out_of_stock':
        return 'bg-destructive text-destructive-foreground';
      case 'overstock':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'Stok Normal';
      case 'low_stock':
        return 'Stok Rendah';
      case 'out_of_stock':
        return 'Stok Habis';
      case 'overstock':
        return 'Stok Berlebih';
      default:
        return status;
    }
  };
  const getTrendIcon = (item: InventoryItem) => {
    if (item.status === 'out_of_stock') return <TrendingDown className="w-4 h-4 text-destructive" />;
    if (item.status === 'low_stock') return <TrendingDown className="w-4 h-4 text-warning" />;
    if (item.status === 'overstock') return <TrendingUp className="w-4 h-4 text-info" />;
    return <TrendingUp className="w-4 h-4 text-success" />;
  };
  const getStockPercentage = (item: InventoryItem) => {
    return Math.round(item.currentStock / item.maxStock * 100);
  };
  const handleViewDetail = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  // Statistics
  const typedItems = inventoryItems as InventoryItem[];
  const stats = {
    total: typedItems.length,
    inStock: typedItems.filter(i => i.status === 'in_stock').length,
    lowStock: typedItems.filter(i => i.status === 'low_stock').length,
    outOfStock: typedItems.filter(i => i.status === 'out_of_stock').length,
    totalValue: typedItems.reduce((sum, item) => sum + item.value, 0)
  };
  if (isLoading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({
          length: 4
        }).map((_, i) => <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-3 bg-muted rounded w-32" />
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Statistics Overview */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3
    }} className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-md font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Item dalam inventori</p>
          </CardContent>
        </Card>

        <Card className="bg-success/10 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Normal</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-md font-bold text-success">{stats.inStock}</div>
            <p className="text-xs text-muted-foreground">Produk dengan stok aman</p>
          </CardContent>
        </Card>

        <Card className="bg-warning/10 border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-md font-bold text-warning">{stats.lowStock + stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">Perlu perhatian segera</p>
          </CardContent>
        </Card>

        <Card className="bg-accent/10 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Inventori</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-md font-bold text-info">
              Rp {(stats.totalValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Total nilai stok</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div className="flex flex-col sm:flex-row gap-4" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      delay: 0.1
    }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Cari produk, kode, atau kategori..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-muted/50" />
        </div>
        
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lokasi</SelectItem>
            <SelectItem value="Gudang Utama">Gudang Utama</SelectItem>
            <SelectItem value="Gudang B">Gudang B</SelectItem>
            <SelectItem value="Toko Depan">Toko Depan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="in_stock">Stok Normal</SelectItem>
            <SelectItem value="low_stock">Stok Rendah</SelectItem>
            <SelectItem value="out_of_stock">Stok Habis</SelectItem>
            <SelectItem value="overstock">Stok Berlebih</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Inventory Table */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      delay: 0.2
    }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Real-time Stock Levels
                  {isFromApi ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  Monitor semua level stok produk secara real-time
                  {isFromApi ? ' (Live Data)' : ' (Local Data)'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {lastUpdated && <span className="text-xs text-muted-foreground">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>}
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            {error && <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                {error}
              </div>}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Produk</TableHead>
                  <TableHead className="min-w-[140px]">Kategori</TableHead>
                  <TableHead className="min-w-[140px]">Stok Saat Ini</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Level Stok</TableHead>
                  <TableHead className="min-w-[140px]">Lokasi</TableHead>
                  <TableHead className="min-w-[120px]">Nilai</TableHead>
                  <TableHead className="min-w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors h-[60px]" onClick={() => handleViewDetail(item)}>
                    <TableCell className="min-w-[200px]">
                      <div className="space-y-1">
                        <div className="font-medium text-sm line-clamp-1 leading-tight" title={item.name}>{item.name}</div>
                        <div className="text-xs text-muted-foreground truncate" title={item.code}>{item.code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="text-sm truncate" title={item.category}>{item.category}</div>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(item)}
                        <span className="font-medium text-sm">{item.currentStock} {item.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <Badge className={`${getStatusColor(item.status)} text-xs whitespace-nowrap`}>
                        {getStatusText(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="w-24">
                        <Progress value={getStockPercentage(item)} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {getStockPercentage(item)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="text-sm truncate" title={item.location}>{item.location}</div>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="text-sm">
                        {item.value > 0 ? `Rp ${item.value.toLocaleString('id-ID')}` : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[100px]">
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(item)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onStockAdjustment?.(item.id)}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Inventori</DialogTitle>
            <DialogDescription>
              Informasi lengkap produk inventori
            </DialogDescription>
          </DialogHeader>
          {selectedItem && <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nama Produk</label>
                  <p className="text-sm font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kode Produk</label>
                  <p className="text-sm font-medium">{selectedItem.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                  <p className="text-sm">{selectedItem.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lokasi</label>
                  <p className="text-sm">{selectedItem.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stok Saat Ini</label>
                  <p className="text-sm font-medium">{selectedItem.currentStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stok Minimum</label>
                  <p className="text-sm">{selectedItem.minStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stok Maksimum</label>
                  <p className="text-sm">{selectedItem.maxStock} {selectedItem.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={getStatusColor(selectedItem.status)}>
                    {getStatusText(selectedItem.status)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nilai Total</label>
                  <p className="text-sm font-medium">
                    {selectedItem.value > 0 ? `Rp ${selectedItem.value.toLocaleString('id-ID')}` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pergerakan Terakhir</label>
                  <p className="text-sm">
                    {new Date(selectedItem.lastMovement).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Level Stok</label>
                <div className="mt-2">
                  <Progress value={getStockPercentage(selectedItem)} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {getStockPercentage(selectedItem)}% dari kapasitas maksimum
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Tutup
                </Button>
                <Button onClick={() => {
              onStockAdjustment?.(selectedItem.id);
              setDetailDialogOpen(false);
            }}>
                  Atur Stok
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
};
export default InventoryOverview;