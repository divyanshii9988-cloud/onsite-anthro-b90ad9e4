import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Corporate, AdminUser } from '@/types/clinic';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  corporates: Corporate[];
  selectedCorporate: Corporate | null;
  assignedCorporates: Corporate[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectCorporate: (corporateId: string) => void;
  adminUsers: AdminUser[];
  addAdminUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => Promise<void>;
  updateAdminUser: (id: string, updates: Partial<AdminUser>) => Promise<void>;
  deleteAdminUser: (id: string) => Promise<void>;
  refreshCorporates: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedCorporate, setSelectedCorporate] = useState<Corporate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [corporatesFromDB, setCorporatesFromDB] = useState<Corporate[]>([]);

  // Fetch all corporates with their locations from Supabase
  const refreshCorporates = useCallback(async () => {
    // Fetch corporates
    const { data: corpsData } = await supabase.from('corporates').select('*').order('name');
    if (!corpsData) return;

    // Fetch all locations
    const corpIds = corpsData.map(c => c.id);
    const { data: locsData } = await supabase
      .from('corporate_locations')
      .select('*')
      .in('corporate_id', corpIds)
      .order('location_name');

    // Create a flat list: each corporate-location combination is an entry
    const mapped: Corporate[] = [];

    for (const corp of corpsData) {
      const corpLocations = (locsData || []).filter(l => l.corporate_id === corp.id);
      
      if (corpLocations.length === 0) {
        // Corporate has no locations, show just the corporate
        mapped.push({
          id: corp.id,
          corporateId: corp.id,
          name: corp.name,
          location: corp.city || '',
          address: corp.address || '',
          contactPerson: corp.contact_person || undefined,
          contactNumber: corp.contact_phone || undefined,
          logoUrl: corp.logo_url || undefined,
        });
      } else {
        // Create an entry for each location
        for (const loc of corpLocations) {
          mapped.push({
            id: `${corp.id}__${loc.id}`, // Combined ID for unique selection
            corporateId: corp.id,
            locationId: loc.id,
            name: corp.name,
            location: loc.location_name || loc.city || '',
            address: loc.address || corp.address || '',
            contactPerson: corp.contact_person || undefined,
            contactNumber: corp.contact_phone || undefined,
          });
        }
      }
    }

    setCorporatesFromDB(mapped);

    // Restore selected corporate from localStorage using fresh DB data
    const storedCorp = localStorage.getItem('clinicSelectedCorporate');
    if (storedCorp) {
      try {
        const parsed = JSON.parse(storedCorp);
        const fresh = mapped.find(c => c.id === parsed.id);
        if (fresh) setSelectedCorporate(fresh);
      } catch {}
    }
  }, []);

  // Fetch admin users from profiles table
  const fetchAdminUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (!profiles) return;
    const { data: profileCorps } = await supabase.from('profile_corporates').select('profile_id, corporate_id');
    const users: AdminUser[] = profiles.map(d => {
      const assignments = profileCorps?.filter(pc => pc.profile_id === d.id) || [];
      return {
        id: d.id,
        firstName: d.full_name?.split(' ')[0] || '',
        lastName: d.full_name?.split(' ').slice(1).join(' ') || '',
        email: '',
        mobile: '',
        role: (d.role?.toUpperCase() || 'NURSE') as 'ADMIN' | 'DOCTOR' | 'NURSE',
        isSuperAdmin: d.role?.toLowerCase() === 'admin',
        assignedCorporates: assignments.map(a => a.corporate_id).filter(Boolean) as string[],
        location: d.location_id || '',
        createdAt: d.created_at ? new Date(d.created_at) : new Date(),
      };
    });
    setAdminUsers(users);
  };

  // Load user profile from profiles table
  const loadUserProfile = async (sessionUserId: string, sessionEmail: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUserId)
      .single();

    if (profile) {
      const userRole = (profile.role?.toLowerCase() || 'nurse') as 'doctor' | 'nurse' | 'admin';
      // For non-admin, fetch their assigned corporates
      let assignedCorporateIds: string[] = [];
      if (userRole !== 'admin') {
        const { data: pc } = await supabase
          .from('profile_corporates')
          .select('corporate_id')
          .eq('profile_id', sessionUserId);
        assignedCorporateIds = (pc || []).map(r => r.corporate_id).filter(Boolean) as string[];
      }

      const loggedInUser: User = {
        id: sessionUserId,
        email: sessionEmail,
        name: profile.full_name || sessionEmail,
        role: userRole,
        locationId: profile.location_id || '',
        locationName: '',
        assignedCorporates: assignedCorporateIds,
      };
      setUser(loggedInUser);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setTimeout(async () => {
            await refreshCorporates();
            await loadUserProfile(session.user.id, session.user.email || '');
            await fetchAdminUsers();
          }, 0);
        } else {
          setUser(null);
          setSelectedCorporate(null);
          setCorporatesFromDB([]);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await refreshCorporates();
        await loadUserProfile(session.user.id, session.user.email || '');
        await fetchAdminUsers();
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // For admin: show all corporate-locations
  // For staff: filter to their assigned corporates (showing all locations within those corporates)
  const assignedCorporates = user?.role === 'admin'
    ? corporatesFromDB
    : corporatesFromDB.filter(c => user?.assignedCorporates?.includes(c.corporateId || c.id));

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return false;
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('clinicSelectedCorporate');
  };

  const selectCorporate = (corporateId: string) => {
    if (!corporateId) {
      setSelectedCorporate(null);
      localStorage.removeItem('clinicSelectedCorporate');
      return;
    }
    const corporate = corporatesFromDB.find(c => c.id === corporateId);
    if (corporate) {
      setSelectedCorporate(corporate);
      localStorage.setItem('clinicSelectedCorporate', JSON.stringify(corporate));
    }
  };

  const addAdminUser = async (userData: Omit<AdminUser, 'id' | 'createdAt'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await supabase.functions.invoke('create-user', {
      body: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        mobile: userData.mobile,
        role: userData.role,
        corporateAssignments: userData.corporateAssignments || [],
      },
    });

    if (response.error) throw new Error(response.error.message || 'Failed to create user');
    const result = response.data;
    if (result?.error) throw new Error(result.error);
    await fetchAdminUsers();
  };

  const updateAdminUser = async (id: string, updates: Partial<AdminUser>) => {
    const fullName = updates.firstName && updates.lastName
      ? `${updates.firstName} ${updates.lastName}`
      : undefined;
    await supabase.from('profiles').update({
      ...(fullName && { full_name: fullName }),
      ...(updates.role && { role: updates.role.toLowerCase() }),
    }).eq('id', id);
    await fetchAdminUsers();
  };

  const deleteAdminUser = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    await fetchAdminUsers();
  };

  return (
    <AuthContext.Provider value={{
      user,
      corporates: corporatesFromDB,
      selectedCorporate,
      assignedCorporates,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      selectCorporate,
      adminUsers,
      addAdminUser,
      updateAdminUser,
      deleteAdminUser,
      refreshCorporates,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
