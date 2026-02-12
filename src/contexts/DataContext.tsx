import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, WalkIn, Medicine, Emergency, BiowWaste, AmbulanceMovement, SpecialistConsultation, DigitalPrescription } from '@/types/clinic';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, updateDoc, doc, onSnapshot, Timestamp,
} from 'firebase/firestore';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [bioWaste, setBioWaste] = useState<BiowWaste[]>([]);
  const [ambulanceMovements, setAmbulanceMovements] = useState<AmbulanceMovement[]>([]);
  const [specialistConsultations, setSpecialistConsultations] = useState<SpecialistConsultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<DigitalPrescription[]>([]);

  // Firestore real-time listeners
  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'employees'), (snap) => {
        setEmployees(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Employee)));
      }),
      onSnapshot(collection(db, 'walkIns'), (snap) => {
        setWalkIns(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as WalkIn)));
      }),
      onSnapshot(collection(db, 'medicines'), (snap) => {
        setMedicines(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Medicine)));
      }),
      onSnapshot(collection(db, 'emergencies'), (snap) => {
        setEmergencies(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Emergency)));
      }),
      onSnapshot(collection(db, 'bioWaste'), (snap) => {
        setBioWaste(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as BiowWaste)));
      }),
      onSnapshot(collection(db, 'ambulanceMovements'), (snap) => {
        setAmbulanceMovements(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as AmbulanceMovement)));
      }),
      onSnapshot(collection(db, 'specialistConsultations'), (snap) => {
        setSpecialistConsultations(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as SpecialistConsultation)));
      }),
      onSnapshot(collection(db, 'prescriptions'), (snap) => {
        setPrescriptions(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as DigitalPrescription)));
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // ─── Employees ─────────────────────────────────────────
  const addEmployee = (employee: Omit<Employee, 'id' | 'registeredAt'>) => {
    addDoc(collection(db, 'employees'), {
      ...employee,
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
    const { closureDate, followUpDate, ...rest } = walkIn as any;
    addDoc(collection(db, 'walkIns'), {
      ...rest,
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
    const { expiryDate, ...rest } = medicine as any;
    addDoc(collection(db, 'medicines'), {
      ...rest,
      expiryDate: toTimestamp(expiryDate),
    });
  };

  const updateMedicineStock = (id: string, quantity: number) => {
    updateDoc(doc(db, 'medicines', id), { quantity });
  };

  const dispenseMedicine = (id: string, quantity: number) => {
    const medicine = medicines.find(m => m.id === id);
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
    addDoc(collection(db, 'emergencies'), {
      ...emergency,
      createdAt: Timestamp.now(),
    });
  };

  // ─── Bio Waste ─────────────────────────────────────────
  const addBioWaste = (waste: Omit<BiowWaste, 'id'>) => {
    const { collectedAt, disposedAt, ...rest } = waste as any;
    addDoc(collection(db, 'bioWaste'), {
      ...rest,
      collectedAt: toTimestamp(collectedAt) || Timestamp.now(),
      disposedAt: toTimestamp(disposedAt),
    });
  };

  // ─── Ambulance ─────────────────────────────────────────
  const addAmbulanceMovement = (movement: Omit<AmbulanceMovement, 'id'>) => {
    const { departureTime, arrivalTime, ...rest } = movement as any;
    addDoc(collection(db, 'ambulanceMovements'), {
      ...rest,
      departureTime: toTimestamp(departureTime) || Timestamp.now(),
      arrivalTime: toTimestamp(arrivalTime),
    });
  };

  // ─── Specialist Consultations ──────────────────────────
  const addSpecialistConsultation = (consultation: Omit<SpecialistConsultation, 'id' | 'createdAt'>) => {
    const { appointmentDate, ...rest } = consultation as any;
    addDoc(collection(db, 'specialistConsultations'), {
      ...rest,
      appointmentDate: toTimestamp(appointmentDate) || Timestamp.now(),
      createdAt: Timestamp.now(),
    });
  };

  // ─── Prescriptions ────────────────────────────────────
  const addPrescription = (prescription: Omit<DigitalPrescription, 'id' | 'sentAt'>) => {
    addDoc(collection(db, 'prescriptions'), {
      ...prescription,
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
