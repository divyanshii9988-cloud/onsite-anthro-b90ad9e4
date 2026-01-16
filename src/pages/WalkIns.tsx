import { useState } from 'react';
import { Plus, Download, Search, Stethoscope } from 'lucide-react';
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

export default function WalkIns() {
  const { walkIns, addWalkIn, employees, medicines } = useData();
  const { location, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [formData, setFormData] = useState({
    consultationType: 'doctor' as 'doctor' | 'nurse',
    chiefComplaint: '',
    diagnosis: '',
    bp: '',
    pulse: '',
    temperature: '',
    spo2: '',
    weight: '',
    medicineId: '',
    medicineQty: '',
    prescription: '',
  });

  // Search employees by text input
  const matchingEmployees = employeeSearchQuery.length >= 2 
    ? employees.filter(e => 
        e.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(employeeSearchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const selectedEmp = employees.find(e => e.id === selectedEmployee);
  
  // Filter walk-ins by date range and search
  const dateFilteredWalkIns = filterByDateRange(walkIns, dateRange, 'createdAt');
  const filteredWalkIns = dateFilteredWalkIns.filter(w => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return w.employeeName.toLowerCase().includes(lowerQuery) || 
             w.chiefComplaint.toLowerCase().includes(lowerQuery);
    }
    return true;
  });

  const handleSelectEmployee = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setSelectedEmployee(empId);
    setEmployeeSearchQuery(emp?.name || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !formData.chiefComplaint) {
      toast.error('Please select an employee and enter chief complaint');
      return;
    }

    const selectedMedicine = medicines.find(m => m.id === formData.medicineId);

    addWalkIn({
      employeeId: selectedEmployee,
      employeeName: selectedEmp?.name || '',
      consultationType: formData.consultationType,
      doctorName: user?.name,
      chiefComplaint: formData.chiefComplaint,
      diagnosis: formData.diagnosis || undefined,
      vitals: {
        bp: formData.bp || undefined,
        pulse: formData.pulse ? parseInt(formData.pulse) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        spo2: formData.spo2 ? parseInt(formData.spo2) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
      },
      medicinesDispensed: selectedMedicine && formData.medicineQty ? [{
        medicineId: formData.medicineId,
        medicineName: selectedMedicine.name,
        quantity: parseInt(formData.medicineQty),
      }] : undefined,
      prescription: formData.prescription || undefined,
      locationId: location?.id || '',
    });

    toast.success('Walk-in recorded successfully!');
    setIsDialogOpen(false);
    setSelectedEmployee('');
    setEmployeeSearchQuery('');
    setFormData({
      consultationType: 'doctor',
      chiefComplaint: '', diagnosis: '',
      bp: '', pulse: '', temperature: '', spo2: '', weight: '',
      medicineId: '', medicineQty: '', prescription: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Employee', 'Type', 'Complaint', 'Diagnosis', 'Doctor/Nurse'];
    const data = filteredWalkIns.map(w => [
      new Date(w.createdAt).toLocaleDateString(),
      new Date(w.createdAt).toLocaleTimeString(),
      w.employeeName,
      w.consultationType,
      w.chiefComplaint,
      w.diagnosis || '-',
      w.doctorName || '-'
    ]);
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `walk-ins-${dateRange.label.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Walk-ins</h1>
          <p className="text-muted-foreground">Track doctor/nurse consultations</p>
        </div>
        <div className="flex gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Walk-in
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record New Walk-in</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                {/* Employee Selection - Text Input */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group col-span-2">
                    <Label className="form-label">Search Employee *</Label>
                    <div className="relative">
                      <Input
                        value={employeeSearchQuery}
                        onChange={(e) => {
                          setEmployeeSearchQuery(e.target.value);
                          if (selectedEmployee) setSelectedEmployee('');
                        }}
                        placeholder="Type employee name or ID to search..."
                      />
                      {matchingEmployees.length > 0 && !selectedEmployee && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {matchingEmployees.map(emp => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => handleSelectEmployee(emp.id)}
                              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                            >
                              <span className="font-medium">{emp.name}</span>
                              <span className="text-muted-foreground ml-2">({emp.employeeId})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedEmp && (
                      <p className="text-xs text-primary mt-1">
                        Selected: {selectedEmp.name} ({selectedEmp.employeeId})
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <Label className="form-label">Consultation Type *</Label>
                    <Select 
                      value={formData.consultationType} 
                      onValueChange={(value: 'doctor' | 'nurse') => setFormData(prev => ({ ...prev, consultationType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor Consultation</SelectItem>
                        <SelectItem value="nurse">Nurse Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-group">
                    <Label className="form-label">Chief Complaint *</Label>
                    <Input
                      value={formData.chiefComplaint}
                      onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                      placeholder="e.g., Headache, Fever"
                      required
                    />
                  </div>
                </div>

                {/* Vitals */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Vitals</h4>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="form-group">
                      <Label className="form-label text-xs">BP (mmHg)</Label>
                      <Input
                        value={formData.bp}
                        onChange={(e) => setFormData(prev => ({ ...prev, bp: e.target.value }))}
                        placeholder="120/80"
                      />
                    </div>
                    <div className="form-group">
                      <Label className="form-label text-xs">Pulse (bpm)</Label>
                      <Input
                        type="number"
                        value={formData.pulse}
                        onChange={(e) => setFormData(prev => ({ ...prev, pulse: e.target.value }))}
                        placeholder="72"
                      />
                    </div>
                    <div className="form-group">
                      <Label className="form-label text-xs">Temp (°F)</Label>
                      <Input
                        value={formData.temperature}
                        onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                        placeholder="98.6"
                      />
                    </div>
                    <div className="form-group">
                      <Label className="form-label text-xs">SpO2 (%)</Label>
                      <Input
                        type="number"
                        value={formData.spo2}
                        onChange={(e) => setFormData(prev => ({ ...prev, spo2: e.target.value }))}
                        placeholder="98"
                      />
                    </div>
                    <div className="form-group">
                      <Label className="form-label text-xs">Weight (kg)</Label>
                      <Input
                        value={formData.weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="70"
                      />
                    </div>
                  </div>
                </div>

                {/* Diagnosis & Medicine */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <Label className="form-label">Diagnosis</Label>
                    <Input
                      value={formData.diagnosis}
                      onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                      placeholder="e.g., Viral fever"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="form-group">
                      <Label className="form-label">Medicine</Label>
                      <Select value={formData.medicineId} onValueChange={(value) => setFormData(prev => ({ ...prev, medicineId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines.map(med => (
                            <SelectItem key={med.id} value={med.id}>
                              {med.name} ({med.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="form-group">
                      <Label className="form-label">Qty</Label>
                      <Input
                        type="number"
                        value={formData.medicineQty}
                        onChange={(e) => setFormData(prev => ({ ...prev, medicineQty: e.target.value }))}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <Label className="form-label">Prescription Notes</Label>
                  <Textarea
                    value={formData.prescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, prescription: e.target.value }))}
                    placeholder="Enter prescription details..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Walk-in</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card className="content-panel">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name or complaint..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Walk-ins Table */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Walk-ins ({filteredWalkIns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Vitals</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Attended By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWalkIns.map((walkIn) => (
                  <TableRow key={walkIn.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(walkIn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="font-medium">{walkIn.employeeName}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        walkIn.consultationType === 'doctor' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-info/10 text-info'
                      }`}>
                        {walkIn.consultationType === 'doctor' ? 'Doctor' : 'Nurse'}
                      </span>
                    </TableCell>
                    <TableCell>{walkIn.chiefComplaint}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {walkIn.vitals?.bp && `BP: ${walkIn.vitals.bp}`}
                      {walkIn.vitals?.temperature && `, T: ${walkIn.vitals.temperature}°F`}
                    </TableCell>
                    <TableCell>{walkIn.diagnosis || '-'}</TableCell>
                    <TableCell>{walkIn.doctorName || '-'}</TableCell>
                  </TableRow>
                ))}
                {filteredWalkIns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No walk-ins recorded in this period
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
