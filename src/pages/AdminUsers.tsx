import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, ArrowLeft, Building2, MapPin, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { supabase } from '@/integrations/supabase/client';

type ViewMode = 'list' | 'create' | 'edit';

interface SupaCorporate {
  id: string;
  name: string;
  is_active: boolean | null;
}

interface SupaLocation {
  id: string;
  corporate_id: string | null;
  location_name: string;
}

export default function AdminUsers() {
  const { adminUsers, addAdminUser, updateAdminUser, deleteAdminUser, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Supabase corporates & locations
  const [supaCorporates, setSupaCorporates] = useState<SupaCorporate[]>([]);
  const [supaLocations, setSupaLocations] = useState<SupaLocation[]>([]);
  const [selectedCorporateId, setSelectedCorporateId] = useState<string>('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    mobile: '', role: '' as 'ADMIN' | 'DOCTOR' | 'NURSE' | '',
    isSuperAdmin: false, assignedCorporates: [] as string[], location: '',
  });

  useEffect(() => {
    const fetchCorps = async () => {
      const { data } = await supabase.from('corporates').select('id, name, is_active').eq('is_active', true).order('name');
      if (data) setSupaCorporates(data);
    };
    fetchCorps();
  }, []);

  // Fetch locations when a corporate is selected for assignment
  useEffect(() => {
    if (!selectedCorporateId) {
      setSupaLocations([]);
      return;
    }
    const fetchLocs = async () => {
      const { data } = await supabase
        .from('corporate_locations')
        .select('id, corporate_id, location_name')
        .eq('corporate_id', selectedCorporateId)
        .eq('is_active', true)
        .order('location_name');
      if (data) setSupaLocations(data);
    };
    fetchLocs();
  }, [selectedCorporateId]);

  if (!hasPermission(user?.role, 'create_users')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to manage users.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = adminUsers.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', password: '',
      mobile: '', role: '', isSuperAdmin: false, assignedCorporates: [], location: '',
    });
    setSelectedCorporateId('');
  };

  const handleCreate = () => { resetForm(); setViewMode('create'); };

  const handleEdit = (userId: string) => {
    const user = adminUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setFormData({
        firstName: user.firstName, lastName: user.lastName,
        email: user.email, password: '', mobile: user.mobile,
        role: user.role, isSuperAdmin: user.isSuperAdmin,
        assignedCorporates: user.assignedCorporates,
        location: user.location || '',
      });
      setViewMode('edit');
    }
  };

  const handleBack = () => { setViewMode('list'); setSelectedUserId(null); resetForm(); };

  const handleCorporateToggle = (corporateId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedCorporates: prev.assignedCorporates.includes(corporateId)
        ? prev.assignedCorporates.filter(id => id !== corporateId)
        : [...prev.assignedCorporates, corporateId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields'); return;
    }
    if (viewMode === 'create' && !formData.password) {
      toast.error('Password is required for new users'); return;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (formData.role !== 'ADMIN' && formData.assignedCorporates.length === 0) {
      toast.error('Please assign at least one corporate for non-admin users'); return;
    }
    if (formData.role !== 'ADMIN' && !formData.location) {
      toast.error('Please select a location for this user'); return;
    }

    setIsSaving(true);
    try {
      if (viewMode === 'create') {
        await addAdminUser({
          firstName: formData.firstName, lastName: formData.lastName,
          email: formData.email, password: formData.password,
          mobile: formData.mobile,
          role: formData.role as 'ADMIN' | 'DOCTOR' | 'NURSE',
          isSuperAdmin: formData.isSuperAdmin,
          assignedCorporates: formData.role === 'ADMIN' ? [] : formData.assignedCorporates,
          location: formData.role === 'ADMIN' ? '' : formData.location,
        });
        toast.success('User created successfully!');
      } else if (viewMode === 'edit' && selectedUserId) {
        await updateAdminUser(selectedUserId, {
          firstName: formData.firstName, lastName: formData.lastName,
          mobile: formData.mobile,
          role: formData.role as 'ADMIN' | 'DOCTOR' | 'NURSE',
          isSuperAdmin: formData.isSuperAdmin,
          assignedCorporates: formData.role === 'ADMIN' ? [] : formData.assignedCorporates,
          location: formData.role === 'ADMIN' ? '' : formData.location,
        });
        toast.success('User updated successfully!');
      }
      handleBack();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save user';
      if (msg.includes('email-already-in-use')) {
        toast.error('This email is already registered');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    const user = adminUsers.find(u => u.id === userId);
    if (user?.isSuperAdmin) { toast.error('Cannot delete a Super Admin user'); return; }
    try {
      await deleteAdminUser(userId);
      toast.success('User deleted successfully');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const getInitials = (firstName: string, lastName: string) => `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // List View
  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or email" className="w-64" />
              <Button variant="default" size="icon"><Search className="w-4 h-4" /></Button>
            </div>
            <Button onClick={handleCreate} className="gap-2"><Plus className="w-4 h-4" />Create User</Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16 font-semibold">S.No</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Assigned Corporates</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8"><AvatarFallback className="text-xs">{getInitials(user.firstName, user.lastName)}</AvatarFallback></Avatar>
                      {user.firstName} {user.lastName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{user.email}</span>
                      {user.isSuperAdmin && <Badge variant="outline" className="text-xs border-primary text-primary bg-primary/5">Super Admin</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="font-medium">{user.role}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.location || '-'}</TableCell>
                  <TableCell className="max-w-xs">
                    {user.role === 'ADMIN' ? (
                      <span className="text-muted-foreground text-sm">All Corporates</span>
                    ) : user.assignedCorporates.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.assignedCorporates.slice(0, 2).map(id => {
                          const corp = supaCorporates.find(c => c.id === id);
                          return corp ? <Badge key={id} variant="outline" className="text-xs">{corp.name}</Badge> : null;
                        })}
                        {user.assignedCorporates.length > 2 && <Badge variant="outline" className="text-xs">+{user.assignedCorporates.length - 2} more</Badge>}
                      </div>
                    ) : (
                      <span className="text-warning text-sm">No corporates assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" title="View/Edit" onClick={() => handleEdit(user.id)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(user.id)} disabled={user.isSuperAdmin}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-2xl font-bold text-foreground">
          {viewMode === 'create' ? 'Create User Account' : 'Edit User Account'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">First Name *</Label>
            <Input value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Enter first name" className="flex-1" required />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">Last Name *</Label>
            <Input value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Enter last name" className="flex-1" required />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">Email ID *</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@truworthwellness.com" className="flex-1" disabled={viewMode === 'edit'} required />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">Password {viewMode === 'create' ? '*' : ''}</Label>
            <Input type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder={viewMode === 'edit' ? 'Cannot change here' : 'Min 6 characters'} className="flex-1" required={viewMode === 'create'} disabled={viewMode === 'edit'} />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">Mobile</Label>
            <Input value={formData.mobile} onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))} placeholder="Enter mobile number" className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">User Type *</Label>
            <Select value={formData.role} onValueChange={(value: 'ADMIN' | 'DOCTOR' | 'NURSE') => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select user type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                <SelectItem value="NURSE">NURSE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role && formData.role !== 'ADMIN' && (
            <>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-right text-muted-foreground shrink-0">Corporate *</Label>
                <Select value={selectedCorporateId} onValueChange={(value) => {
                  setSelectedCorporateId(value);
                  setFormData(prev => ({ ...prev, location: '' }));
                }}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select corporate" /></SelectTrigger>
                  <SelectContent>
                    {supaCorporates.map(corp => (
                      <SelectItem key={corp.id} value={corp.id}>{corp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-right text-muted-foreground shrink-0">Location *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" disabled={!selectedCorporateId} className={cn("flex-1 justify-between font-normal", !formData.location && "text-muted-foreground")}>
                      {formData.location
                        ? supaLocations.find(l => l.id === formData.location)?.location_name ?? 'Select location'
                        : !selectedCorporateId
                          ? 'Select a corporate first'
                          : supaLocations.length === 0
                            ? 'No locations found for this corporate'
                            : 'Search location...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Type to search city..." />
                      <CommandList>
                        <CommandEmpty>No locations found.</CommandEmpty>
                        <CommandGroup>
                          {supaLocations.map(loc => (
                            <CommandItem key={loc.id} value={loc.location_name} onSelect={() => setFormData(prev => ({ ...prev, location: loc.id }))}>
                              <Check className={cn("mr-2 h-4 w-4", formData.location === loc.id ? "opacity-100" : "opacity-0")} />
                              {loc.location_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          <div className="flex items-center gap-4 col-span-1 md:col-span-2">
            <Label className="w-32 text-right text-muted-foreground shrink-0"></Label>
            <div className="flex items-center gap-2">
              <Checkbox id="superAdmin" checked={formData.isSuperAdmin} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSuperAdmin: !!checked }))} />
              <Label htmlFor="superAdmin" className="text-sm cursor-pointer">Is Super Admin</Label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-32 text-right text-muted-foreground shrink-0">User Image</Label>
            <Avatar className="w-16 h-16 bg-muted">
              <AvatarFallback className="text-lg font-medium">
                {formData.firstName && formData.lastName ? getInitials(formData.firstName, formData.lastName) : 'NA'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {formData.role && formData.role !== 'ADMIN' && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Assign Corporates</h3>
              <span className="text-sm text-muted-foreground">(Select at least one)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supaCorporates.map((corp) => (
                <label
                  key={corp.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.assignedCorporates.includes(corp.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Checkbox checked={formData.assignedCorporates.includes(corp.id)} onCheckedChange={() => handleCorporateToggle(corp.id)} />
                  <div>
                    <p className="font-medium text-sm">{corp.name}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : (viewMode === 'create' ? 'Create User' : 'Update User')}
          </Button>
          <Button type="button" variant="outline" onClick={handleBack}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
