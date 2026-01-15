import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Location } from '@/types/clinic';

interface AuthContextType {
  user: User | null;
  location: Location | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock locations for demo
const mockLocations: Location[] = [
  { id: 'loc1', name: 'Infosys - Bangalore', clientName: 'Infosys Ltd', address: 'Electronic City, Bangalore' },
  { id: 'loc2', name: 'TCS - Mumbai', clientName: 'Tata Consultancy Services', address: 'Andheri East, Mumbai' },
  { id: 'loc3', name: 'Wipro - Hyderabad', clientName: 'Wipro Technologies', address: 'HITEC City, Hyderabad' },
];

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  { id: 'u1', email: 'doctor@infosys.truworth.com', password: 'demo123', name: 'Dr. Priya Sharma', role: 'doctor', locationId: 'loc1', locationName: 'Infosys - Bangalore' },
  { id: 'u2', email: 'nurse@tcs.truworth.com', password: 'demo123', name: 'Nurse Anjali Patel', role: 'nurse', locationId: 'loc2', locationName: 'TCS - Mumbai' },
  { id: 'u3', email: 'admin@truworth.com', password: 'admin123', name: 'Admin User', role: 'admin', locationId: 'loc1', locationName: 'Infosys - Bangalore' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('clinicUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const loc = mockLocations.find(l => l.id === parsedUser.locationId);
      setLocation(loc || null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      const loc = mockLocations.find(l => l.id === foundUser.locationId);
      setLocation(loc || null);
      localStorage.setItem('clinicUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setLocation(null);
    localStorage.removeItem('clinicUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      location,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
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
