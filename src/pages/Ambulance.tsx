import { useState } from 'react';
import { Plus, Download, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DateRangeFilter, DateRange, getDefaultDateRange, filterByDateRange } from '@/components/DateRangeFilter';
import { hasPermission } from '@/lib/permissions';

export default function Ambulance() {
  const { ambulanceMovements, addAmbulanceMovement } = useData();
  const { selectedCorporate, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [formData, setFormData] = useState({ vehicleNumber: '', driverName: '', driverContact: '', patientName: '', pickupLocation: '', dropLocation: '', reasonOfTransfer: '' });

  const filteredMovements = filterByDateRange(ambulanceMovements, dateRange, 'departureTime');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleNumber || !formData.patientName || !formData.pickupLocation || !formData.dropLocation || !formData.reasonOfTransfer) { toast.error('Please fill in all required fields'); return; }
    addAmbulanceMovement({ vehicleNumber: formData.vehicleNumber, driverName: formData.driverName, driverContact: formData.driverContact, patientName: formData.patientName, pickupLocation: formData.pickupLocation, dropLocation: formData.dropLocation, departureTime: new Date(), reasonOfTransfer: formData.reasonOfTransfer, locationId: selectedCorporate?.id || '' });
    toast.success('Ambulance movement logged successfully!');
    setIsDialogOpen(false);
    setFormData({ vehicleNumber: '', driverName: '', driverContact: '', patientName: '', pickupLocation: '', dropLocation: '', reasonOfTransfer: '' });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Vehicle', 'Driver', 'Patient', 'Pickup', 'Drop', 'Reason of Transfer'];
    const data = filteredMovements.map(m => [new Date(m.departureTime).toLocaleDateString(), new Date(m.departureTime).toLocaleTimeString(), m.vehicleNumber, m.driverName, m.patientName, m.pickupLocation, m.dropLocation, m.reasonOfTransfer || '-']);
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ambulance-${dateRange.label.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-foreground">Ambulance Movement</h1><p className="text-muted-foreground">Track ambulance usage and movements</p></div>
        <div className="flex gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          {hasPermission(user?.role, 'download_mis') && <Button onClick={exportToCSV} variant="outline" className="gap-2"><Download className="w-4 h-4" />Export</Button>}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />Log Movement</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="w-5 h-5" />Log Ambulance Movement</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4"><div className="form-group"><Label className="form-label">Vehicle Number *</Label><Input value={formData.vehicleNumber} onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))} placeholder="e.g., KA01AB1234" required /></div><div className="form-group"><Label className="form-label">Patient Name *</Label><Input value={formData.patientName} onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))} placeholder="Patient name" required /></div></div>
                <div className="grid grid-cols-2 gap-4"><div className="form-group"><Label className="form-label">Driver Name</Label><Input value={formData.driverName} onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))} placeholder="Driver name" /></div><div className="form-group"><Label className="form-label">Driver Contact</Label><Input value={formData.driverContact} onChange={(e) => setFormData(prev => ({ ...prev, driverContact: e.target.value }))} placeholder="Contact number" /></div></div>
                <div className="form-group"><Label className="form-label">Pickup Location *</Label><Input value={formData.pickupLocation} onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))} placeholder="e.g., Clinic / Building A" required /></div>
                <div className="form-group"><Label className="form-label">Drop Location *</Label><Input value={formData.dropLocation} onChange={(e) => setFormData(prev => ({ ...prev, dropLocation: e.target.value }))} placeholder="e.g., Apollo Hospital" required /></div>
                <div className="form-group"><Label className="form-label">Reason of Transfer *</Label><Textarea value={formData.reasonOfTransfer} onChange={(e) => setFormData(prev => ({ ...prev, reasonOfTransfer: e.target.value }))} placeholder="e.g., Emergency cardiac care, Specialist consultation required..." rows={2} required /></div>
                <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit">Log Movement</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card className="content-panel">
        <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-primary" />Movement Log ({filteredMovements.length})</CardTitle></CardHeader>
        <CardContent>
          {filteredMovements.length > 0 ? (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date/Time</TableHead><TableHead>Vehicle</TableHead><TableHead>Driver</TableHead><TableHead>Patient</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Reason of Transfer</TableHead></TableRow></TableHeader><TableBody>{filteredMovements.map((movement) => (<TableRow key={movement.id}><TableCell className="text-muted-foreground">{new Date(movement.departureTime).toLocaleDateString()}<br /><span className="text-xs">{new Date(movement.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></TableCell><TableCell className="font-mono text-sm">{movement.vehicleNumber}</TableCell><TableCell>{movement.driverName || '-'}{movement.driverContact && (<span className="block text-xs text-muted-foreground">{movement.driverContact}</span>)}</TableCell><TableCell className="font-medium">{movement.patientName}</TableCell><TableCell>{movement.pickupLocation}</TableCell><TableCell>{movement.dropLocation}</TableCell><TableCell className="text-muted-foreground max-w-xs truncate">{movement.reasonOfTransfer || '-'}</TableCell></TableRow>))}</TableBody></Table></div>
          ) : (<div className="text-center py-12 text-muted-foreground"><Truck className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No ambulance movements logged</p></div>)}
        </CardContent>
      </Card>
    </div>
  );
}
