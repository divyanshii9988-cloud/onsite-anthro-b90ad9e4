import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Corporate, AdminUser } from '@/types/clinic';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// All corporates available in the system
const allCorporates: Corporate[] = [
  { id: 'corp1', name: 'Infosys Ltd', location: 'Bangalore', address: 'Electronic City, Bangalore' },
  { id: 'corp2', name: 'Tata Consultancy Services', location: 'Mumbai', address: 'Andheri East, Mumbai' },
  { id: 'corp3', name: 'Wipro Technologies', location: 'Hyderabad', address: 'HITEC City, Hyderabad' },
  { id: 'corp4', name: 'Tech Mahindra', location: 'Pune', address: 'Hinjewadi, Pune' },
  { id: 'corp5', name: 'HCL Technologies', location: 'Noida', address: 'Sector 126, Noida' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedCorporate, setSelectedCorporate] = useState<Corporate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  // Fetch admin users from profiles table
  const fetchAdminUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      setAdminUsers(data.map(d => ({
        id: d.id,
        firstName: d.full_name?.split(' ')[0] || '',
        lastName: d.full_name?.split(' ').slice(1).join(' ') || '',
        email: '', // profiles table doesn't store email
        mobile: '',
        role: (d.role?.toUpperCase() || 'NURSE') as 'ADMIN' | 'DOCTOR' | 'NURSE',
        isSuperAdmin: d.role?.toLowerCase() === 'admin',
        assignedCorporates: [],
        location: '',
        createdAt: d.created_at ? new Date(d.created_at) : new Date(),
      })));
    }
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
      const loggedInUser: User = {
        id: sessionUserId,
        email: sessionEmail,
        name: profile.full_name || sessionEmail,
        role: userRole,
        locationId: '',
        locationName: '',
        assignedCorporates: [],
      };
      setUser(loggedInUser);

      // Restore selected corporate
      const storedCorp = localStorage.getItem('clinicSelectedCorporate');
      if (storedCorp) {
        setSelectedCorporate(JSON.parse(storedCorp));
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => {
            loadUserProfile(session.user.id, session.user.email || '');
            fetchAdminUsers();
          }, 0);
        } else {
          setUser(null);
          setSelectedCorporate(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email || '');
        fetchAdminUsers();
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const assignedCorporates = user?.role === 'admin'
    ? allCorporates
    : allCorporates.filter(c => user?.assignedCorporates?.includes(c.id));

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
    const corporate = allCorporates.find(c => c.id === corporateId);
    if (corporate) {
      setSelectedCorporate(corporate);
      localStorage.setItem('clinicSelectedCorporate', JSON.stringify(corporate));
    }
  };

  const addAdminUser = async (userData: Omit<AdminUser, 'id' | 'createdAt'>) => {
    // Creating users via Supabase Auth requires admin/service role.
    // For now, we create a profile entry. In production, use an edge function.
    throw new Error('User creation requires a server-side edge function with service role key');
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
      corporates: allCorporates,
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
