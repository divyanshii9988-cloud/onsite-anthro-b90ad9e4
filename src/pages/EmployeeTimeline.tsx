import { useState, useMemo } from 'react';
import { Search, Clock, AlertTriangle, Pill, Stethoscope, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';

export default function EmployeeTimeline() {
  const { employees, walkIns } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  const matchingEmployees = searchQuery.length >= 2
    ? employees.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  // Build timeline for selected employee
  const timeline = useMemo(() => {
    if (!selectedEmpId) return [];
    const visits = walkIns
      .filter(w => w.employeeId === selectedEmpId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Flag repeat visits within 7 days
    return visits.map((visit, idx) => {
      const visitDate = new Date(visit.createdAt);
      const isRepeat = visits.some((other, otherIdx) => {
        if (otherIdx === idx) return false;
        const otherDate = new Date(other.createdAt);
        const diff = Math.abs(visitDate.getTime() - otherDate.getTime());
        return diff <= 7 * 24 * 60 * 60 * 1000 && otherDate < visitDate;
      });
      return { ...visit, isRepeatVisit: isRepeat };
    });
  }, [selectedEmpId, walkIns]);

  const hasEmergencies = timeline.some(v => v.isEmergency);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee Medical Timeline</h1>
        <p className="text-muted-foreground">View chronological history of all clinic visits</p>
      </div>

      {/* Search */}
      <Card className="content-panel">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedEmpId) setSelectedEmpId(null);
              }}
              placeholder="Search by employee name or ID..."
              className="pl-10"
            />
            {matchingEmployees.length > 0 && !selectedEmpId && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {matchingEmployees.map(emp => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      setSelectedEmpId(emp.id);
                      setSearchQuery(emp.name);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">{emp.name}</span>
                    <span className="text-muted-foreground ml-2">({emp.employeeId})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Profile Summary */}
      {selectedEmp && (
        <Card className="content-panel">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {selectedEmp.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{selectedEmp.name}</h2>
                  <Badge variant="outline" className="text-xs">{selectedEmp.employeeId}</Badge>
                  {hasEmergencies && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="w-3 h-3" /> Past Emergency
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedEmp.department} • {selectedEmp.designation} • {selectedEmp.bloodGroup}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{timeline.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {selectedEmpId && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {timeline.length === 0 ? (
            <Card className="ml-12">
              <CardContent className="py-8 text-center text-muted-foreground">
                No clinic visits recorded for this employee
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {timeline.map((visit) => (
                <div key={visit.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    visit.isEmergency
                      ? 'bg-destructive/10 border-2 border-destructive'
                      : 'bg-primary/10 border-2 border-primary'
                  }`}>
                    {visit.isEmergency ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Stethoscope className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  {/* Visit card */}
                  <Card className={`flex-1 ${visit.isEmergency ? 'border-destructive/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(visit.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' '}
                            {new Date(visit.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {visit.isEmergency && (
                            <Badge variant="destructive" className="text-xs">Emergency</Badge>
                          )}
                          {visit.isRepeatVisit && (
                            <Badge variant="outline" className="text-xs gap-1 border-warning text-warning">
                              <RefreshCw className="w-3 h-3" /> Repeat Visit (within 7 days)
                            </Badge>
                          )}
                          {visit.severity && (
                            <Badge className={`text-xs capitalize ${
                              visit.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                              visit.severity === 'moderate' ? 'bg-warning/10 text-warning' :
                              'bg-success/10 text-success'
                            }`}>
                              {visit.severity}
                            </Badge>
                          )}
                        </div>
                        {visit.doctorName && (
                          <span className="text-xs text-muted-foreground">By: {visit.doctorName}</span>
                        )}
                      </div>

                      {/* Chief Complaint */}
                      <h4 className="font-medium text-foreground mb-1">
                        {visit.isEmergency ? visit.incidentType : visit.chiefComplaint}
                      </h4>

                      {/* Diagnosis */}
                      {(visit.diagnosis || visit.description) && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {visit.isEmergency ? visit.description : `Diagnosis: ${visit.diagnosis}`}
                        </p>
                      )}

                      {/* Vitals (compact) */}
                      {visit.vitals && (visit.vitals.bp || visit.vitals.temperature || visit.vitals.spo2) && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          {visit.vitals.bp && <span>BP: {visit.vitals.bp}</span>}
                          {visit.vitals.temperature && <span>T: {visit.vitals.temperature}°F</span>}
                          {visit.vitals.spo2 && <span>SpO2: {visit.vitals.spo2}%</span>}
                          {visit.vitals.pulse && <span>Pulse: {visit.vitals.pulse}</span>}
                        </div>
                      )}

                      {/* Medicines */}
                      {visit.medicinesDispensed && visit.medicinesDispensed.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Pill className="w-3 h-3 text-primary" />
                          {visit.medicinesDispensed.map((med, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {med.medicineName} x{med.quantity}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Emergency extras */}
                      {visit.isEmergency && visit.actionTaken && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>Action:</strong> {visit.actionTaken}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedEmpId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Search for an employee to view their medical timeline
          </CardContent>
        </Card>
      )}
    </div>
  );
}
