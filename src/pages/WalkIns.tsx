import { useState } from 'react';
import { Plus, Download, Search, Stethoscope, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DateRangeFilter, DateRange, getDefaultDateRange, filterByDateRange } from '@/components/DateRangeFilter';
import { hasPermission } from '@/lib/permissions';

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
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
    prescription: '',
  });

  // Multi-medicine selection
  const [selectedMedicines, setSelectedMedicines] = useState<{ medicineId: string; quantity: string }[]>([
    { medicineId: '', quantity: '' }
  ]);

  const addMedicineRow = () => setSelectedMedicines(prev => [...prev, { medicineId: '', quantity: '' }]);
  const removeMedicineRow = (index: number) => setSelectedMedicines(prev => prev.filter((_, i) => i !== index));
  const updateMedicineRow = (index: number, field: 'medicineId' | 'quantity', value: string) => {
    setSelectedMedicines(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  // Emergency form data
  const [emergencyData, setEmergencyData] = useState({
    incidentType: '',
    severity: 'moderate' as 'minor' | 'moderate' | 'critical',
    description: '',
    actionTaken: '',
    bp: '',
    pulse: '',
    temperature: '',
    spo2: '',
    weight: '',
    ambulanceUsed: false,
    ambulanceDetails: '',
    escalatedTo: '',
    outcome: '',
    caseStatus: 'open' as 'open' | 'under_investigation' | 'closed',
    closureDate: '',
    closureRemarks: '',
  });

  const incidentTypes = ['Cardiac Emergency', 'Breathing Difficulty', 'Fainting/Unconsciousness', 'Seizure', 'Severe Allergic Reaction', 'Workplace Injury', 'Fall', 'Burn', 'Electric Shock', 'Food Poisoning', 'Other'];

  // Search employees by employee ID primarily
  const matchingEmployees = employeeSearchQuery.length >= 2 
    ? employees.filter(e => 
        e.employeeId.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
        e.name.toLowerCase().includes(employeeSearchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const selectedEmp = employees.find(e => e.id === selectedEmployee);
  
  // Filter walk-ins by date range and search
  const dateFilteredWalkIns = filterByDateRange(walkIns, dateRange, 'createdAt');
  const filteredWalkIns = dateFilteredWalkIns.filter(w => {
    if (entryFilter === 'walkIns' && w.isEmergency) return false;
    if (entryFilter === 'emergencies' && !w.isEmergency) return false;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const emp = employees.find(e => e.id === w.employeeId);
      return w.employeeName.toLowerCase().includes(lowerQuery) || 
             w.chiefComplaint.toLowerCase().includes(lowerQuery) ||
             (emp?.employeeId.toLowerCase().includes(lowerQuery));
    }
    return true;
  });

  const walkInCount = dateFilteredWalkIns.filter(w => !w.isEmergency).length;
  const emergencyCount = dateFilteredWalkIns.filter(w => w.isEmergency).length;

  const handleSelectEmployee = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setSelectedEmployee(empId);
    setEmployeeSearchQuery(emp?.employeeId || '');
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    let success = false;

    if (isEmergency) {
      if (!emergencyData.incidentType || !emergencyData.description) {
        toast.error('Please fill in incident type and description');
        return;
      }

      success = await addWalkIn({
        employeeId: selectedEmployee,
        employeeName: selectedEmp?.name || '',
        consultationType: 'doctor',
        doctorName: user?.name,
        chiefComplaint: emergencyData.incidentType,
        diagnosis: emergencyData.description,
        vitals: {
          bp: emergencyData.bp || undefined,
          pulse: emergencyData.pulse ? parseInt(emergencyData.pulse) : undefined,
          temperature: emergencyData.temperature ? parseFloat(emergencyData.temperature) : undefined,
          spo2: emergencyData.spo2 ? parseInt(emergencyData.spo2) : undefined,
          weight: emergencyData.weight ? parseFloat(emergencyData.weight) : undefined,
        },
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
        caseStatus: emergencyData.caseStatus,
        closureDate: emergencyData.closureDate ? new Date(emergencyData.closureDate) : undefined,
        closureRemarks: emergencyData.closureRemarks || undefined,
      });

      if (success) toast.success('Emergency incident logged successfully!');
    } else {
      if (!formData.chiefComplaint) {
        toast.error('Please enter chief complaint');
        return;
      }

      const dispensedMeds = selectedMedicines
        .filter(row => row.medicineId && row.quantity)
        .map(row => {
          const med = medicines.find(m => m.id === row.medicineId);
          return { medicineId: row.medicineId, medicineName: med?.name || '', quantity: parseInt(row.quantity) };
        });

      success = await addWalkIn({
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
        medicinesDispensed: dispensedMeds.length > 0 ? dispensedMeds : undefined,
        prescription: formData.prescription || undefined,
        locationId: selectedCorporate?.id || '',
        isEmergency: false,
      });

      if (success) toast.success('Walk-in recorded successfully!');
    }

    if (!success) return;

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
      prescription: ''
    });
    setSelectedMedicines([{ medicineId: '', quantity: '' }]);
    setEmergencyData({
      incidentType: '', severity: 'moderate', description: '', actionTaken: '',
      bp: '', pulse: '', temperature: '', spo2: '', weight: '',
      ambulanceUsed: false, ambulanceDetails: '', escalatedTo: '', outcome: '',
      caseStatus: 'open', closureDate: '', closureRemarks: '',
    });
  };

  const exportToCSV = () => {
    const title = `Walk-in & Emergency Report`;
    const period = `Report Period: ${dateRange.label}`;
    const generated = `Generated On: ${new Date().toLocaleString('en-IN')}`;
    const summary = `Total Entries: ${filteredWalkIns.length} | Walk-ins: ${walkInCount} | Emergencies: ${emergencyCount}`;
    
    const headers = ['S.No', 'Date', 'Time', 'Employee ID', 'Employee Name', 'Type', 'Is Emergency', 'Complaint/Incident', 'Diagnosis/Description', 'BP', 'Pulse', 'Temp', 'SpO2', 'Weight', 'Attended By', 'Severity', 'Case Status', 'Ambulance Used'];
    const data = filteredWalkIns.map((w, i) => {
      const emp = employees.find(e => e.id === w.employeeId);
      return [
        i + 1,
        new Date(w.createdAt).toLocaleDateString('en-IN'),
        new Date(w.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        emp?.employeeId || '-',
        w.employeeName || '-',
        w.consultationType || '-',
        w.isEmergency ? 'Yes' : 'No',
        w.isEmergency ? (w.incidentType || '-') : (w.chiefComplaint || '-'),
        w.isEmergency ? (w.description || '-') : (w.diagnosis || '-'),
        w.vitals?.bp || '-',
        w.vitals?.pulse || '-',
        w.vitals?.temperature || '-',
        w.vitals?.spo2 || '-',
        w.vitals?.weight || '-',
        w.doctorName || '-',
        w.severity || '-',
        w.caseStatus || '-',
        w.ambulanceUsed ? 'Yes' : 'No',
      ];
    });
    
    const csvRows = [
      [title], [period], [generated], [summary], [],
      headers, ...data
    ];
    const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Walk-in-Report-${dateRange.label.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
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

  const getEmpId = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp?.employeeId || '-';
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
          {hasPermission(user?.role, 'download_mis') && (
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
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
                <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                {/* Employee Selection - search by Employee ID */}
                <div className="form-group">
                  <Label className="form-label">Search by Employee ID *</Label>
                  <div className="relative">
                    <Input
                      value={employeeSearchQuery}
                      onChange={(e) => {
                        setEmployeeSearchQuery(e.target.value);
                        if (selectedEmployee) setSelectedEmployee('');
                      }}
                      placeholder="Type employee ID (e.g., INF001) or name..."
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
                            <span className="font-mono font-medium text-primary">{emp.employeeId}</span>
                            <span className="text-foreground ml-2">- {emp.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">{emp.department}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedEmp && (
                    <p className="text-xs text-primary mt-1">
                      Selected: {selectedEmp.employeeId} - {selectedEmp.name} ({selectedEmp.department})
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
                    {/* Vitals */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Vitals</h4>
                      <div className="grid grid-cols-5 gap-3">
                        <div className="form-group">
                          <Label className="form-label text-xs">BP (mmHg)</Label>
                          <Input value={emergencyData.bp || ''} onChange={(e) => setEmergencyData(prev => ({ ...prev, bp: e.target.value }))} placeholder="120/80" />
                        </div>
                        <div className="form-group">
                          <Label className="form-label text-xs">Pulse (bpm)</Label>
                          <Input type="number" value={emergencyData.pulse || ''} onChange={(e) => setEmergencyData(prev => ({ ...prev, pulse: e.target.value }))} placeholder="72" />
                        </div>
                        <div className="form-group">
                          <Label className="form-label text-xs">Temp (°F)</Label>
                          <Input value={emergencyData.temperature || ''} onChange={(e) => setEmergencyData(prev => ({ ...prev, temperature: e.target.value }))} placeholder="98.6" />
                        </div>
                        <div className="form-group">
                          <Label className="form-label text-xs">SpO2 (%)</Label>
                          <Input type="number" value={emergencyData.spo2 || ''} onChange={(e) => setEmergencyData(prev => ({ ...prev, spo2: e.target.value }))} placeholder="98" />
                        </div>
                        <div className="form-group">
                          <Label className="form-label text-xs">Weight (kg)</Label>
                          <Input value={emergencyData.weight || ''} onChange={(e) => setEmergencyData(prev => ({ ...prev, weight: e.target.value }))} placeholder="70" />
                        </div>
                      </div>
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

                    {/* Case Status Section */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-foreground mb-3">Case Status</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="form-group">
                          <Label className="form-label">Status</Label>
                          <Select value={emergencyData.caseStatus} onValueChange={(value: 'open' | 'under_investigation' | 'closed') => setEmergencyData(prev => ({ ...prev, caseStatus: value }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="under_investigation">Under Investigation</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {emergencyData.caseStatus === 'closed' && (
                          <>
                            <div className="form-group">
                              <Label className="form-label">Closure Date</Label>
                              <Input
                                type="date"
                                value={emergencyData.closureDate}
                                onChange={(e) => setEmergencyData(prev => ({ ...prev, closureDate: e.target.value }))}
                              />
                            </div>
                            <div className="form-group">
                              <Label className="form-label">Closure Remarks</Label>
                              <Input
                                value={emergencyData.closureRemarks}
                                onChange={(e) => setEmergencyData(prev => ({ ...prev, closureRemarks: e.target.value }))}
                                placeholder="Remarks on closure"
                              />
                            </div>
                          </>
                        )}
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
                        <Select value={formData.chiefComplaint} onValueChange={(value) => setFormData(prev => ({ ...prev, chiefComplaint: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select chief complaint" /></SelectTrigger>
                          <SelectContent>
                            {['Headache', 'Fever', 'Body Pain', 'Cough & Cold', 'Throat Infection', 'Stomach Ache', 'Acidity / Gas', 'Diarrhea', 'Nausea / Vomiting', 'Dizziness', 'Back Pain', 'Joint Pain', 'Allergy / Skin Rash', 'Eye Irritation', 'Ear Pain', 'Chest Pain', 'Breathing Difficulty', 'Toothache', 'Menstrual Cramps', 'Fatigue / Weakness', 'High BP', 'Low BP', 'Diabetes Related', 'Insect Bite', 'Minor Injury / Cut', 'Burns', 'Sprain / Strain', 'Food Poisoning', 'Dehydration', 'Anxiety / Stress', 'Other'].map(complaint => (
                              <SelectItem key={complaint} value={complaint}>{complaint}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Vitals */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Vitals</h4>
                      <div className="grid grid-cols-5 gap-3">
                        <div className="form-group">
                          <Label className="form-label text-xs">BP (mmHg)</Label>
                          <Input value={formData.bp} onChange={(e) => setFormData(prev => ({ ...prev, bp: e.target.value }))} placeholder="120/80" />
                        </div>
                        <div className="form-group">
                          <Label className="form-label text-xs">Pulse (bpm)</Label>
                          <Input type="number" value={formData.pulse} onChange={(e) => setFormData(prev => ({ ...prev, pulse: e.target.value }))} placeholder="72" />
                        </div>
                        <div className="form-group">
                          <Label className="form-label text-xs">Temp (°F)</Label>
                          <Input value={formData.temperature} onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))} placeholder="98.6" />
                        </div>
                        <div className="form-group">
                          <Label className="form-label text-xs">SpO2 (%)</Label>
                          <Input type="number" value={formData.spo2} onChange={(e) => setFormData(prev => ({ ...prev, spo2: e.target.value }))} placeholder="98" />
                        </div>
                        <div className="form-group">
                          <Label className="form-label text-xs">Weight (kg)</Label>
                          <Input value={formData.weight} onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))} placeholder="70" />
                        </div>
                      </div>
                    </div>

                    {/* Diagnosis & Medicine */}
                    <div className="form-group">
                      <Label className="form-label">Diagnosis</Label>
                      <Input value={formData.diagnosis} onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))} placeholder="e.g., Viral fever" />
                    </div>

                    {/* Multi-medicine selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="form-label">Medicines Dispensed</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addMedicineRow} className="gap-1">
                          <Plus className="w-3 h-3" /> Add Medicine
                        </Button>
                      </div>
                      {selectedMedicines.map((row, index) => (
                        <div key={index} className="flex items-end gap-2">
                          <div className="flex-1 form-group">
                            {index === 0 && <Label className="form-label text-xs">Medicine</Label>}
                            <Select value={row.medicineId} onValueChange={(value) => updateMedicineRow(index, 'medicineId', value)}>
                              <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
                              <SelectContent>
                                {medicines.map(med => (
                                  <SelectItem key={med.id} value={med.id}>{med.name} ({med.quantity} {med.unit})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-20 form-group">
                            {index === 0 && <Label className="form-label text-xs">Qty</Label>}
                            <Input type="number" value={row.quantity} onChange={(e) => updateMedicineRow(index, 'quantity', e.target.value)} placeholder="1" />
                          </div>
                          {selectedMedicines.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeMedicineRow(index)} className="h-9 w-9 text-destructive">
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="form-group">
                      <Label className="form-label">Prescription Notes</Label>
                      <Textarea value={formData.prescription} onChange={(e) => setFormData(prev => ({ ...prev, prescription: e.target.value }))} placeholder="Enter prescription details..." rows={3} />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
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
                placeholder="Search by employee ID, name, or complaint..."
                className="pl-10"
              />
            </div>
            
            {/* Entry Type Filter */}
            <div className="flex items-center gap-2">
              <Button variant={entryFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setEntryFilter('all')}>
                All ({dateFilteredWalkIns.length})
              </Button>
              <Button variant={entryFilter === 'walkIns' ? 'default' : 'outline'} size="sm" onClick={() => setEntryFilter('walkIns')} className="gap-1">
                <Stethoscope className="w-4 h-4" /> Walk-ins ({walkInCount})
              </Button>
              <Button variant={entryFilter === 'emergencies' ? 'destructive' : 'outline'} size="sm" onClick={() => setEntryFilter('emergencies')} className="gap-1">
                <AlertTriangle className="w-4 h-4" /> Emergencies ({emergencyCount})
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
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Emp ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Complaint/Incident</TableHead>
                  <TableHead>Vitals & Diagnosis</TableHead>
                  <TableHead>Attended By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWalkIns.map((entry) => {
                  const isExpanded = expandedRows.has(entry.id);
                  return (
                    <>
                      <TableRow 
                        key={entry.id} 
                        className={`cursor-pointer ${entry.isEmergency ? 'bg-destructive/5' : ''} hover:bg-muted/50`}
                        onClick={() => toggleRow(entry.id)}
                      >
                        <TableCell className="px-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-primary">{getEmpId(entry.employeeId)}</TableCell>
                        <TableCell className="font-medium">{entry.employeeName}</TableCell>
                        <TableCell>
                          {entry.isEmergency ? (
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getSeverityColor(entry.severity)}`}>
                              {entry.severity}
                            </span>
                          ) : (
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              entry.consultationType === 'doctor' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'
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
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.isEmergency ? (
                            <span className="truncate max-w-[200px] inline-block">{entry.description}</span>
                          ) : (
                            <span className="text-xs">
                              {[
                                entry.vitals?.bp && `BP: ${entry.vitals.bp}`,
                                entry.vitals?.temperature && `T: ${entry.vitals.temperature}°`,
                                entry.vitals?.spo2 && `SpO2: ${entry.vitals.spo2}%`,
                              ].filter(Boolean).join(' | ')}
                              {entry.diagnosis && ` • ${entry.diagnosis}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{entry.doctorName || '-'}</TableCell>
                      </TableRow>
                      {/* Expanded detail row */}
                      {isExpanded && (
                        <TableRow key={`${entry.id}-detail`} className="bg-muted/30">
                          <TableCell colSpan={8} className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              {entry.isEmergency ? (
                                <>
                                  <div><span className="text-muted-foreground">Incident Type:</span> <span className="font-medium">{entry.incidentType}</span></div>
                                  <div><span className="text-muted-foreground">Severity:</span> <Badge className={`text-xs capitalize ${getSeverityColor(entry.severity)}`}>{entry.severity}</Badge></div>
                                  <div><span className="text-muted-foreground">Description:</span> <span>{entry.description}</span></div>
                                  {entry.actionTaken && <div><span className="text-muted-foreground">Action Taken:</span> <span>{entry.actionTaken}</span></div>}
                                  <div><span className="text-muted-foreground">Ambulance:</span> <span>{entry.ambulanceUsed ? `Yes - ${entry.ambulanceDetails || ''}` : 'No'}</span></div>
                                  {entry.escalatedTo && <div><span className="text-muted-foreground">Escalated To:</span> <span>{entry.escalatedTo}</span></div>}
                                  {entry.outcome && <div><span className="text-muted-foreground">Outcome:</span> <span>{entry.outcome}</span></div>}
                                  {entry.caseStatus && <div><span className="text-muted-foreground">Case Status:</span> <Badge variant="outline" className="text-xs capitalize">{entry.caseStatus.replace('_', ' ')}</Badge></div>}
                                  {entry.closureDate && <div><span className="text-muted-foreground">Closure Date:</span> <span>{new Date(entry.closureDate).toLocaleDateString()}</span></div>}
                                  {entry.closureRemarks && <div><span className="text-muted-foreground">Closure Remarks:</span> <span>{entry.closureRemarks}</span></div>}
                                </>
                              ) : (
                                <>
                                  <div><span className="text-muted-foreground">Consultation:</span> <span className="font-medium capitalize">{entry.consultationType}</span></div>
                                  <div><span className="text-muted-foreground">Chief Complaint:</span> <span className="font-medium">{entry.chiefComplaint}</span></div>
                                  {entry.diagnosis && <div><span className="text-muted-foreground">Diagnosis:</span> <span>{entry.diagnosis}</span></div>}
                                  {entry.vitals?.bp && <div><span className="text-muted-foreground">Blood Pressure:</span> <span>{entry.vitals.bp} mmHg</span></div>}
                                  {entry.vitals?.pulse && <div><span className="text-muted-foreground">Pulse:</span> <span>{entry.vitals.pulse} bpm</span></div>}
                                  {entry.vitals?.temperature && <div><span className="text-muted-foreground">Temperature:</span> <span>{entry.vitals.temperature}°F</span></div>}
                                  {entry.vitals?.spo2 && <div><span className="text-muted-foreground">SpO2:</span> <span>{entry.vitals.spo2}%</span></div>}
                                  {entry.vitals?.weight && <div><span className="text-muted-foreground">Weight:</span> <span>{entry.vitals.weight} kg</span></div>}
                                  {entry.medicinesDispensed && entry.medicinesDispensed.length > 0 && (
                                    <div className="col-span-2 md:col-span-3">
                                      <span className="text-muted-foreground">Medicines Dispensed:</span>{' '}
                                      {entry.medicinesDispensed.map((med, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs mr-1">{med.medicineName} x{med.quantity}</Badge>
                                      ))}
                                    </div>
                                  )}
                                  {entry.prescription && <div className="col-span-2 md:col-span-3"><span className="text-muted-foreground">Prescription:</span> <span>{entry.prescription}</span></div>}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                {filteredWalkIns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
