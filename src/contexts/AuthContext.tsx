import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Corporate, AdminUser } from '@/types/clinic';

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
  addAdminUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  updateAdminUser: (id: string, updates: Partial<AdminUser>) => void;
  deleteAdminUser: (id: string) => void;
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

// Initial admin users with passwords
const initialAdminUsers: AdminUser[] = [
  { id: 'u1', email: 'doctor@truworth.com', password: 'demo123', firstName: 'Priya', lastName: 'Sharma', mobile: '9876543210', role: 'DOCTOR', isSuperAdmin: false, assignedCorporates: ['corp1', 'corp2'], createdAt: new Date() },
  { id: 'u2', email: 'nurse@truworth.com', password: 'demo123', firstName: 'Anjali', lastName: 'Patel', mobile: '9876543211', role: 'NURSE', isSuperAdmin: false, assignedCorporates: ['corp1', 'corp3'], createdAt: new Date() },
  { id: 'u3', email: 'admin@truworth.com', password: 'admin123', firstName: 'Admin', lastName: 'User', mobile: '9876543212', role: 'ADMIN', isSuperAdmin: true, assignedCorporates: [], createdAt: new Date() },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedCorporate, setSelectedCorporate] = useState<Corporate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const stored = localStorage.getItem('clinicAdminUsers');
    return stored ? JSON.parse(stored) : initialAdminUsers;
  });

  // Persist admin users to localStorage
  useEffect(() => {
    localStorage.setItem('clinicAdminUsers', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('clinicUser');
    const storedCorporate = localStorage.getItem('clinicSelectedCorporate');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (storedCorporate) {
        setSelectedCorporate(JSON.parse(storedCorporate));
      }
    }
    setIsLoading(false);
  }, []);

  // Get corporates assigned to current user
  const assignedCorporates = user?.role === 'admin' 
    ? allCorporates 
    : allCorporates.filter(c => user?.assignedCorporates?.includes(c.id));

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = adminUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const userRole = foundUser.role.toLowerCase() as 'doctor' | 'nurse' | 'admin';
      const loggedInUser: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: `${foundUser.firstName} ${foundUser.lastName}`,
        role: userRole,
        locationId: '',
        locationName: '',
        assignedCorporates: foundUser.assignedCorporates,
      };
      setUser(loggedInUser);
      localStorage.setItem('clinicUser', JSON.stringify(loggedInUser));
      
      // For non-admin users, if they have only one corporate, auto-select it
      if (userRole !== 'admin' && foundUser.assignedCorporates.length === 1) {
        const corp = allCorporates.find(c => c.id === foundUser.assignedCorporates[0]);
        if (corp) {
          setSelectedCorporate(corp);
          localStorage.setItem('clinicSelectedCorporate', JSON.stringify(corp));
        }
      }
      
      return true;
    }
    return false;
  };

  const selectCorporate = (corporateId: string) => {
    const corporate = allCorporates.find(c => c.id === corporateId);
    if (corporate) {
      setSelectedCorporate(corporate);
      localStorage.setItem('clinicSelectedCorporate', JSON.stringify(corporate));
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedCorporate(null);
    localStorage.removeItem('clinicUser');
    localStorage.removeItem('clinicSelectedCorporate');
  };

  const addAdminUser = (userData: Omit<AdminUser, 'id' | 'createdAt'>) => {
    const newUser: AdminUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setAdminUsers(prev => [...prev, newUser]);
  };

  const updateAdminUser = (id: string, updates: Partial<AdminUser>) => {
    setAdminUsers(prev => prev.map(u => 
      u.id === id ? { ...u, ...updates } : u
    ));
  };

  const deleteAdminUser = (id: string) => {
    setAdminUsers(prev => prev.filter(u => u.id !== id));
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
