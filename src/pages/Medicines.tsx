import { useState } from 'react';
import { Plus, Download, Search, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { hasPermission } from '@/lib/permissions';

export default function Medicines() {
  const { walkIns, employees, medicines, dispenseMedicine } = useData();
  const { selectedCorporate, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Get all dispensed medicines from walk-ins
  const dispensedMedicines = walkIns.flatMap(w => 
    (w.medicinesDispensed || []).map(med => ({
      ...med,
      walkInId: w.id,
      employeeName: w.employeeName,
      date: w.createdAt,
      doctorName: w.doctorName
    }))
  );

  const filteredDispensed = dispensedMedicines.filter(m => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return m.medicineName.toLowerCase().includes(lowerQuery) || 
             m.employeeName.toLowerCase().includes(lowerQuery);
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Patient', 'Medicine', 'Quantity', 'Dosage', 'Prescribed By'];
    const data = dispensedMedicines.map(m => [
      new Date(m.date).toLocaleDateString(),
      m.employeeName,
      m.medicineName,
      m.quantity.toString(),
      m.dosage || '-',
      m.doctorName || '-'
    ]);
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicines-dispensed-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate stats
  const totalDispensed = dispensedMedicines.reduce((acc, m) => acc + m.quantity, 0);
  const uniquePatients = new Set(dispensedMedicines.map(m => m.employeeName)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medicine Dispensation</h1>
          <p className="text-muted-foreground">Track medicines dispensed during consultations</p>
        </div>
        {hasPermission(user?.role, 'download_mis') && (
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Dispensed</p>
                <p className="text-3xl font-bold text-foreground">{totalDispensed}</p>
              </div>
              <div className="bg-primary p-3 rounded-xl">
                <Pill className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Patients</p>
                <p className="text-3xl font-bold text-foreground">{uniquePatients}</p>
              </div>
              <div className="bg-info p-3 rounded-xl">
                <Pill className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medicine Types</p>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(dispensedMedicines.map(m => m.medicineId)).size}
                </p>
              </div>
              <div className="bg-success p-3 rounded-xl">
                <Pill className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="content-panel">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by medicine or patient name..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dispensation Log */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Dispensation Log ({filteredDispensed.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDispensed.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Prescribed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDispensed.map((med, index) => (
                    <TableRow key={`${med.walkInId}-${index}`}>
                      <TableCell className="text-muted-foreground">
                        {new Date(med.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{med.employeeName}</TableCell>
                      <TableCell>{med.medicineName}</TableCell>
                      <TableCell>{med.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{med.dosage || '-'}</TableCell>
                      <TableCell>{med.doctorName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No medicines dispensed yet</p>
              <p className="text-sm">Medicines are recorded during walk-in consultations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
