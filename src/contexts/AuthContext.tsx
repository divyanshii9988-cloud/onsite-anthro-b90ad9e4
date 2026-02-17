import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Corporate, AdminUser } from '@/types/clinic';
import { auth, db, getSecondaryAuth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot,
  Timestamp, serverTimestamp,
} from 'firebase/firestore';

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

// Helper to convert Firestore Timestamps to Dates
function convertTimestamps(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (result[key] && typeof result[key].toDate === 'function') {
      result[key] = result[key].toDate();
    }
  }
  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedCorporate, setSelectedCorporate] = useState<Corporate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  // Listen to admin users from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(d => {
        const data = convertTimestamps(d.data());
        return {
          id: d.id,
          ...data,
          assignedCorporates: data.corporates || data.assignedCorporates || [],
        } as AdminUser;
      });
      setAdminUsers(users);
    });
    return unsubscribe;
  }, []);

  // Seed initial admin if no users exist in Firestore
  useEffect(() => {
    async function seedAdmin() {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        if (snapshot.empty) {
          const secondaryAuth = getSecondaryAuth();
          const cred = await createUserWithEmailAndPassword(
            secondaryAuth,
            'admin@truworth.com',
            'admin123'
          );
          await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@truworth.com',
            mobile: '9876543212',
            role: 'ADMIN',
            isSuperAdmin: true,
            corporates: [],
            location: '',
            createdAt: serverTimestamp(),
          });
          await signOut(secondaryAuth);
          console.log('Initial admin account seeded successfully');
        }
      } catch (err) {
        console.error('Seed admin error:', err);
      }
    }
    seedAdmin();
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userRole = data.role.toLowerCase() as 'doctor' | 'nurse' | 'admin';
            const loggedInUser: User = {
              id: firebaseUser.uid,
              email: data.email,
              name: `${data.firstName} ${data.lastName}`,
              role: userRole,
              locationId: data.location || '',
              locationName: data.location || '',
              assignedCorporates: data.corporates || data.assignedCorporates || [],
            };
            setUser(loggedInUser);

            // Restore selected corporate
            const storedCorp = localStorage.getItem('clinicSelectedCorporate');
            if (storedCorp) {
              setSelectedCorporate(JSON.parse(storedCorp));
            } else if (userRole !== 'admin' && (data.corporates || data.assignedCorporates)?.length === 1) {
              const corp = allCorporates.find(c => c.id === (data.corporates || data.assignedCorporates)[0]);
              if (corp) {
                setSelectedCorporate(corp);
                localStorage.setItem('clinicSelectedCorporate', JSON.stringify(corp));
              }
            }
          } else {
            // User in Auth but not Firestore → sign out
            await signOut(auth);
          }
        } catch (err) {
          console.error('Error loading user data:', err);
          await signOut(auth);
        }
      } else {
        setUser(null);
        setSelectedCorporate(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const assignedCorporates = user?.role === 'admin'
    ? allCorporates
    : allCorporates.filter(c => user?.assignedCorporates?.includes(c.id));

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    signOut(auth);
    localStorage.removeItem('clinicSelectedCorporate');
  };

  const selectCorporate = (corporateId: string) => {
    if (!corporateId) {
      // Admin clearing filter
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
    if (!userData.password) throw new Error('Password is required');
    const secondaryAuth = getSecondaryAuth();
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      userData.email,
      userData.password
    );
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      mobile: userData.mobile,
      role: userData.role,
      isSuperAdmin: userData.isSuperAdmin,
      corporates: userData.assignedCorporates,
      location: userData.location || '',
      createdAt: serverTimestamp(),
    });
    await signOut(secondaryAuth);
  };

  const updateAdminUser = async (id: string, updates: Partial<AdminUser>) => {
    const { password, id: _, createdAt, ...firestoreUpdates } = updates as any;
    await updateDoc(doc(db, 'users', id), firestoreUpdates);
    // Note: Password update requires Firebase Admin SDK (server-side)
  };

  const deleteAdminUser = async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
    // Note: Firebase Auth account remains but user can't access app without Firestore doc
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
