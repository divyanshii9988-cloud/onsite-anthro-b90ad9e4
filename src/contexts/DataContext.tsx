import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Employee, WalkIn, Medicine, Emergency, BiowWaste, AmbulanceMovement, SpecialistConsultation, DigitalPrescription } from '@/types/clinic';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, canAccessCorporate } from '@/lib/permissions';
import {
  collection, addDoc, updateDoc, doc, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';

interface DataContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'registeredAt'>) => void;
  searchEmployees: (query: string) => Employee[];
  getEmployee: (id: string) => Employee | undefined;
  walkIns: WalkIn[];
  addWalkIn: (walkIn: Omit<WalkIn, 'id' | 'createdAt'>) => void;
  medicines: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  updateMedicineStock: (id: string, quantity: number) => void;
  dispenseMedicine: (id: string, quantity: number) => boolean;
  emergencies: Emergency[];
  addEmergency: (emergency: Omit<Emergency, 'id' | 'createdAt'>) => void;
  bioWaste: BiowWaste[];
  addBioWaste: (waste: Omit<BiowWaste, 'id'>) => void;
  ambulanceMovements: AmbulanceMovement[];
  addAmbulanceMovement: (movement: Omit<AmbulanceMovement, 'id'>) => void;
  specialistConsultations: SpecialistConsultation[];
  addSpecialistConsultation: (consultation: Omit<SpecialistConsultation, 'id' | 'createdAt'>) => void;
  prescriptions: DigitalPrescription[];
  addPrescription: (prescription: Omit<DigitalPrescription, 'id' | 'sentAt'>) => void;
  getTodayStats: (locationId?: string) => {
    walkIns: number;
    emergencies: number;
    medicinesDispensed: number;
    registrations: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Convert Firestore Timestamps to JS Dates recursively (top-level only)
function convertTimestamps(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (result[key] && typeof result[key].toDate === 'function') {
      result[key] = result[key].toDate();
    }
  }
  return result;
}

