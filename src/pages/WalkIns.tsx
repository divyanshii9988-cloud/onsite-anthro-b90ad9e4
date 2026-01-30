import { useState } from 'react';
import { Plus, Download, Search, Stethoscope, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DateRangeFilter, DateRange, getDefaultDateRange, filterByDateRange } from '@/components/DateRangeFilter';

type EntryFilter = 'all' | 'walkIns' | 'emergencies';

export default function WalkIns() {
  const { walkIns, addWalkIn, employees, medicines } = useData();
  const { selectedCorporate, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [isEmergency, setIsEmergency] = useState(false);
  const [entryFilter, setEntryFilter] = useState<EntryFilter>('all');
  
  // Walk-in form data
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

  // Emergency form data
  const [emergencyData, setEmergencyData] = useState({
    incidentType: '',
    severity: 'moderate' as 'minor' | 'moderate' | 'critical',
    description: '',
    actionTaken: '',
    ambulanceUsed: false,
    ambulanceDetails: '',
    escalatedTo: '',
    outcome: '',
  });

  const incidentTypes = ['Cardiac Emergency', 'Breathing Difficulty', 'Fainting/Unconsciousness', 'Seizure', 'Severe Allergic Reaction', 'Workplace Injury', 'Fall', 'Burn', 'Electric Shock', 'Food Poisoning', 'Other'];

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
    // Apply entry type filter
    if (entryFilter === 'walkIns' && w.isEmergency) return false;
    if (entryFilter === 'emergencies' && !w.isEmergency) return false;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return w.employeeName.toLowerCase().includes(lowerQuery) || 
             w.chiefComplaint.toLowerCase().includes(lowerQuery);
    }
    return true;
  });

  // Count stats
  const walkInCount = dateFilteredWalkIns.filter(w => !w.isEmergency).length;
  const emergencyCount = dateFilteredWalkIns.filter(w => w.isEmergency).length;

  const handleSelectEmployee = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setSelectedEmployee(empId);
    setEmployeeSearchQuery(emp?.name || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (isEmergency) {
      // Emergency submission
      if (!emergencyData.incidentType || !emergencyData.description) {
        toast.error('Please fill in incident type and description');
        return;
      }

      addWalkIn({
        employeeId: selectedEmployee,
        employeeName: selectedEmp?.name || '',
        consultationType: 'doctor',
        doctorName: user?.name,
        chiefComplaint: emergencyData.incidentType,
        diagnosis: emergencyData.description,
        locationId: selectedCorporate?.id || '',
        isEmergency: true,
        incidentType: emergencyData.incidentType,
        severity: emergencyData.severity,
        description: emergencyData.description,
        actionTaken: emergencyData.actionTaken,
        ambulanceUsed: emergencyData.ambulanceUsed,
        ambulanceDetails: emergencyData.ambulanceDetails || undefined,
        escalatedTo: emergencyData.escalatedTo || undefined,
        outcome: emergencyData.outcome,
      });

      toast.success('Emergency incident logged successfully!');
    } else {
      // Normal walk-in submission
      if (!formData.chiefComplaint) {
        toast.error('Please enter chief complaint');
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
        locationId: selectedCorporate?.id || '',
        isEmergency: false,
      });

      toast.success('Walk-in recorded successfully!');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setEmployeeSearchQuery('');
    setIsEmergency(false);
    setFormData({
      consultationType: 'doctor',
      chiefComplaint: '', diagnosis: '',
      bp: '', pulse: '', temperature: '', spo2: '', weight: '',
      medicineId: '', medicineQty: '', prescription: ''
    });
    setEmergencyData({
      incidentType: '', severity: 'moderate', description: '', actionTaken: '',
      ambulanceUsed: false, ambulanceDetails: '', escalatedTo: '', outcome: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Employee', 'Type', 'Is Emergency', 'Complaint/Incident', 'Diagnosis/Description', 'Doctor/Nurse', 'Severity', 'Ambulance'];
    const data = filteredWalkIns.map(w => [
      new Date(w.createdAt).toLocaleDateString(),
      new Date(w.createdAt).toLocaleTimeString(),
      w.employeeName,
      w.consultationType,
      w.isEmergency ? 'Yes' : 'No',
      w.isEmergency ? w.incidentType : w.chiefComplaint,
      w.isEmergency ? w.description : (w.diagnosis || '-'),
      w.doctorName || '-',
      w.severity || '-',
      w.ambulanceUsed ? 'Yes' : 'No'
    ]);
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `walk-ins-${dateRange.label.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive';
      case 'moderate': return 'bg-warning/10 text-warning';
      case 'minor': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Walk-ins</h1>
          <p className="text-muted-foreground">Track consultations and emergencies</p>
        </div>
        <div className="flex gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {isEmergency ? (
                    <><AlertTriangle className="w-5 h-5 text-destructive" />Log Emergency Incident</>
                  ) : (
                    <><Stethoscope className="w-5 h-5 text-primary" />Record New Walk-in</>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              {/* Emergency Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${isEmergency ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">Emergency / Incident</p>
                    <p className="text-xs text-muted-foreground">Toggle on for emergency cases</p>
                  </div>
                </div>
                <Switch
                  checked={isEmergency}
                  onCheckedChange={setIsEmergency}
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                {/* Employee Selection */}
                <div className="form-group">
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

                {isEmergency ? (
                  /* Emergency Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <Label className="form-label">Incident Type *</Label>
                        <Select value={emergencyData.incidentType} onValueChange={(value) => setEmergencyData(prev => ({ ...prev, incidentType: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {incidentTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="form-group">
                        <Label className="form-label">Severity *</Label>
                        <Select value={emergencyData.severity} onValueChange={(value: 'minor' | 'moderate' | 'critical') => setEmergencyData(prev => ({ ...prev, severity: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="form-group">
                      <Label className="form-label">Incident Description *</Label>
                      <Textarea
                        value={emergencyData.description}
                        onChange={(e) => setEmergencyData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what happened..."
                        rows={3}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <Label className="form-label">Action Taken</Label>
                      <Textarea
                        value={emergencyData.actionTaken}
                        onChange={(e) => setEmergencyData(prev => ({ ...prev, actionTaken: e.target.value }))}
                        placeholder="Describe the immediate actions taken..."
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="ambulance"
                        checked={emergencyData.ambulanceUsed}
                        onCheckedChange={(checked) => setEmergencyData(prev => ({ ...prev, ambulanceUsed: !!checked }))}
                      />
                      <Label htmlFor="ambulance" className="text-sm cursor-pointer">Ambulance was used</Label>
                    </div>
                    {emergencyData.ambulanceUsed && (
                      <div className="form-group">
                        <Label className="form-label">Ambulance Details</Label>
                        <Input
                          value={emergencyData.ambulanceDetails}
                          onChange={(e) => setEmergencyData(prev => ({ ...prev, ambulanceDetails: e.target.value }))}
                          placeholder="Vehicle number, destination hospital..."
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <Label className="form-label">Escalated To</Label>
                        <Input
                          value={emergencyData.escalatedTo}
                          onChange={(e) => setEmergencyData(prev => ({ ...prev, escalatedTo: e.target.value }))}
                          placeholder="e.g., HR Manager, Safety Officer"
                        />
                      </div>
                      <div className="form-group">
                        <Label className="form-label">Outcome</Label>
                        <Input
                          value={emergencyData.outcome}
                          onChange={(e) => setEmergencyData(prev => ({ ...prev, outcome: e.target.value }))}
                          placeholder="e.g., Treated and discharged"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Walk-in Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <Label className="form-label">Consultation Type *</Label>
                        <Select 
                          value={formData.consultationType} 
                          onValueChange={(value: 'doctor' | 'nurse') => setFormData(prev => ({ ...prev, consultationType: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant={isEmergency ? 'destructive' : 'default'}>
                    {isEmergency ? 'Log Emergency' : 'Save Walk-in'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter & Search */}
      <Card className="content-panel">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name or complaint..."
                className="pl-10"
              />
            </div>
            
            {/* Entry Type Filter */}
            <div className="flex items-center gap-2">
              <Button
                variant={entryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntryFilter('all')}
              >
                All ({dateFilteredWalkIns.length})
              </Button>
              <Button
                variant={entryFilter === 'walkIns' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntryFilter('walkIns')}
                className="gap-1"
              >
                <Stethoscope className="w-4 h-4" />
                Walk-ins ({walkInCount})
              </Button>
              <Button
                variant={entryFilter === 'emergencies' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setEntryFilter('emergencies')}
                className="gap-1"
              >
                <AlertTriangle className="w-4 h-4" />
                Emergencies ({emergencyCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            {entryFilter === 'emergencies' ? (
              <><AlertTriangle className="w-5 h-5 text-destructive" />Emergency Log ({filteredWalkIns.length})</>
            ) : (
              <><Stethoscope className="w-5 h-5 text-primary" />Entries ({filteredWalkIns.length})</>
            )}
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
                  <TableHead>Complaint/Incident</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Attended By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWalkIns.map((entry) => (
                  <TableRow key={entry.id} className={entry.isEmergency ? 'bg-destructive/5' : ''}>
                    <TableCell className="text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="font-medium">{entry.employeeName}</TableCell>
                    <TableCell>
                      {entry.isEmergency ? (
                        <div className="flex items-center gap-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getSeverityColor(entry.severity)}`}>
                            {entry.severity}
                          </span>
                        </div>
                      ) : (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          entry.consultationType === 'doctor' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-info/10 text-info'
                        }`}>
                          {entry.consultationType === 'doctor' ? 'Doctor' : 'Nurse'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.isEmergency && <AlertTriangle className="w-4 h-4 text-destructive" />}
                        {entry.isEmergency ? entry.incidentType : entry.chiefComplaint}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {entry.isEmergency ? (
                        <span>{entry.description}</span>
                      ) : (
                        <span>
                          {entry.vitals?.bp && `BP: ${entry.vitals.bp}`}
                          {entry.vitals?.temperature && `, T: ${entry.vitals.temperature}°F`}
                          {entry.diagnosis && ` • ${entry.diagnosis}`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{entry.doctorName || '-'}</TableCell>
                  </TableRow>
                ))}
                {filteredWalkIns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {entryFilter === 'emergencies' 
                        ? 'No emergencies logged - that\'s good!'
                        : 'No entries recorded in this period'}
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
