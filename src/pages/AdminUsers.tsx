import { useState } from 'react';
import { Plus, Search, Eye, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'nurse';
  isSuperAdmin: boolean;
  createdAt: Date;
}

// Mock data for admin users
const initialAdminUsers: AdminUser[] = [
  { id: '1', name: 'Dr. Priya Sharma', email: 'priya.sharma@truworthwellness.com', role: 'doctor', isSuperAdmin: true, createdAt: new Date('2026-01-16') },
  { id: '2', name: 'Sakshi Mittal', email: 'sakshi.mittal@truworthwellness.com', role: 'nurse', isSuperAdmin: false, createdAt: new Date('2025-12-05') },
  { id: '3', name: 'Kshitij Ganare', email: 'kshitij.ganare@truworthwellness.com', role: 'admin', isSuperAdmin: false, createdAt: new Date('2025-11-19') },
  { id: '4', name: 'Saumya Lohan', email: 'saumya.lohani@truworthwellness.com', role: 'nurse', isSuperAdmin: false, createdAt: new Date('2025-11-15') },
  { id: '5', name: 'Devendra Singh', email: 'devendra.s@truworthwellness.com', role: 'admin', isSuperAdmin: true, createdAt: new Date('2025-11-04') },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '' as 'admin' | 'doctor' | 'nurse' | '',
  });

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newUser: AdminUser = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isSuperAdmin: false,
      createdAt: new Date(),
    };

    setUsers(prev => [newUser, ...prev]);
    toast.success('Admin user created successfully!');
    setIsDialogOpen(false);
    setFormData({ name: '', email: '', role: '' });
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-muted text-foreground';
      case 'doctor': return 'bg-primary/10 text-primary';
      case 'nurse': return 'bg-info/10 text-info';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Admin Users</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Admin User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                  <Label className="form-label">Email ID *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@truworthwellness.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <Label className="form-label">Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: 'admin' | 'doctor' | 'nurse') => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create User</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="content-panel">
        <CardContent className="pt-6">
          <div className="flex gap-3 max-w-md">
            <div className="flex-1 relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Email-Id"
                className="pr-10"
              />
            </div>
            <Button variant="default" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="content-panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Admin Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.email}
                        {user.isSuperAdmin && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            Super Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium uppercase ${getRoleBadgeColor(user.role)}`}>
                        {user.role === 'nurse' ? 'EXECUTIVE' : user.role.toUpperCase()}
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
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="View">
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
        </CardContent>
      </Card>
    </div>
  );
}
