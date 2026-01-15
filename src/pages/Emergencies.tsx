import { useState } from 'react';
import { Plus, Download, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Emergencies() {
  const { emergencies, addEmergency, employees } = useData();
  const { location } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [formData, setFormData] = useState({
    incidentType: '',
    severity: 'moderate' as 'minor' | 'moderate' | 'critical',
    description: '',
    actionTaken: '',
    ambulanceUsed: false,
    ambulanceDetails: '',
    escalatedTo: '',
    outcome: '',
  });

  const selectedEmp = employees.find(e => e.id === selectedEmployee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !formData.incidentType || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    addEmergency({
      employeeId: selectedEmployee,
      employeeName: selectedEmp?.name || '',
      incidentType: formData.incidentType,
      severity: formData.severity,
      description: formData.description,
      actionTaken: formData.actionTaken,
      ambulanceUsed: formData.ambulanceUsed,
      ambulanceDetails: formData.ambulanceDetails || undefined,
      escalatedTo: formData.escalatedTo || undefined,
      outcome: formData.outcome,
      locationId: location?.id || '',
    });

    toast.success('Emergency incident logged successfully!');
    setIsDialogOpen(false);
    setSelectedEmployee('');
    setFormData({
      incidentType: '', severity: 'moderate', description: '',
      actionTaken: '', ambulanceUsed: false, ambulanceDetails: '',
      escalatedTo: '', outcome: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Employee', 'Type', 'Severity', 'Description', 'Action Taken', 'Ambulance', 'Outcome'];
    const data = emergencies.map(e => [
      new Date(e.createdAt).toLocaleDateString(),
      new Date(e.createdAt).toLocaleTimeString(),
      e.employeeName,
      e.incidentType,
      e.severity,
      e.description,
      e.actionTaken,
      e.ambulanceUsed ? 'Yes' : 'No',
      e.outcome
    ]);
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergencies-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const incidentTypes = [
    'Cardiac Emergency',
    'Breathing Difficulty',
    'Fainting/Unconsciousness',
    'Seizure',
    'Severe Allergic Reaction',
    'Workplace Injury',
    'Fall',
    'Burn',
    'Electric Shock',
    'Food Poisoning',
    'Other'
  ];

  const getSeverityColor = (severity: string) => {
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
          <h1 className="text-2xl font-bold text-foreground">Medical Emergencies</h1>
          <p className="text-muted-foreground">Log and track emergency incidents</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                Log Emergency
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Log Emergency Incident
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group col-span-2">
                    <Label className="form-label">Employee *</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} ({emp.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-group">
                    <Label className="form-label">Incident Type *</Label>
                    <Select 
                      value={formData.incidentType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, incidentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-group">
                    <Label className="form-label">Severity *</Label>
                    <Select 
                      value={formData.severity} 
                      onValueChange={(value: 'minor' | 'moderate' | 'critical') => setFormData(prev => ({ ...prev, severity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what happened..."
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <Label className="form-label">Action Taken</Label>
                  <Textarea
                    value={formData.actionTaken}
                    onChange={(e) => setFormData(prev => ({ ...prev, actionTaken: e.target.value }))}
                    placeholder="Describe the immediate actions taken..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="ambulance"
                    checked={formData.ambulanceUsed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ambulanceUsed: !!checked }))}
                  />
                  <Label htmlFor="ambulance" className="text-sm">Ambulance was used</Label>
                </div>

                {formData.ambulanceUsed && (
                  <div className="form-group">
                    <Label className="form-label">Ambulance Details</Label>
                    <Input
                      value={formData.ambulanceDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, ambulanceDetails: e.target.value }))}
                      placeholder="Vehicle number, destination hospital..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <Label className="form-label">Escalated To</Label>
                    <Input
                      value={formData.escalatedTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, escalatedTo: e.target.value }))}
                      placeholder="e.g., HR Manager, Safety Officer"
                    />
                  </div>
                  <div className="form-group">
                    <Label className="form-label">Outcome</Label>
                    <Input
                      value={formData.outcome}
                      onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                      placeholder="e.g., Treated and discharged"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive">Log Emergency</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Emergencies Table */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Emergency Log ({emergencies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencies.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Ambulance</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emergencies.map((emergency) => (
                    <TableRow key={emergency.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(emergency.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs">
                          {new Date(emergency.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{emergency.employeeName}</TableCell>
                      <TableCell>{emergency.incidentType}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getSeverityColor(emergency.severity)}`}>
                          {emergency.severity}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{emergency.description}</TableCell>
                      <TableCell>{emergency.ambulanceUsed ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{emergency.outcome || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No emergencies logged</p>
              <p className="text-sm">That's a good thing!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
