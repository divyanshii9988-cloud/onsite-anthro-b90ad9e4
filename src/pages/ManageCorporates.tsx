import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, MapPin, Building2 } from 'lucide-react';

interface Corporate {
  id: string;
  name: string;
  industry: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  email_domain: string | null;
}

interface CorporateLocation {
  id: string;
  corporate_id: string;
  location_name: string;
  city: string | null;
  address: string | null;
  is_active: boolean;
}

const emptyCorporate = {
  name: '',
  industry: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  city: '',
  state: '',
  address: '',
  logo_url: '',
  email_domain: '',
};

const emptyLocation = {
  location_name: '',
  city: '',
  address: '',
};

export default function ManageCorporates() {
  const { toast } = useToast();
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [locations, setLocations] = useState<Record<string, CorporateLocation[]>>({});
  const [loading, setLoading] = useState(true);

  // Corporate modal
  const [corpModalOpen, setCorpModalOpen] = useState(false);
  const [editingCorp, setEditingCorp] = useState<Corporate | null>(null);
  const [corpForm, setCorpForm] = useState(emptyCorporate);

  // Location modal
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [locCorporateId, setLocCorporateId] = useState<string | null>(null);
  const [locForm, setLocForm] = useState(emptyLocation);

  // Expanded rows for locations
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchCorporates = async () => {
    const { data } = await supabase.from('corporates').select('*').order('name');
    if (data) setCorporates(data.map(d => ({ ...d, is_active: d.is_active ?? true })));
    setLoading(false);
  };

  const fetchLocations = async (corporateId: string) => {
    const { data } = await supabase
      .from('corporate_locations')
      .select('*')
      .eq('corporate_id', corporateId)
      .order('location_name');
    if (data) {
      setLocations(prev => ({ ...prev, [corporateId]: data.map(d => ({ ...d, is_active: d.is_active ?? true })) }));
    }
  };

  useEffect(() => {
    fetchCorporates();
  }, []);

  const openAddCorporate = () => {
    setEditingCorp(null);
    setCorpForm(emptyCorporate);
    setCorpModalOpen(true);
  };

  const openEditCorporate = (corp: Corporate) => {
    setEditingCorp(corp);
    setCorpForm({
      name: corp.name,
      industry: corp.industry || '',
      contact_person: corp.contact_person || '',
      contact_email: corp.contact_email || '',
      contact_phone: corp.contact_phone || '',
      city: corp.city || '',
      state: corp.state || '',
      address: corp.address || '',
      logo_url: corp.logo_url || '',
      email_domain: corp.email_domain || '',
    });
    setCorpModalOpen(true);
  };

  const saveCorporate = async () => {
    if (!corpForm.name.trim()) {
      toast({ title: 'Error', description: 'Corporate name is required', variant: 'destructive' });
      return;
    }

    const payload = {
      name: corpForm.name,
      industry: corpForm.industry || null,
      contact_person: corpForm.contact_person || null,
      contact_email: corpForm.contact_email || null,
      contact_phone: corpForm.contact_phone || null,
      city: corpForm.city || null,
      state: corpForm.state || null,
      address: corpForm.address || null,
      logo_url: corpForm.logo_url || null,
      email_domain: corpForm.email_domain || null,
    };

    if (editingCorp) {
      const { error } = await supabase.from('corporates').update(payload).eq('id', editingCorp.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Updated', description: 'Corporate updated successfully' });
    } else {
      const { error } = await supabase.from('corporates').insert(payload);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Created', description: 'Corporate added successfully' });
    }

    setCorpModalOpen(false);
    fetchCorporates();
  };

  const toggleActive = async (corp: Corporate) => {
    const { error } = await supabase
      .from('corporates')
      .update({ is_active: !corp.is_active })
      .eq('id', corp.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    fetchCorporates();
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!locations[id]) fetchLocations(id);
      }
      return next;
    });
  };

  const openAddLocation = (corporateId: string) => {
    setLocCorporateId(corporateId);
    setLocForm(emptyLocation);
    setLocModalOpen(true);
  };

  const saveLocation = async () => {
    if (!locForm.location_name.trim() || !locCorporateId) {
      toast({ title: 'Error', description: 'Location name is required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('corporate_locations').insert({
      corporate_id: locCorporateId,
      location_name: locForm.location_name,
      city: locForm.city || null,
      address: locForm.address || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Created', description: 'Location added successfully' });
    setLocModalOpen(false);
    fetchLocations(locCorporateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Corporates</h1>
          <p className="text-muted-foreground">Add, edit and manage corporate clients and their locations</p>
        </div>
        <Button onClick={openAddCorporate}>
          <Plus className="w-4 h-4 mr-2" /> Add Corporate
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : corporates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No corporates found</TableCell>
              </TableRow>
            ) : (
              corporates.map(corp => (
                <>
                  <TableRow key={corp.id}>
                    <TableCell>
                      {corp.logo_url ? (
                        <img src={corp.logo_url} alt={corp.name} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{corp.name}</TableCell>
                    <TableCell>{corp.industry || '—'}</TableCell>
                    <TableCell>{corp.contact_person || '—'}</TableCell>
                    <TableCell>{corp.contact_email || '—'}</TableCell>
                    <TableCell>{corp.contact_phone || '—'}</TableCell>
                    <TableCell>{corp.city || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={corp.is_active} onCheckedChange={() => toggleActive(corp)} />
                        <Badge variant={corp.is_active ? 'default' : 'secondary'}>
                          {corp.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditCorporate(corp)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleExpand(corp.id)} title="Locations">
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(corp.id) && (
                    <TableRow key={`${corp.id}-loc`}>
                      <TableCell colSpan={9} className="bg-muted/30 p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">Locations</h4>
                            <Button size="sm" variant="outline" onClick={() => openAddLocation(corp.id)}>
                              <Plus className="w-3 h-3 mr-1" /> Add Location
                            </Button>
                          </div>
                          {(locations[corp.id] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No locations added yet</p>
                          ) : (
                            <div className="space-y-1">
                              {locations[corp.id].map(loc => (
                                <div key={loc.id} className="flex items-center gap-4 text-sm p-2 rounded bg-background border">
                                  <span className="font-medium">{loc.location_name}</span>
                                  <span className="text-muted-foreground">{loc.city || '—'}</span>
                                  <span className="text-muted-foreground">{loc.address || '—'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Corporate Modal */}
      <Dialog open={corpModalOpen} onOpenChange={setCorpModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCorp ? 'Edit Corporate' : 'Add Corporate'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={corpForm.name} onChange={e => setCorpForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Industry</Label>
                <Input value={corpForm.industry} onChange={e => setCorpForm(p => ({ ...p, industry: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Email Domain</Label>
                <Input value={corpForm.email_domain} onChange={e => setCorpForm(p => ({ ...p, email_domain: e.target.value }))} placeholder="example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact Person</Label>
                <Input value={corpForm.contact_person} onChange={e => setCorpForm(p => ({ ...p, contact_person: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Contact Phone</Label>
                <Input value={corpForm.contact_phone} onChange={e => setCorpForm(p => ({ ...p, contact_phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Contact Email</Label>
              <Input value={corpForm.contact_email} onChange={e => setCorpForm(p => ({ ...p, contact_email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input value={corpForm.city} onChange={e => setCorpForm(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input value={corpForm.state} onChange={e => setCorpForm(p => ({ ...p, state: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input value={corpForm.address} onChange={e => setCorpForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Logo URL</Label>
              <Input value={corpForm.logo_url} onChange={e => setCorpForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorpModalOpen(false)}>Cancel</Button>
            <Button onClick={saveCorporate}>{editingCorp ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Modal */}
      <Dialog open={locModalOpen} onOpenChange={setLocModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Location Name *</Label>
              <Input value={locForm.location_name} onChange={e => setLocForm(p => ({ ...p, location_name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>City</Label>
              <Input value={locForm.city} onChange={e => setLocForm(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input value={locForm.address} onChange={e => setLocForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocModalOpen(false)}>Cancel</Button>
            <Button onClick={saveLocation}>Add Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
