import { useState } from 'react';
import { 
  Users, 
  Stethoscope, 
  AlertTriangle, 
  Pill, 
  TrendingUp,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { DateRangeFilter, DateRange, getDefaultDateRange, filterByDateRange } from '@/components/DateRangeFilter';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const { employees, walkIns, emergencies } = useData();
  const { location } = useAuth();
  
  // Filter data by date range
  const filteredWalkIns = filterByDateRange(walkIns, dateRange, 'createdAt');
  const filteredEmergencies = filterByDateRange(emergencies, dateRange, 'createdAt');
  const filteredEmployees = filterByDateRange(employees, dateRange, 'registeredAt');

  // Calculate medicines dispensed
  const medicinesDispensed = filteredWalkIns.reduce((acc, w) => {
    return acc + (w.medicinesDispensed?.reduce((sum, m) => sum + m.quantity, 0) || 0);
  }, 0);
  
  const statCards = [
    { 
      label: "Walk-ins", 
      value: filteredWalkIns.length, 
      icon: Stethoscope, 
      color: 'bg-primary',
      trend: dateRange.label
    },
    { 
      label: 'Total Registrations', 
      value: employees.length, 
      icon: Users, 
      color: 'bg-info',
      trend: `${filteredEmployees.length} in period`
    },
    { 
      label: 'Medicines Dispensed', 
      value: medicinesDispensed, 
      icon: Pill, 
      color: 'bg-success',
      trend: dateRange.label
    },
    { 
      label: 'Emergencies', 
      value: filteredEmergencies.length, 
      icon: AlertTriangle, 
      color: 'bg-warning',
      trend: dateRange.label
    },
  ];

  const exportToCSV = () => {
    const escapeCSV = (value: string | number | undefined) => {
      if (value === undefined || value === null) return '-';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines: string[] = [];
    
    // Report Header
    lines.push(`CLINIC DASHBOARD REPORT`);
    lines.push(`Date Range: ${dateRange.label}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');
    
    // Summary Section
    lines.push('=== SUMMARY ===');
    lines.push(`Total Walk-ins,${filteredWalkIns.length}`);
    lines.push(`Total Registrations,${employees.length} (${filteredEmployees.length} in period)`);
    lines.push(`Medicines Dispensed,${medicinesDispensed}`);
    lines.push(`Emergencies,${filteredEmergencies.length}`);
    lines.push('');
    
    // Walk-ins Section
    lines.push('=== WALK-INS ===');
    lines.push('Date,Employee ID,Employee Name,Consultation Type,Chief Complaint,Diagnosis,Doctor,BP,Pulse,Temperature,SpO2');
    filteredWalkIns.forEach(w => {
      lines.push([
        escapeCSV(new Date(w.createdAt).toLocaleDateString()),
        escapeCSV(w.employeeId),
        escapeCSV(w.employeeName),
        escapeCSV(w.consultationType),
        escapeCSV(w.chiefComplaint),
        escapeCSV(w.diagnosis),
        escapeCSV(w.doctorName),
        escapeCSV(w.vitals?.bp),
        escapeCSV(w.vitals?.pulse),
        escapeCSV(w.vitals?.temperature),
        escapeCSV(w.vitals?.spo2)
      ].join(','));
    });
    lines.push('');
    
    // Registrations Section
    lines.push('=== EMPLOYEE REGISTRATIONS ===');
    lines.push('Registration Date,Employee ID,Name,Email,Mobile,Department,Designation,Age,Gender,Blood Group');
    filteredEmployees.forEach(e => {
      lines.push([
        escapeCSV(new Date(e.registeredAt).toLocaleDateString()),
        escapeCSV(e.employeeId),
        escapeCSV(e.name),
        escapeCSV(e.email),
        escapeCSV(e.mobile),
        escapeCSV(e.department),
        escapeCSV(e.designation),
        escapeCSV(e.age),
        escapeCSV(e.gender),
        escapeCSV(e.bloodGroup)
      ].join(','));
    });
    lines.push('');
    
    // Medicines Dispensed Section
    lines.push('=== MEDICINES DISPENSED ===');
    lines.push('Date,Employee Name,Medicine Name,Quantity,Dosage');
    filteredWalkIns.forEach(w => {
      w.medicinesDispensed?.forEach(m => {
        lines.push([
          escapeCSV(new Date(w.createdAt).toLocaleDateString()),
          escapeCSV(w.employeeName),
          escapeCSV(m.medicineName),
          escapeCSV(m.quantity),
          escapeCSV(m.dosage)
        ].join(','));
      });
    });
    lines.push('');
    
    // Emergencies Section
    lines.push('=== EMERGENCIES ===');
    lines.push('Date,Employee ID,Employee Name,Incident Type,Severity,Description,Action Taken,Ambulance Used,Outcome');
    filteredEmergencies.forEach(e => {
      lines.push([
        escapeCSV(new Date(e.createdAt).toLocaleDateString()),
        escapeCSV(e.employeeId),
        escapeCSV(e.employeeName),
        escapeCSV(e.incidentType),
        escapeCSV(e.severity),
        escapeCSV(e.description),
        escapeCSV(e.actionTaken),
        escapeCSV(e.ambulanceUsed ? 'Yes' : 'No'),
        escapeCSV(e.outcome)
      ].join(','));
    });
    
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-report-${dateRange.label.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of clinic activity for {dateRange.label.toLowerCase()}</p>
        </div>
        <div className="flex gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="stat-card overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'New Walk-in', path: '/walk-ins', icon: Stethoscope },
              { label: 'Register Employee', path: '/employees', icon: Users },
              { label: 'Log Emergency', path: '/emergencies', icon: AlertTriangle },
              { label: 'Add Medicine', path: '/inventory', icon: Pill },
              { label: 'Waste Log', path: '/biowaste', icon: Pill },
              { label: 'Prescription', path: '/prescriptions', icon: Pill },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.path}
                  href={action.path}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors text-center group"
                >
                  <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">{action.label}</span>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
