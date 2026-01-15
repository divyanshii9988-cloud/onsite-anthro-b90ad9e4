import { useState } from 'react';
import { Plus, Download, UserCheck, Calendar } from 'lucide-react';
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

export default function Specialist() {
  const { specialistConsultations, addSpecialistConsultation, employees } = useData();
  const { location } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [formData, setFormData] = useState({
    speciality: '',
    specialistName: '',
    hospitalName: '',
    appointmentDate: '',
    referralReason: '',
    notes: '',
  });

  const selectedEmp = employees.find(e => e.id === selectedEmployee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !formData.speciality || !formData.specialistName || !formData.appointmentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    addSpecialistConsultation({
      employeeId: selectedEmployee,
      employeeName: selectedEmp?.name || '',
      speciality: formData.speciality,
      specialistName: formData.specialistName,
      hospitalName: formData.hospitalName || undefined,
      appointmentDate: new Date(formData.appointmentDate),
      referralReason: formData.referralReason,
      status: 'scheduled',
      notes: formData.notes || undefined,
      locationId: location?.id || '',
    });

    toast.success('Specialist consultation scheduled successfully!');
    setIsDialogOpen(false);
    setSelectedEmployee('');
    setFormData({
      speciality: '', specialistName: '', hospitalName: '',
      appointmentDate: '', referralReason: '', notes: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Employee', 'Speciality', 'Specialist', 'Hospital', 'Reason', 'Status'];
    const data = specialistConsultations.map(c => [
      new Date(c.appointmentDate).toLocaleDateString(),
      c.employeeName,
      c.speciality,
      c.specialistName,
      c.hospitalName || '-',
      c.referralReason,
      c.status
    ]);
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specialist-consultations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const specialities = [
    'Cardiology', 'Dermatology', 'ENT', 'Gastroenterology',
    'Neurology', 'Ophthalmology', 'Orthopedics', 'Psychiatry',
    'Pulmonology', 'Urology', 'Gynecology', 'Other'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success';
      case 'scheduled': return 'bg-info/10 text-info';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Specialist Consultation</h1>
          <p className="text-muted-foreground">Track specialist referrals and appointments</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Schedule Consultation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule Specialist Consultation
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="form-group">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <Label className="form-label">Speciality *</Label>
                    <Select 
                      value={formData.speciality} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, speciality: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialities.map(spec => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="form-group">
                    <Label className="form-label">Appointment Date *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <Label className="form-label">Specialist Name *</Label>
                    <Input
                      value={formData.specialistName}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialistName: e.target.value }))}
                      placeholder="Dr. Name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <Label className="form-label">Hospital / Clinic</Label>
                    <Input
                      value={formData.hospitalName}
                      onChange={(e) => setFormData(prev => ({ ...prev, hospitalName: e.target.value }))}
                      placeholder="Hospital name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <Label className="form-label">Referral Reason</Label>
                  <Textarea
                    value={formData.referralReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, referralReason: e.target.value }))}
                    placeholder="Reason for specialist referral..."
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <Label className="form-label">Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Schedule</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Consultations Table */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Scheduled Consultations ({specialistConsultations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {specialistConsultations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Speciality</TableHead>
                    <TableHead>Specialist</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialistConsultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(consultation.appointmentDate).toLocaleDateString()}
                        <br />
                        <span className="text-xs">
                          {new Date(consultation.appointmentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{consultation.employeeName}</TableCell>
                      <TableCell>{consultation.speciality}</TableCell>
                      <TableCell>{consultation.specialistName}</TableCell>
                      <TableCell>{consultation.hospitalName || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{consultation.referralReason || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(consultation.status)}`}>
                          {consultation.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No specialist consultations scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
