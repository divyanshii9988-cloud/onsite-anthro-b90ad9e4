import { useState } from 'react';
import { Plus, Search, Eye, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE';
  isSuperAdmin: boolean;
  createdAt: Date;
}

// Mock data for admin users
const initialAdminUsers: AdminUser[] = [
  { id: '1', firstName: 'Divyanshi', lastName: 'Sharma', email: 'divyanshi.sharma@truworthwellness.com', mobile: '8890607809', role: 'ADMIN', isSuperAdmin: true, createdAt: new Date('2026-01-16T12:26:00') },
  { id: '2', firstName: 'Sakshi', lastName: 'Mittal', email: 'sakshi.mittal@truworthwellness.com', mobile: '9876543210', role: 'NURSE', isSuperAdmin: false, createdAt: new Date('2025-12-05T14:46:00') },
  { id: '3', firstName: 'Kshitij', lastName: 'Ganare', email: 'kshitij.ganare@truworthwellness.com', mobile: '9123456789', role: 'ADMIN', isSuperAdmin: false, createdAt: new Date('2025-11-19T17:56:00') },
  { id: '4', firstName: 'Saumya', lastName: 'Lohan', email: 'saumya.lohani@truworthwellness.com', mobile: '9988776655', role: 'NURSE', isSuperAdmin: false, createdAt: new Date('2025-11-18T17:16:00') },
  { id: '5', firstName: 'Devendra', lastName: 'Singh', email: 'devendra.s@truworthwellness.com', mobile: '8877665544', role: 'ADMIN', isSuperAdmin: true, createdAt: new Date('2025-11-04T15:42:00') },
  { id: '6', firstName: 'Vishakha', lastName: 'Maheshwari', email: 'vishakha.maheshwari@truworthwellness.com', mobile: '7766554433', role: 'NURSE', isSuperAdmin: false, createdAt: new Date('2025-10-06T16:42:00') },
  { id: '7', firstName: 'Tarun', lastName: 'Kumar', email: 'jaishree.kaushal@truworthwellness.com', mobile: '6655443322', role: 'ADMIN', isSuperAdmin: false, createdAt: new Date('2025-09-23T13:05:00') },
  { id: '8', firstName: 'Khushboo', lastName: 'Goyal', email: 'khushboo.goyal@truworthwellness.com', mobile: '5544332211', role: 'ADMIN', isSuperAdmin: false, createdAt: new Date('2025-09-11T17:44:00') },
  { id: '9', firstName: 'Shubham', lastName: 'Singh', email: 'shubham.singh@truworthwellness.com', mobile: '4433221100', role: 'ADMIN', isSuperAdmin: false, createdAt: new Date('2025-08-12T12:30:00') },
];

type ViewMode = 'list' | 'create' | 'edit';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    role: '' as 'ADMIN' | 'DOCTOR' | 'NURSE' | '',
    isSuperAdmin: false,
  });

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      role: '',
      isSuperAdmin: false,
    });
  };

  const handleCreate = () => {
    resetForm();
    setViewMode('create');
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    });
    setViewMode('edit');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedUser(null);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (viewMode === 'create') {
      const newUser: AdminUser = {
        id: Date.now().toString(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role as 'ADMIN' | 'DOCTOR' | 'NURSE',
        isSuperAdmin: formData.isSuperAdmin,
        createdAt: new Date(),
      };
      setUsers(prev => [newUser, ...prev]);
      toast.success('Admin user created successfully!');
    } else if (viewMode === 'edit' && selectedUser) {
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...formData, role: formData.role as 'ADMIN' | 'DOCTOR' | 'NURSE' }
          : u
      ));
      toast.success('User updated successfully!');
    }

    handleBack();
  };

  const handleDelete = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.isSuperAdmin) {
      toast.error('Cannot delete a Super Admin user');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success('User deleted successfully');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    if (role === 'NURSE') return 'EXECUTIVE';
    return role;
  };

  // List View
  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">All Admin Users</h1>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Email-Id"
                className="w-64"
              />
              <Button variant="default" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              Create Admin User
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16 font-semibold">S.No</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{user.email}</span>
                      {user.isSuperAdmin && (
                        <Badge variant="outline" className="text-xs border-primary text-primary bg-primary/5">
                          Super Admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-muted-foreground">
                      {getRoleDisplay(user.role)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    })} at {new Date(user.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="View/Edit"
                        onClick={() => handleEdit(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Delete"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.isSuperAdmin}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Create / Edit Form View
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {viewMode === 'create' ? 'Create User Account' : 'Edit User Account'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {/* First Name */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">First Name :</Label>
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter first name"
              className="flex-1"
            />
          </div>

          {/* Last Name */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">Last Name :</Label>
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter last name"
              className="flex-1"
            />
          </div>

          {/* Email ID */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">Email ID :</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@truworthwellness.com"
              className="flex-1"
              disabled={viewMode === 'edit'}
            />
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">Mobile :</Label>
            <Input
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              placeholder="Enter mobile number"
              className="flex-1"
            />
          </div>

          {/* User Type */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">
              <span className="text-destructive">*</span> User Type :
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: 'ADMIN' | 'DOCTOR' | 'NURSE') => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                <SelectItem value="NURSE">NURSE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2FA Required placeholder */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">2FA Required :</Label>
            <Switch disabled />
          </div>

          {/* Is Super Admin */}
          <div className="flex items-center gap-4 col-span-1 md:col-span-2">
            <Label className="w-32 text-right text-muted-foreground shrink-0"></Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="superAdmin"
                checked={formData.isSuperAdmin}
                onChange={(e) => setFormData(prev => ({ ...prev, isSuperAdmin: e.target.checked }))}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="superAdmin" className="text-sm cursor-pointer">Is Super Admin</Label>
            </div>
          </div>

          {/* User Image */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">User Image :</Label>
            <Avatar className="w-16 h-16 bg-muted">
              <AvatarFallback className="text-lg font-medium">
                {formData.firstName && formData.lastName 
                  ? getInitials(formData.firstName, formData.lastName)
                  : 'NA'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Login Type placeholder */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">User Login Type :</Label>
            <Select defaultValue="password" disabled>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="password">Password</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button type="submit">
            {viewMode === 'create' ? 'Create' : 'Update'}
          </Button>
          <Button type="button" variant="outline" onClick={handleBack}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
