import { useState, useMemo } from 'react';
import { Plus, Download, Package, AlertTriangle, Clock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { hasPermission } from '@/lib/permissions';

export default function Inventory() {
  const { medicines, addMedicine, updateMedicineStock } = useData();
  const { selectedCorporate, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExpired, setShowExpired] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', brand: '', category: '',
    quantity: '', unit: '', minStock: '', expiryDate: '',
  });

  const now = new Date();

  const expiredMedicines = useMemo(() => 
    medicines.filter(m => m.expiryDate && new Date(m.expiryDate) < now),
    [medicines]
  );

  const filteredMedicines = (showExpired ? expiredMedicines : medicines).filter(m => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(lowerQuery) || 
             m.sku.toLowerCase().includes(lowerQuery) ||
             m.brand.toLowerCase().includes(lowerQuery);
    }
    return true;
  });

  const isLowStockItem = (m: typeof medicines[0]) => {
    const twentyPercent = (m.totalQuantity || m.quantity) * 0.2;
    return m.quantity <= twentyPercent || m.quantity <= m.minStock;
  };
  const lowStockCount = medicines.filter(isLowStockItem).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.quantity || !formData.unit) {
      toast.error('Please fill in all required fields'); return;
    }
    const qty = parseInt(formData.quantity);
    addMedicine({
      name: formData.name, sku: formData.sku, brand: formData.brand,
      category: formData.category, quantity: qty,
      totalQuantity: qty,
      unit: formData.unit, minStock: parseInt(formData.minStock) || 10,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      locationId: selectedCorporate?.id || '',
    });
    toast.success('Medicine added successfully!');
    setIsDialogOpen(false);
    setFormData({ name: '', sku: '', brand: '', category: '', quantity: '', unit: '', minStock: '', expiryDate: '' });
  };

  const handleStockUpdate = (id: string, currentQty: number) => {
    const newQty = prompt('Enter new stock quantity:', currentQty.toString());
    if (newQty !== null && !isNaN(parseInt(newQty))) {
      updateMedicineStock(id, parseInt(newQty));
      toast.success('Stock updated successfully!');
    }
  };

  const exportToCSV = () => {
    const title = 'Medicine Inventory Report';
    const generated = `Generated On: ${new Date().toLocaleString('en-IN')}`;
    const summary = `Total Items: ${medicines.length} | Low Stock: ${lowStockCount} | Expired: ${expiredMedicines.length}`;
    
    const headers = ['S.No', 'SKU', 'Medicine Name', 'Brand', 'Category', 'Current Qty', 'Unit', 'Min Stock Level', 'Expiry Date', 'Status'];
    const data = medicines.map((med, i) => [
      i + 1, med.sku, med.name, med.brand, med.category,
      med.quantity.toString(), med.unit, med.minStock.toString(),
      med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN') : '-',
      med.quantity <= med.minStock ? 'Low Stock' : (med.expiryDate && new Date(med.expiryDate) < now ? 'Expired' : 'In Stock')
    ]);
    
    const csvRows = [
      [title], [generated], [summary], [],
      headers, ...data
    ];
    const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventory-Report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const categories = ['Analgesic', 'Antihistamine', 'Antacid', 'Antibiotic', 'First Aid', 'Electrolyte', 'Vitamin', 'Other'];
  const units = ['tablets', 'capsules', 'ml', 'sachets', 'rolls', 'pieces', 'bottles'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medicine Inventory</h1>
          <p className="text-muted-foreground">Track location-wise medicine stock</p>
        </div>
        <div className="flex gap-3">
          {hasPermission(user?.role, 'download_mis') && (
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Medicine</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Add New Medicine</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 pt-4">
                <div className="form-group">
                  <Label className="form-label">Medicine Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Paracetamol 500mg" required />
                </div>
                <div className="form-group">
                  <Label className="form-label">SKU / Item ID *</Label>
                  <Input value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} placeholder="e.g., PAR500" required />
                </div>
                <div className="form-group">
                  <Label className="form-label">Brand</Label>
                  <Input value={formData.brand} onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))} placeholder="e.g., Crocin" />
                </div>
                <div className="form-group">
                  <Label className="form-label">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label className="form-label">Quantity *</Label>
                  <Input type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))} placeholder="e.g., 500" required />
                </div>
                <div className="form-group">
                  <Label className="form-label">Unit *</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>{units.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label className="form-label">Minimum Stock Level</Label>
                  <Input type="number" value={formData.minStock} onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))} placeholder="e.g., 100" />
                </div>
                <div className="form-group">
                  <Label className="form-label">Expiry Date</Label>
                  <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))} />
                </div>
                <div className="col-span-2 flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Medicine</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-3xl font-bold text-warning">{lowStockCount}</p>
              </div>
              <div className="bg-warning p-3 rounded-xl"><AlertTriangle className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`stat-card cursor-pointer transition-all ${showExpired ? 'ring-2 ring-destructive' : 'hover:ring-1 hover:ring-destructive/50'}`}
          onClick={() => setShowExpired(!showExpired)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired Medicines</p>
                <p className="text-3xl font-bold text-destructive">{expiredMedicines.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{showExpired ? 'Click to show all' : 'Click to view'}</p>
              </div>
              <div className="bg-destructive p-3 rounded-xl"><Clock className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Value</p>
                <p className="text-3xl font-bold text-foreground">{medicines.reduce((acc, m) => acc + m.quantity, 0)}</p>
              </div>
              <div className="bg-success p-3 rounded-xl"><Package className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + expired filter indicator */}
      <Card className="content-panel">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by medicine name, SKU, or brand..." className="max-w-md" />
            {showExpired && (
              <Badge variant="destructive" className="gap-1 cursor-pointer" onClick={() => setShowExpired(false)}>
                Showing Expired Only <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {showExpired ? `Expired Medicines (${filteredMedicines.length})` : `Medicine Stock (${filteredMedicines.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((medicine) => {
                  const isLowStock = isLowStockItem(medicine);
                  const isExpired = medicine.expiryDate && new Date(medicine.expiryDate) < now;
                  return (
                    <TableRow key={medicine.id} className={isExpired ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-mono text-sm">{medicine.sku}</TableCell>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.brand}</TableCell>
                      <TableCell>{medicine.category}</TableCell>
                      <TableCell className={isLowStock ? 'text-warning font-medium' : ''}>
                        {medicine.quantity} {medicine.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{medicine.minStock}</TableCell>
                      <TableCell className={isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isExpired && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive">Expired</span>
                          )}
                          {isLowStock && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-warning/10 text-warning">Low Stock</span>
                          )}
                          {!isExpired && !isLowStock && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-success/10 text-success">In Stock</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleStockUpdate(medicine.id, medicine.quantity)}>Update</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMedicines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {showExpired ? 'No expired medicines found' : 'No medicines found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
