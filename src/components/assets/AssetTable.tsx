import React, { useState } from 'react';
import { Asset } from '@/types/assets';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  Search,
  Filter,
  Edit,
  Trash2,
  UserPlus,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AssetTableProps {
  assets: Asset[];
  onEdit?: (asset: Asset) => void;
  onDelete?: (assetId: string) => void;
  onAssignPIC?: (asset: Asset) => void;
  onBorrow?: (asset: Asset) => void;
  onReturn?: (asset: Asset) => void;
  onViewDetails?: (asset: Asset) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onEdit,
  onDelete,
  onAssignPIC,
  onBorrow,
  onReturn,
  onViewDetails,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filter assets based on search and filters
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.picName && asset.picName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: Asset['status']) => {
    const variants = {
      available: 'bg-success/10 text-success border-success/20',
      borrowed: 'bg-warning/10 text-warning border-warning/20',
      maintenance: 'bg-destructive/10 text-destructive border-destructive/20',
      damaged: 'bg-muted text-muted-foreground border-muted/50'
    };

    const labels = {
      available: 'Tersedia',
      borrowed: 'Dipinjam',
      maintenance: 'Maintenance',
      damaged: 'Rusak'
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getConditionBadge = (condition: Asset['condition']) => {
    const variants = {
      excellent: 'bg-success/10 text-success border-success/20',
      good: 'bg-success/10 text-success border-success/20',
      fair: 'bg-warning/10 text-warning border-warning/20',
      poor: 'bg-destructive/10 text-destructive border-destructive/20'
    };

    const labels = {
      excellent: 'Sangat Baik',
      good: 'Baik',
      fair: 'Cukup',
      poor: 'Buruk'
    };

    return (
      <Badge variant="outline" className={variants[condition]}>
        {labels[condition]}
      </Badge>
    );
  };

  const canEdit = user?.role === 'admin' || user?.role === 'superadmin';
  const canAssignPIC = user?.role === 'superadmin';

  const uniqueCategories = [...new Set(assets.map(asset => asset.category))];

  const handleViewDetail = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailDialogOpen(true);
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Daftar Asset</CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="borrowed">Dipinjam</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="damaged">Rusak</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Kode Asset</TableHead>
                <TableHead className="min-w-[240px]">Nama Asset</TableHead>
                <TableHead className="min-w-[160px]">Kategori</TableHead>
                <TableHead className="min-w-[140px]">Status</TableHead>
                <TableHead className="min-w-[140px]">Kondisi</TableHead>
                <TableHead className="min-w-[200px]">PIC</TableHead>
                <TableHead className="min-w-[200px]">Lokasi</TableHead>
                <TableHead className="min-w-[160px]">Harga</TableHead>
                <TableHead className="text-right min-w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Tidak ada asset yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50 transition-colors h-[70px]" onClick={() => handleViewDetail(asset)}>
                    <TableCell className="font-medium min-w-[160px]">
                      <div className="truncate" title={asset.code}>{asset.code}</div>
                    </TableCell>
                    <TableCell className="min-w-[240px]">
                      <div className="space-y-1">
                        <div className="font-medium text-sm line-clamp-1 leading-tight" title={asset.name}>{asset.name}</div>
                        {asset.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1" title={asset.description}>{asset.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      <div className="truncate" title={asset.category}>{asset.category}</div>
                    </TableCell>
                    <TableCell className="min-w-[140px]">{getStatusBadge(asset.status)}</TableCell>
                    <TableCell className="min-w-[140px]">{getConditionBadge(asset.condition)}</TableCell>
                    <TableCell className="min-w-[200px]">
                      {asset.picName ? (
                        <span className="text-sm truncate block" title={asset.picName}>{asset.picName}</span>
                      ) : (
                        <Badge variant="outline" className="bg-muted/10 text-muted-foreground whitespace-nowrap">
                          Belum Ditugaskan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground min-w-[200px]">
                      <div className="truncate" title={asset.location}>{asset.location}</div>
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      <div className="text-sm truncate">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        }).format(asset.purchasePrice)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right min-w-[100px]">
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border-border shadow-lg z-50">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleViewDetail(asset)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>

                            {canEdit && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onEdit?.(asset)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>

                                {canAssignPIC && (
                                  <DropdownMenuItem onClick={() => onAssignPIC?.(asset)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Tugaskan PIC
                                  </DropdownMenuItem>
                                )}

                                {asset.status === 'available' && asset.picId && (
                                  <DropdownMenuItem onClick={() => onBorrow?.(asset)}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Pinjam Asset
                                  </DropdownMenuItem>
                                )}

                                {asset.status === 'borrowed' && (
                                  <DropdownMenuItem onClick={() => onReturn?.(asset)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Kembalikan Asset
                                  </DropdownMenuItem>
                                )}

                                {asset.status !== 'borrowed' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => setDeleteAssetId(asset.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Asset</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus asset ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteAssetId) {
                    onDelete?.(deleteAssetId);
                    setDeleteAssetId(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Detail Modal */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Asset</DialogTitle>
              <DialogDescription>
                Informasi lengkap asset
              </DialogDescription>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kode Asset</label>
                    <p className="text-sm font-medium">{selectedAsset.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nama Asset</label>
                    <p className="text-sm font-medium">{selectedAsset.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                    <p className="text-sm">{selectedAsset.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedAsset.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kondisi</label>
                    <div className="mt-1">{getConditionBadge(selectedAsset.condition)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lokasi</label>
                    <p className="text-sm">{selectedAsset.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Harga Pembelian</label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(selectedAsset.purchasePrice)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">PIC</label>
                    <p className="text-sm">
                      {selectedAsset.picName || 'Belum Ditugaskan'}
                    </p>
                  </div>
                  {selectedAsset.purchaseDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tanggal Pembelian</label>
                      <p className="text-sm">
                        {format(new Date(selectedAsset.purchaseDate), 'dd MMM yyyy', { locale: id })}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dibuat Pada</label>
                    <p className="text-sm">
                      {format(new Date(selectedAsset.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>
                
                {selectedAsset.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                    <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                      {selectedAsset.description}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                    Tutup
                  </Button>
                  {canEdit && (
                    <Button onClick={() => {
                      onEdit?.(selectedAsset);
                      setDetailDialogOpen(false);
                    }}>
                      Edit Asset
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};