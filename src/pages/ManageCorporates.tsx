import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Pencil, Building2, X, Upload, Loader2 } from 'lucide-react';

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

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Manufacturing', 'Finance & Banking',
  'Automotive', 'Retail', 'Telecom', 'Energy', 'Pharma',
  'Education', 'Logistics', 'Real Estate', 'FMCG', 'Other',
];

const emptyCorporate = {
  name: '',
  industry: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  email_domain: '',
};

export default function ManageCorporates() {
  const { toast } = useToast();
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [corporateLocations, setCorporateLocations] = useState<Record<string, CorporateLocation[]>>({});
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCorp, setEditingCorp] = useState<Corporate | null>(null);
  const [corpForm, setCorpForm] = useState(emptyCorporate);
  const [cityTags, setCityTags] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCorporates = async () => {
    const { data } = await supabase.from('corporates').select('*').order('name');
    if (data) {
      setCorporates(data.map(d => ({ ...d, is_active: d.is_active ?? true })));
      // Fetch all locations for all corporates
      const ids = data.map(d => d.id);
      if (ids.length > 0) {
        const { data: locs } = await supabase
          .from('corporate_locations')
          .select('*')
          .in('corporate_id', ids)
          .order('location_name');
        if (locs) {
          const grouped: Record<string, CorporateLocation[]> = {};
          locs.forEach(l => {
            const cid = l.corporate_id!;
            if (!grouped[cid]) grouped[cid] = [];
            grouped[cid].push({ ...l, is_active: l.is_active ?? true, corporate_id: cid });
          });
          setCorporateLocations(grouped);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCorporates();
  }, []);

  const openAddCorporate = () => {
    setEditingCorp(null);
    setCorpForm(emptyCorporate);
    setCityTags([]);
    setLogoFile(null);
    setLogoPreview(null);
    setModalOpen(true);
  };

  const openEditCorporate = (corp: Corporate) => {
    setEditingCorp(corp);
    setCorpForm({
      name: corp.name,
      industry: corp.industry || '',
      contact_person: corp.contact_person || '',
      contact_email: corp.contact_email || '',
      contact_phone: corp.contact_phone || '',
      email_domain: corp.email_domain || '',
    });
    // Load existing cities from locations
    const existingCities = (corporateLocations[corp.id] || []).map(l => l.location_name);
    setCityTags(existingCities);
    setLogoFile(null);
    setLogoPreview(corp.logo_url || null);
    setModalOpen(true);
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const city = cityInput.trim();
      if (city && !cityTags.includes(city)) {
        setCityTags(prev => [...prev, city]);
      }
      setCityInput('');
    }
  };

  const removeCity = (city: string) => {
    setCityTags(prev => prev.filter(c => c !== city));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Logo must be under 2MB', variant: 'destructive' });
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      toast({ title: 'Error', description: 'Only PNG, JPG or SVG allowed', variant: 'destructive' });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (file: File, corporateId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${corporateId}/logo.${ext}`;
    const { error } = await supabase.storage.from('corporate-logos').upload(path, file, { upsert: true });
    if (error) {
      console.error('Logo upload error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage.from('corporate-logos').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveCorporate = async () => {
    if (!corpForm.name.trim()) {
      toast({ title: 'Error', description: 'Company name is required', variant: 'destructive' });
      return;
    }
    if (!corpForm.contact_person.trim() || !corpForm.contact_email.trim() || !corpForm.contact_phone.trim()) {
      toast({ title: 'Error', description: 'Contact person, email, and phone are required', variant: 'destructive' });
      return;
    }
    if (cityTags.length === 0) {
      toast({ title: 'Error', description: 'At least one city is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: corpForm.name,
        industry: corpForm.industry || null,
        contact_person: corpForm.contact_person || null,
        contact_email: corpForm.contact_email || null,
        contact_phone: corpForm.contact_phone || null,
        email_domain: corpForm.email_domain || null,
      };

      let corporateId: string;

      if (editingCorp) {
        corporateId = editingCorp.id;
        // Upload logo if new file
        if (logoFile) {
          const logoUrl = await uploadLogo(logoFile, corporateId);
          if (logoUrl) payload.logo_url = logoUrl;
        }
        const { error } = await supabase.from('corporates').update(payload).eq('id', corporateId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('corporates').insert(payload).select().single();
        if (error) throw error;
        corporateId = data.id;
        // Upload logo after creation
        if (logoFile) {
          const logoUrl = await uploadLogo(logoFile, corporateId);
          if (logoUrl) {
            await supabase.from('corporates').update({ logo_url: logoUrl }).eq('id', corporateId);
          }
        }
      }

      // Sync cities in corporate_locations
      const existingLocs = corporateLocations[corporateId] || [];
      const existingNames = existingLocs.map(l => l.location_name);

      // Cities to add
      const toAdd = cityTags.filter(c => !existingNames.includes(c));
      // Cities to remove
      const toRemove = existingLocs.filter(l => !cityTags.includes(l.location_name));

      if (toAdd.length > 0) {
        await supabase.from('corporate_locations').insert(
          toAdd.map(city => ({ corporate_id: corporateId, location_name: city, city }))
        );
      }
      if (toRemove.length > 0) {
        await supabase.from('corporate_locations').delete().in('id', toRemove.map(l => l.id));
      }

      toast({ title: editingCorp ? 'Updated' : 'Created', description: `Corporate ${editingCorp ? 'updated' : 'added'} successfully` });
      setModalOpen(false);
      fetchCorporates();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
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
              <TableHead>Company Name</TableHead>
              <TableHead>Cities</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : corporates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No corporates found</TableCell>
              </TableRow>
            ) : (
              corporates.map(corp => (
                <TableRow key={corp.id}>
                  <TableCell>
                    {corp.logo_url ? (
                      <img src={corp.logo_url} alt={corp.name} className="w-10 h-10 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {getInitials(corp.name)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{corp.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(corporateLocations[corp.id] || []).map(loc => (
                        <Badge key={loc.id} variant="secondary" className="text-xs">
                          {loc.location_name}
                        </Badge>
                      ))}
                      {(corporateLocations[corp.id] || []).length === 0 && (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{corp.industry || '—'}</TableCell>
                  <TableCell>{corp.contact_person || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={corp.is_active} onCheckedChange={() => toggleActive(corp)} />
                      <Badge variant={corp.is_active ? 'default' : 'secondary'}>
                        {corp.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEditCorporate(corp)} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Corporate Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCorp ? 'Edit Corporate' : 'Add Corporate'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Company Name *</Label>
              <Input value={corpForm.name} onChange={e => setCorpForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter company name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Industry</Label>
                <Select value={corpForm.industry} onValueChange={v => setCorpForm(p => ({ ...p, industry: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Email Domain</Label>
                <Input value={corpForm.email_domain} onChange={e => setCorpForm(p => ({ ...p, email_domain: e.target.value }))} placeholder="tatamotors.com" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Contact Person *</Label>
              <Input value={corpForm.contact_person} onChange={e => setCorpForm(p => ({ ...p, contact_person: e.target.value }))} placeholder="Enter contact person name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact Email *</Label>
                <Input type="email" value={corpForm.contact_email} onChange={e => setCorpForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="email@company.com" />
              </div>
              <div className="grid gap-2">
                <Label>Contact Phone *</Label>
                <Input value={corpForm.contact_phone} onChange={e => setCorpForm(p => ({ ...p, contact_phone: e.target.value }))} placeholder="+91 9876543210" />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="grid gap-2">
              <Label>Logo Upload</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-lg object-cover border" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> {logoPreview ? 'Change' : 'Upload'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG. Max 2MB.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            {/* City Tags */}
            <div className="grid gap-2 p-4 rounded-lg border border-dashed bg-muted/30">
              <Label className="text-base font-semibold">Assign Cities *</Label>
              <p className="text-xs text-muted-foreground">Type a city name and press Enter to add. Each city is saved as a location.</p>
              <div className="flex flex-wrap gap-2 min-h-[36px]">
                {cityTags.map(city => (
                  <Badge key={city} variant="default" className="gap-1 pr-1">
                    {city}
                    <button type="button" onClick={() => removeCity(city)} className="ml-1 rounded-full hover:bg-primary-foreground/20 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={handleCityKeyDown}
                placeholder="Type city name and press Enter..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveCorporate} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : (editingCorp ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
