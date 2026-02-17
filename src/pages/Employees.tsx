import { useState } from 'react';
import { Search, UserPlus, Download } from 'lucide-react';
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
import { DateRangeFilter, DateRange, getDefaultDateRange, filterByDateRange } from '@/components/DateRangeFilter';
import { hasPermission } from '@/lib/permissions';

export default function Employees() {
  const { employees, addEmployee, searchEmployees } = useData();
  const { user } = useAuth();
  const canDownloadMIS = hasPermission(user?.role, 'download_mis');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    mobile: '',
    companyName: '',
    department: '',
    designation: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    bloodGroup: '',
  });

  // First filter by date range, then by search query
  const dateFilteredEmployees = filterByDateRange(employees, dateRange, 'registeredAt');
  const filteredEmployees = searchQuery ? dateFilteredEmployees.filter(emp => 
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.mobile.includes(searchQuery)
  ) : dateFilteredEmployees;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.name || !formData.email || !formData.mobile || !formData.companyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    addEmployee({
      employeeId: formData.employeeId,
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      companyName: formData.companyName,
      department: formData.department || undefined,
      designation: formData.designation || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender || undefined,
      bloodGroup: formData.bloodGroup || undefined,
    });

    toast.success('Employee registered successfully!');
    setIsDialogOpen(false);
    setFormData({
      employeeId: '', name: '', email: '', mobile: '', companyName: '',
      department: '', designation: '', age: '', gender: '', bloodGroup: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Company', 'Email', 'Mobile', 'Department', 'Designation', 'Age', 'Gender', 'Blood Group', 'Registered At'];
    const data = filteredEmployees.map(emp => [
      emp.employeeId,
      emp.name,
      emp.companyName || '-',
      emp.email,
      emp.mobile,
      emp.department || '-',
      emp.designation || '-',
      emp.age?.toString() || '-',
      emp.gender || '-',
      emp.bloodGroup || '-',
      new Date(emp.registeredAt).toLocaleDateString()
    ]);
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${dateRange.label.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Registration</h1>
          <p className="text-muted-foreground">Register and search corporate employees</p>
        </div>
        <div className="flex gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          {canDownloadMIS && (
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                New Registration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 pt-4">
                <div className="form-group">
                  <Label className="form-label">Employee ID *</Label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="e.g., INF001"
                    required
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Company Name *</Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g., Infosys Ltd"
                    required
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Email ID *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@company.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Mobile Number *</Label>
                  <Input
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Designation</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="e.g., Senior Developer"
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Age in years"
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value: 'male' | 'female' | 'other') => setFormData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label className="form-label">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodGroup: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Register Employee</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Bar - No Filter Button */}
      <Card className="content-panel">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Employee ID, Name, Email or Mobile..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            Registered Employees ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.companyName || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                    <TableCell>{employee.mobile}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(employee.registeredAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No employees found matching your search' : 'No employees registered in this period'}
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