// Convert a Date (or Date-like) value to Firestore Timestamp, or null
function toTimestamp(value: any): Timestamp | null {
  if (!value) return null;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === 'string') return Timestamp.fromDate(new Date(value));
  return null;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, selectedCorporate } = useAuth();
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allWalkIns, setAllWalkIns] = useState<WalkIn[]>([]);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [allEmergencies, setAllEmergencies] = useState<Emergency[]>([]);
  const [allBioWaste, setAllBioWaste] = useState<BiowWaste[]>([]);
  const [allAmbulanceMovements, setAllAmbulanceMovements] = useState<AmbulanceMovement[]>([]);
  const [allSpecialistConsultations, setAllSpecialistConsultations] = useState<SpecialistConsultation[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<DigitalPrescription[]>([]);

  const activeCorporateId = selectedCorporate?.id || null;
  const userRole = user?.role;
  const isAdmin = userRole === 'admin';

  // Corporate-based filtering helper
  function filterByCorporate<T extends { corporateId?: string; locationId?: string }>(items: T[]): T[] {
    if (isAdmin && !activeCorporateId) return items; // Admin with no filter sees all
    if (!activeCorporateId) return [];
    return items.filter(item => 
      item.corporateId === activeCorporateId || item.locationId === activeCorporateId
    );
  }

  // Filtered data based on active corporate
  const employees = useMemo(() => filterByCorporate(allEmployees), [allEmployees, activeCorporateId, isAdmin]);
  const walkIns = useMemo(() => filterByCorporate(allWalkIns), [allWalkIns, activeCorporateId, isAdmin]);
  const medicines = useMemo(() => filterByCorporate(allMedicines), [allMedicines, activeCorporateId, isAdmin]);
  const emergencies = useMemo(() => filterByCorporate(allEmergencies), [allEmergencies, activeCorporateId, isAdmin]);
  const bioWaste = useMemo(() => filterByCorporate(allBioWaste), [allBioWaste, activeCorporateId, isAdmin]);
  const ambulanceMovements = useMemo(() => filterByCorporate(allAmbulanceMovements), [allAmbulanceMovements, activeCorporateId, isAdmin]);
  const specialistConsultations = useMemo(() => filterByCorporate(allSpecialistConsultations), [allSpecialistConsultations, activeCorporateId, isAdmin]);
  const prescriptions = useMemo(() => filterByCorporate(allPrescriptions), [allPrescriptions, activeCorporateId, isAdmin]);

  // Firestore real-time listeners
  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'employees'), (snap) => {
        setAllEmployees(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Employee)));
      }),
      onSnapshot(collection(db, 'walkIns'), (snap) => {
        setAllWalkIns(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as WalkIn)));
      }),
      onSnapshot(collection(db, 'medicines'), (snap) => {
        setAllMedicines(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Medicine)));
      }),
      onSnapshot(collection(db, 'emergencies'), (snap) => {
        setAllEmergencies(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Emergency)));
      }),
      onSnapshot(collection(db, 'bioWaste'), (snap) => {
        setAllBioWaste(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as BiowWaste)));
      }),
      onSnapshot(collection(db, 'ambulanceMovements'), (snap) => {
        setAllAmbulanceMovements(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as AmbulanceMovement)));
      }),
      onSnapshot(collection(db, 'specialistConsultations'), (snap) => {
        setAllSpecialistConsultations(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as SpecialistConsultation)));
      }),
      onSnapshot(collection(db, 'prescriptions'), (snap) => {
        setAllPrescriptions(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as DigitalPrescription)));
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // Validate corporate access before any write
  function validateCorporateAccess(): boolean {
    if (isAdmin) return true;
    if (!activeCorporateId) {
      toast.error('Please select a corporate first');
      return false;
    }
    if (!canAccessCorporate(userRole, user?.assignedCorporates, activeCorporateId)) {
      toast.error('Access Denied: You do not have access to this corporate');
      return false;
    }
    return true;
  }

  // ─── Employees ─────────────────────────────────────────
  const addEmployee = (employee: Omit<Employee, 'id' | 'registeredAt'>) => {
    if (!hasPermission(userRole, 'register_employee')) { toast.error('Access Denied'); return; }
    if (!validateCorporateAccess()) return;
    addDoc(collection(db, 'employees'), {
      ...employee,
      corporateId: activeCorporateId || '',
      registeredAt: Timestamp.now(),
    });
  };

  const searchEmployees = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(lowerQuery) ||
      emp.employeeId.toLowerCase().includes(lowerQuery) ||
      emp.email.toLowerCase().includes(lowerQuery) ||
      emp.mobile.includes(query)
    );
  };

  const getEmployee = (id: string) => employees.find(emp => emp.id === id);

  // ─── Walk-ins ──────────────────────────────────────────
  const addWalkIn = (walkIn: Omit<WalkIn, 'id' | 'createdAt'>) => {
    if (!hasPermission(userRole, 'create_walkin')) { toast.error('Access Denied'); return; }
    if (!validateCorporateAccess()) return;
    const { closureDate, followUpDate, ...rest } = walkIn as any;
    addDoc(collection(db, 'walkIns'), {
      ...rest,
      corporateId: activeCorporateId || '',
      createdAt: Timestamp.now(),
      closureDate: toTimestamp(closureDate),
      followUpDate: toTimestamp(followUpDate),
    });

    // Update medicine stock
    if (walkIn.medicinesDispensed) {
      walkIn.medicinesDispensed.forEach(med => {
        dispenseMedicine(med.medicineId, med.quantity);
      });
    }
  };

  // ─── Medicines ─────────────────────────────────────────
  const addMedicine = (medicine: Omit<Medicine, 'id'>) => {
    if (!hasPermission(userRole, 'update_inventory')) { toast.error('Access Denied'); return; }
    if (!validateCorporateAccess()) return;
    const { expiryDate, ...rest } = medicine as any;
    addDoc(collection(db, 'medicines'), {
      ...rest,
      corporateId: activeCorporateId || '',
      expiryDate: toTimestamp(expiryDate),
    });
  };

  const updateMedicineStock = (id: string, quantity: number) => {
    if (!hasPermission(userRole, 'update_inventory')) { toast.error('Access Denied'); return; }
    updateDoc(doc(db, 'medicines', id), { quantity });
  };

  const dispenseMedicine = (id: string, quantity: number) => {
    if (!hasPermission(userRole, 'dispense_medicine')) { toast.error('Access Denied'); return false; }
    const medicine = allMedicines.find(m => m.id === id);
    if (medicine && medicine.quantity >= quantity) {
      updateDoc(doc(db, 'medicines', id), {
        quantity: medicine.quantity - quantity,
      });
      return true;
    }
    return false;
  };

  // ─── Emergencies ───────────────────────────────────────
  const addEmergency = (emergency: Omit<Emergency, 'id' | 'createdAt'>) => {
    if (!hasPermission(userRole, 'create_walkin')) { toast.error('Access Denied'); return; }
    if (!validateCorporateAccess()) return;
    addDoc(collection(db, 'emergencies'), {
      ...emergency,
      corporateId: activeCorporateId || '',
      createdAt: Timestamp.now(),
    });
  };

  // ─── Bio Waste ─────────────────────────────────────────
  const addBioWaste = (waste: Omit<BiowWaste, 'id'>) => {
    if (!hasPermission(userRole, 'log_biowaste')) { toast.error('Access Denied'); return; }
    if (!validateCorporateAccess()) return;
    const { collectedAt, disposedAt, ...rest } = waste as any;
    addDoc(collection(db, 'bioWaste'), {
      ...rest,
      corporateId: activeCorporateId || '',
      collectedAt: toTimestamp(collectedAt) || Timestamp.now(),
      disposedAt: toTimestamp(disposedAt),
    });
  };

  // ─── Ambulance ─────────────────────────────────────────
  const addAmbulanceMovement = (movement: Omit<AmbulanceMovement, 'id'>) => {
    if (!hasPermission(userRole, 'log_ambulance')) { toast.error('Access Denied'); return; }
    if (!validateCorporateAccess()) return;
    const { departureTime, arrivalTime, ...rest } = movement as any;
    addDoc(collection(db, 'ambulanceMovements'), {
      ...rest,
      corporateId: activeCorporateId || '',
      departureTime: toTimestamp(departureTime) || Timestamp.now(),
      arrivalTime: toTimestamp(arrivalTime),
    });
  };

  // ─── Specialist Consultations ──────────────────────────
  const addSpecialistConsultation = (consultation: Omit<SpecialistConsultation, 'id' | 'createdAt'>) => {
    if (!hasPermission(userRole, 'schedule_specialist')) { toast.error('Access Denied'); return; }
    if (!validateCorporateAccess()) return;
    const { appointmentDate, ...rest } = consultation as any;
    addDoc(collection(db, 'specialistConsultations'), {
      ...rest,
      corporateId: activeCorporateId || '',
      appointmentDate: toTimestamp(appointmentDate) || Timestamp.now(),
      createdAt: Timestamp.now(),
    });
  };

  // ─── Prescriptions ────────────────────────────────────
  const addPrescription = (prescription: Omit<DigitalPrescription, 'id' | 'sentAt'>) => {
    if (!hasPermission(userRole, 'generate_prescription')) { toast.error('Access Denied: Only doctors and admins can generate prescriptions'); return; }
    if (!validateCorporateAccess()) return;
    addDoc(collection(db, 'prescriptions'), {
      ...prescription,
      corporateId: activeCorporateId || '',
      sentAt: Timestamp.now(),
    });
  };

  // ─── Stats ─────────────────────────────────────────────
  const getTodayStats = (locationId?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredWalkIns = walkIns.filter(w => {
      const walkInDate = new Date(w.createdAt);
      walkInDate.setHours(0, 0, 0, 0);
      return walkInDate.getTime() === today.getTime() && (!locationId || w.locationId === locationId);
    });

    const filteredEmergencies = emergencies.filter(e => {
      const emergencyDate = new Date(e.createdAt);
      emergencyDate.setHours(0, 0, 0, 0);
      return emergencyDate.getTime() === today.getTime() && (!locationId || e.locationId === locationId);
    });

    const filteredRegistrations = employees.filter(e => {
      const regDate = new Date(e.registeredAt);
      regDate.setHours(0, 0, 0, 0);
      return regDate.getTime() === today.getTime();
    });

    return {
      walkIns: filteredWalkIns.length,
      emergencies: filteredEmergencies.length,
      medicinesDispensed: filteredWalkIns.reduce((acc, w) => acc + (w.medicinesDispensed?.length || 0), 0),
      registrations: filteredRegistrations.length,
    };
  };

  return (
    <DataContext.Provider value={{
      employees, addEmployee, searchEmployees, getEmployee,
      walkIns, addWalkIn,
      medicines, addMedicine, updateMedicineStock, dispenseMedicine,
      emergencies, addEmergency,
      bioWaste, addBioWaste,
      ambulanceMovements, addAmbulanceMovement,
      specialistConsultations, addSpecialistConsultation,
      prescriptions, addPrescription,
      getTodayStats,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
