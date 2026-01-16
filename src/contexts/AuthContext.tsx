import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Location } from '@/types/clinic';

interface AuthContextType {
  user: User | null;
  location: Location | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, locationId: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock locations for demo
const mockLocations: Location[] = [
  { id: 'loc1', name: 'Bangalore', clientName: 'Infosys Ltd', address: 'Electronic City, Bangalore' },
  { id: 'loc2', name: 'Mumbai', clientName: 'Tata Consultancy Services', address: 'Andheri East, Mumbai' },
  { id: 'loc3', name: 'Hyderabad', clientName: 'Wipro Technologies', address: 'HITEC City, Hyderabad' },
];

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  { id: 'u1', email: 'doctor@truworth.com', password: 'demo123', name: 'Dr. Priya Sharma', role: 'doctor', locationId: '', locationName: '' },
  { id: 'u2', email: 'nurse@truworth.com', password: 'demo123', name: 'Nurse Anjali Patel', role: 'nurse', locationId: '', locationName: '' },
  { id: 'u3', email: 'admin@truworth.com', password: 'admin123', name: 'Admin User', role: 'admin', locationId: '', locationName: '' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('clinicUser');
    const storedLocation = localStorage.getItem('clinicLocation');
    if (storedUser && storedLocation) {
      const parsedUser = JSON.parse(storedUser);
      const parsedLocation = JSON.parse(storedLocation);
      setUser(parsedUser);
      setLocation(parsedLocation);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, locationId: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    const selectedLocation = mockLocations.find(l => l.id === locationId);
    
    if (foundUser && selectedLocation) {
      const { password: _, ...userWithoutPassword } = foundUser;
      const userWithLocation = {
        ...userWithoutPassword,
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
      };
      setUser(userWithLocation);
      setLocation(selectedLocation);
      localStorage.setItem('clinicUser', JSON.stringify(userWithLocation));
      localStorage.setItem('clinicLocation', JSON.stringify(selectedLocation));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setLocation(null);
    localStorage.removeItem('clinicUser');
    localStorage.removeItem('clinicLocation');
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
