import { useState } from 'react';
import { Plus, Download, FileText, Send, Mail, Phone } from 'lucide-react';
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

export default function Prescriptions() {
  const { prescriptions, addPrescription, employees } = useData();
  const { selectedCorporate, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [formData, setFormData] = useState({ diagnosis: '', medicines: '', advice: '', sentVia: 'email' as 'sms' | 'email' | 'both' });

  const selectedEmp = employees.find(e => e.id === selectedEmployee);
  const filteredPrescriptions = filterByDateRange(prescriptions, dateRange, 'sentAt');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission(user?.role, 'generate_prescription')) { toast.error('Access Denied: You do not have permission to generate prescriptions'); return; }
    if (!selectedEmployee || !formData.diagnosis || !formData.medicines) { toast.error('Please fill in all required fields'); return; }
    
    const medicineLines = formData.medicines.split('\n').filter(line => line.trim());
    const parsedMedicines = medicineLines.map(line => { 
      const parts = line.split('-').map(p => p.trim()); 
      return { name: parts[0] || line, dosage: parts[1] || '', duration: parts[2] || '', instructions: parts[3] || '' }; 
    });
    
    const sentTo = formData.sentVia === 'sms' || formData.sentVia === 'both' ? selectedEmp?.mobile : selectedEmp?.email;
    
    // Send email via edge function if email is selected
    if (formData.sentVia === 'email' || formData.sentVia === 'both') {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.functions.invoke('send-prescription-email', {
          body: {
            patientEmail: selectedEmp?.email,
            patientName: selectedEmp?.name,
            doctorName: user?.name || 'Doctor',
            diagnosis: formData.diagnosis,
            medicines: parsedMedicines,
            advice: formData.advice || undefined,
          }
        });
        
        if (error) throw error;
      } catch (error) {
        console.error('Error sending prescription email:', error);
        toast.error('Failed to send email. Please try again.');
        return;
      }
    }
    
    addPrescription({ 
      walkInId: '', 
      employeeId: selectedEmployee, 
      employeeName: selectedEmp?.name || '', 
      doctorName: user?.name || 'Doctor', 
      medicines: parsedMedicines, 
      diagnosis: formData.diagnosis, 
      advice: formData.advice || undefined, 
      sentVia: formData.sentVia, 
      sentTo: sentTo || '', 
      locationId: selectedCorporate?.id || '' 
    });
    
    toast.success(`Digital prescription sent via ${formData.sentVia}!`);
    setIsDialogOpen(false);
    setSelectedEmployee('');
    setFormData({ diagnosis: '', medicines: '', advice: '', sentVia: 'email' });
  };

  const canDownloadMIS = hasPermission(user?.role, 'download_mis');
  const canGeneratePrescription = hasPermission(user?.role, 'generate_prescription');

  const exportToCSV = () => {
    const headers = ['Date', 'Patient', 'Diagnosis', 'Doctor', 'Sent Via', 'Sent To'];
    const data = filteredPrescriptions.map(p => [new Date(p.sentAt).toLocaleDateString(), p.employeeName, p.diagnosis, p.doctorName, p.sentVia, p.sentTo]);
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescriptions-${dateRange.label.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-foreground">Digital Prescription</h1><p className="text-muted-foreground">Generate and send prescriptions via SMS/Email</p></div>
        <div className="flex gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          {canDownloadMIS && <Button onClick={exportToCSV} variant="outline" className="gap-2"><Download className="w-4 h-4" />Export</Button>}
          {canGeneratePrescription && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />New Prescription</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Create Digital Prescription</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4"><div className="form-group"><Label className="form-label">Patient *</Label><Select value={selectedEmployee} onValueChange={setSelectedEmployee}><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger><SelectContent>{employees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</SelectItem>))}</SelectContent></Select></div><div className="form-group"><Label className="form-label">Send Via *</Label><Select value={formData.sentVia} onValueChange={(value: 'sms' | 'email' | 'both') => setFormData(prev => ({ ...prev, sentVia: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email"><div className="flex items-center gap-2"><Mail className="w-4 h-4" />Email</div></SelectItem><SelectItem value="sms"><div className="flex items-center gap-2"><Phone className="w-4 h-4" />SMS</div></SelectItem><SelectItem value="both">Both (Email + SMS)</SelectItem></SelectContent></Select></div></div>
                {selectedEmp && (<div className="p-3 bg-muted/50 rounded-lg text-sm"><p><strong>Email:</strong> {selectedEmp.email}</p><p><strong>Mobile:</strong> {selectedEmp.mobile}</p></div>)}
                <div className="form-group"><Label className="form-label">Diagnosis *</Label><Input value={formData.diagnosis} onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))} placeholder="e.g., Viral fever with throat infection" required /></div>
                <div className="form-group"><Label className="form-label">Medicines * (one per line)</Label><Textarea value={formData.medicines} onChange={(e) => setFormData(prev => ({ ...prev, medicines: e.target.value }))} placeholder="Format: Medicine Name - Dosage - Duration - Instructions" rows={5} required /><p className="text-xs text-muted-foreground mt-1">Enter each medicine on a new line. Use dashes (-) to separate name, dosage, duration, and instructions.</p></div>
                <div className="form-group"><Label className="form-label">Advice / Instructions</Label><Textarea value={formData.advice} onChange={(e) => setFormData(prev => ({ ...prev, advice: e.target.value }))} placeholder="e.g., Rest for 2 days. Drink plenty of fluids." rows={3} /></div>
                <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit" className="gap-2"><Send className="w-4 h-4" />Send Prescription</Button></div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="stat-card"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Prescriptions</p><p className="text-3xl font-bold text-foreground">{filteredPrescriptions.length}</p></div><div className="bg-primary p-3 rounded-xl"><FileText className="w-6 h-6 text-white" /></div></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Sent via Email</p><p className="text-3xl font-bold text-foreground">{filteredPrescriptions.filter(p => p.sentVia === 'email' || p.sentVia === 'both').length}</p></div><div className="bg-info p-3 rounded-xl"><Mail className="w-6 h-6 text-white" /></div></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Sent via SMS</p><p className="text-3xl font-bold text-foreground">{filteredPrescriptions.filter(p => p.sentVia === 'sms' || p.sentVia === 'both').length}</p></div><div className="bg-success p-3 rounded-xl"><Phone className="w-6 h-6 text-white" /></div></div></CardContent></Card>
      </div>
      <Card className="content-panel">
        <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Prescription History ({filteredPrescriptions.length})</CardTitle></CardHeader>
        <CardContent>
          {filteredPrescriptions.length > 0 ? (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Patient</TableHead><TableHead>Diagnosis</TableHead><TableHead>Medicines</TableHead><TableHead>Doctor</TableHead><TableHead>Sent Via</TableHead><TableHead>Sent To</TableHead></TableRow></TableHeader><TableBody>{filteredPrescriptions.map((prescription) => (<TableRow key={prescription.id}><TableCell className="text-muted-foreground">{new Date(prescription.sentAt).toLocaleDateString()}</TableCell><TableCell className="font-medium">{prescription.employeeName}</TableCell><TableCell>{prescription.diagnosis}</TableCell><TableCell className="max-w-xs">{prescription.medicines.map((m, i) => (<span key={i} className="block text-sm">• {m.name} {m.dosage && `(${m.dosage})`}</span>))}</TableCell><TableCell>{prescription.doctorName}</TableCell><TableCell><div className="flex items-center gap-1">{(prescription.sentVia === 'email' || prescription.sentVia === 'both') && (<Mail className="w-4 h-4 text-info" />)}{(prescription.sentVia === 'sms' || prescription.sentVia === 'both') && (<Phone className="w-4 h-4 text-success" />)}</div></TableCell><TableCell className="text-muted-foreground text-sm">{prescription.sentTo}</TableCell></TableRow>))}</TableBody></Table></div>
          ) : (<div className="text-center py-12 text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No prescriptions sent yet</p></div>)}
        </CardContent>
      </Card>
    </div>
  );
}
