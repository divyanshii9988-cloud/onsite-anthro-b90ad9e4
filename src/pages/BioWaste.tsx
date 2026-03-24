import { useState } from 'react';
import { Plus, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DateRangeFilter, DateRange, getDefaultDateRange, filterByDateRange } from '@/components/DateRangeFilter';
import { hasPermission } from '@/lib/permissions';

export default function BioWaste() {
  const { bioWaste, addBioWaste } = useData();
  const { selectedCorporate, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [formData, setFormData] = useState({ wasteType: '' as 'yellow' | 'red' | 'blue' | 'white' | 'black' | '', quantity: '', unit: 'kg' as 'kg' | 'grams' | 'bags', collectedBy: '', collectorContact: '', remarks: '' });

  const filteredBioWaste = filterByDateRange(bioWaste, dateRange, 'collectedAt');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.wasteType || !formData.quantity || !formData.collectedBy) { toast.error('Please fill in all required fields'); return; }
    try {
      await addBioWaste({ wasteType: formData.wasteType as 'yellow' | 'red' | 'blue' | 'white' | 'black', quantity: parseFloat(formData.quantity), unit: formData.unit as any, collectedBy: formData.collectedBy, collectorContact: formData.collectorContact || undefined, collectedAt: new Date(), remarks: formData.remarks || undefined, locationId: selectedCorporate?.id || '' });
      toast.success('Biomedical waste log added successfully!');
      setIsDialogOpen(false);
      setFormData({ wasteType: '', quantity: '', unit: 'kg', collectedBy: '', collectorContact: '', remarks: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add waste log');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Quantity', 'Unit', 'Collected By', 'Remarks'];
    const data = filteredBioWaste.map(w => [new Date(w.collectedAt).toLocaleDateString(), w.wasteType, w.quantity.toString(), w.unit, w.collectedBy, w.remarks || '-']);
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biowaste-${dateRange.label.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const wasteTypes = [{ value: 'yellow', label: 'Yellow (Infectious)', color: 'bg-yellow-500' }, { value: 'red', label: 'Red (Contaminated)', color: 'bg-red-500' }, { value: 'blue', label: 'Blue (Glassware)', color: 'bg-blue-500' }, { value: 'white', label: 'White (Sharps)', color: 'bg-gray-200' }, { value: 'black', label: 'Black (General)', color: 'bg-gray-800' }];
  const getWasteColor = (type: string) => wasteTypes.find(w => w.value === type)?.color || 'bg-gray-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-foreground">Bio-Medical Waste Management</h1><p className="text-muted-foreground">Track waste disposal for compliance</p></div>
        <div className="flex gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          {hasPermission(user?.role, 'download_mis') && <Button onClick={exportToCSV} variant="outline" className="gap-2"><Download className="w-4 h-4" />Export</Button>}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />Add Waste Log</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Biomedical Waste</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="form-group"><Label className="form-label">Waste Type *</Label><Select value={formData.wasteType} onValueChange={(value: 'yellow' | 'red' | 'blue' | 'white' | 'black') => setFormData(prev => ({ ...prev, wasteType: value }))}><SelectTrigger><SelectValue placeholder="Select waste type" /></SelectTrigger><SelectContent>{wasteTypes.map(type => (<SelectItem key={type.value} value={type.value}><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${type.color}`} />{type.label}</div></SelectItem>))}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4"><div className="form-group"><Label className="form-label">Quantity *</Label><Input type="number" step="0.1" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))} placeholder="e.g., 2.5" required /></div><div className="form-group"><Label className="form-label">Unit *</Label><Select value={formData.unit} onValueChange={(value: 'kg' | 'grams' | 'bags') => setFormData(prev => ({ ...prev, unit: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">Kilograms (kg)</SelectItem><SelectItem value="grams">Grams (g)</SelectItem><SelectItem value="bags">Bags</SelectItem></SelectContent></Select></div></div>
                <div className="form-group"><Label className="form-label">Collected By *</Label><Input value={formData.collectedBy} onChange={(e) => setFormData(prev => ({ ...prev, collectedBy: e.target.value }))} placeholder="Name of collector / agency" required /></div>
                <div className="form-group"><Label className="form-label">Collector Contact Number</Label><Input value={formData.collectorContact} onChange={(e) => setFormData(prev => ({ ...prev, collectorContact: e.target.value }))} placeholder="e.g., 9876543210" /></div>
                <div className="form-group"><Label className="form-label">Remarks</Label><Textarea value={formData.remarks} onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))} placeholder="Any additional notes..." rows={2} /></div>
                <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">Add Log</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card className="content-panel"><CardContent className="pt-6"><div className="flex flex-wrap gap-4">{wasteTypes.map(type => (<div key={type.value} className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${type.color}`} /><span className="text-sm text-muted-foreground">{type.label}</span></div>))}</div></CardContent></Card>
      <Card className="content-panel">
        <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Trash2 className="w-5 h-5 text-primary" />Waste Disposal Log ({filteredBioWaste.length})</CardTitle></CardHeader>
        <CardContent>
          {filteredBioWaste.length > 0 ? (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Quantity</TableHead><TableHead>Collected By</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader><TableBody>{filteredBioWaste.map((waste) => (<TableRow key={waste.id}><TableCell className="text-muted-foreground">{new Date(waste.collectedAt).toLocaleDateString()}</TableCell><TableCell><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${getWasteColor(waste.wasteType)}`} /><span className="capitalize">{waste.wasteType}</span></div></TableCell><TableCell>{waste.quantity} {waste.unit}</TableCell><TableCell>{waste.collectedBy}</TableCell><TableCell className="text-muted-foreground">{waste.remarks || '-'}</TableCell></TableRow>))}</TableBody></Table></div>
          ) : (<div className="text-center py-12 text-muted-foreground"><Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No waste logs recorded</p></div>)}
        </CardContent>
      </Card>
    </div>
  );
}
