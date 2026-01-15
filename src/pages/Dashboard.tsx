import { 
  Users, 
  Stethoscope, 
  AlertTriangle, 
  Pill, 
  Package, 
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { getTodayStats, employees, walkIns, medicines, emergencies } = useData();
  const { location } = useAuth();
  
  const todayStats = getTodayStats(location?.id);
  
  const statCards = [
    { 
      label: "Today's Walk-ins", 
      value: todayStats.walkIns, 
      icon: Stethoscope, 
      color: 'bg-primary',
      trend: '+12% from yesterday'
    },
    { 
      label: 'Total Registrations', 
      value: employees.length, 
      icon: Users, 
      color: 'bg-info',
      trend: `${todayStats.registrations} new today`
    },
    { 
      label: 'Medicines Dispensed', 
      value: todayStats.medicinesDispensed, 
      icon: Pill, 
      color: 'bg-success',
      trend: 'Today'
    },
    { 
      label: 'Emergencies', 
      value: todayStats.emergencies, 
      icon: AlertTriangle, 
      color: 'bg-warning',
      trend: 'Today'
    },
  ];

  const lowStockMedicines = medicines.filter(m => m.quantity <= m.minStock);
  const recentWalkIns = walkIns.slice(-5).reverse();

  const exportToCSV = () => {
    const headers = ['Date', 'Employee', 'Type', 'Complaint', 'Doctor'];
    const data = walkIns.map(w => [
      new Date(w.createdAt).toLocaleDateString(),
      w.employeeName,
      w.consultationType,
      w.chiefComplaint,
      w.doctorName || '-'
    ]);
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of today's clinic activity</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Walk-ins */}
        <Card className="content-panel">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Walk-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentWalkIns.length > 0 ? (
              <div className="space-y-3">
                {recentWalkIns.map((walkIn) => (
                  <div 
                    key={walkIn.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{walkIn.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{walkIn.chiefComplaint}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        walkIn.consultationType === 'doctor' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-info/10 text-info'
                      }`}>
                        {walkIn.consultationType === 'doctor' ? 'Doctor' : 'Nurse'}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(walkIn.createdAt).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No walk-ins recorded today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card className="content-panel">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockMedicines.length > 0 ? (
              <div className="space-y-3">
                {lowStockMedicines.map((medicine) => (
                  <div 
                    key={medicine.id} 
                    className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground">{medicine.brand} • {medicine.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-warning">{medicine.quantity}</p>
                      <p className="text-xs text-muted-foreground">Min: {medicine.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>All medicines adequately stocked</p>
              </div>
            )}
          </CardContent>
        </Card>
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
              { label: 'Add Medicine', path: '/inventory', icon: Package },
              { label: 'Waste Log', path: '/biowaste', icon: Package },
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
