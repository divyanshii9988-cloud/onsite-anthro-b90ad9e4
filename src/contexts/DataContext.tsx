import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Employee, WalkIn, Medicine, Emergency, BiowWaste, AmbulanceMovement, SpecialistConsultation, DigitalPrescription } from '@/types/clinic';

interface DataContextType {
  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'registeredAt'>) => Employee;
  searchEmployees: (query: string) => Employee[];
  getEmployee: (id: string) => Employee | undefined;
  
  // Walk-ins
  walkIns: WalkIn[];
  addWalkIn: (walkIn: Omit<WalkIn, 'id' | 'createdAt'>) => WalkIn;
  
  // Medicines
  medicines: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Medicine;
  updateMedicineStock: (id: string, quantity: number) => void;
  dispenseMedicine: (id: string, quantity: number) => boolean;
  
  // Emergencies
  emergencies: Emergency[];
  addEmergency: (emergency: Omit<Emergency, 'id' | 'createdAt'>) => Emergency;
  
  // Biomedical Waste
  bioWaste: BiowWaste[];
  addBioWaste: (waste: Omit<BiowWaste, 'id'>) => BiowWaste;
  
  // Ambulance
  ambulanceMovements: AmbulanceMovement[];
  addAmbulanceMovement: (movement: Omit<AmbulanceMovement, 'id'>) => AmbulanceMovement;
  
  // Specialist Consultations
  specialistConsultations: SpecialistConsultation[];
  addSpecialistConsultation: (consultation: Omit<SpecialistConsultation, 'id' | 'createdAt'>) => SpecialistConsultation;
  
  // Digital Prescriptions
  prescriptions: DigitalPrescription[];
  addPrescription: (prescription: Omit<DigitalPrescription, 'id' | 'sentAt'>) => DigitalPrescription;
  
  // Stats
  getTodayStats: (locationId?: string) => {
    walkIns: number;
    emergencies: number;
    medicinesDispensed: number;
    registrations: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Sample data
const initialEmployees: Employee[] = [
  { id: 'emp1', employeeId: 'INF001', name: 'Rahul Kumar', email: 'rahul.kumar@infosys.com', mobile: '9876543210', department: 'Engineering', designation: 'Senior Developer', age: 32, gender: 'male', bloodGroup: 'B+', registeredAt: new Date('2024-01-15') },
  { id: 'emp2', employeeId: 'INF002', name: 'Sneha Reddy', email: 'sneha.r@infosys.com', mobile: '9876543211', department: 'HR', designation: 'HR Manager', age: 28, gender: 'female', bloodGroup: 'O+', registeredAt: new Date('2024-02-20') },
  { id: 'emp3', employeeId: 'INF003', name: 'Amit Patel', email: 'amit.patel@infosys.com', mobile: '9876543212', department: 'Finance', designation: 'Accountant', age: 35, gender: 'male', bloodGroup: 'A+', registeredAt: new Date('2024-03-10') },
];

const initialMedicines: Medicine[] = [
  { id: 'med1', name: 'Paracetamol 500mg', sku: 'PAR500', brand: 'Crocin', category: 'Analgesic', quantity: 500, unit: 'tablets', minStock: 100, locationId: 'loc1' },
  { id: 'med2', name: 'Cetirizine 10mg', sku: 'CET10', brand: 'Zyrtec', category: 'Antihistamine', quantity: 200, unit: 'tablets', minStock: 50, locationId: 'loc1' },
  { id: 'med3', name: 'Omeprazole 20mg', sku: 'OME20', brand: 'Prilosec', category: 'Antacid', quantity: 150, unit: 'capsules', minStock: 30, locationId: 'loc1' },
  { id: 'med4', name: 'Bandage Roll', sku: 'BND01', brand: 'Dettol', category: 'First Aid', quantity: 50, unit: 'rolls', minStock: 20, locationId: 'loc1' },
  { id: 'med5', name: 'ORS Sachet', sku: 'ORS01', brand: 'Electral', category: 'Electrolyte', quantity: 100, unit: 'sachets', minStock: 25, locationId: 'loc1' },
];

const initialWalkIns: WalkIn[] = [
  { 
    id: 'wi1', 
    employeeId: 'emp1', 
    employeeName: 'Rahul Kumar', 
    consultationType: 'doctor', 
    doctorName: 'Dr. Priya Sharma',
    chiefComplaint: 'Headache and fever',
    diagnosis: 'Viral fever',
    vitals: { bp: '120/80', pulse: 78, temperature: 99.5, spo2: 98 },
    medicinesDispensed: [{ medicineId: 'med1', medicineName: 'Paracetamol 500mg', quantity: 10, dosage: '1 tablet thrice daily' }],
    createdAt: new Date(),
    locationId: 'loc1'
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [walkIns, setWalkIns] = useState<WalkIn[]>(initialWalkIns);
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [bioWaste, setBioWaste] = useState<BiowWaste[]>([]);
  const [ambulanceMovements, setAmbulanceMovements] = useState<AmbulanceMovement[]>([]);
  const [specialistConsultations, setSpecialistConsultations] = useState<SpecialistConsultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<DigitalPrescription[]>([]);

  const addEmployee = (employee: Omit<Employee, 'id' | 'registeredAt'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: generateId(),
      registeredAt: new Date(),
    };
    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
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

  const addWalkIn = (walkIn: Omit<WalkIn, 'id' | 'createdAt'>) => {
    const newWalkIn: WalkIn = {
      ...walkIn,
      id: generateId(),
      createdAt: new Date(),
    };
    setWalkIns(prev => [...prev, newWalkIn]);
    
    // Update medicine stock
    if (walkIn.medicinesDispensed) {
      walkIn.medicinesDispensed.forEach(med => {
        dispenseMedicine(med.medicineId, med.quantity);
      });
    }
    
    return newWalkIn;
  };

  const addMedicine = (medicine: Omit<Medicine, 'id'>) => {
    const newMedicine: Medicine = {
      ...medicine,
      id: generateId(),
    };
    setMedicines(prev => [...prev, newMedicine]);
    return newMedicine;
  };

  const updateMedicineStock = (id: string, quantity: number) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, quantity } : med
    ));
  };

  const dispenseMedicine = (id: string, quantity: number) => {
    const medicine = medicines.find(m => m.id === id);
    if (medicine && medicine.quantity >= quantity) {
      setMedicines(prev => prev.map(med => 
        med.id === id ? { ...med, quantity: med.quantity - quantity } : med
      ));
      return true;
    }
    return false;
  };

  const addEmergency = (emergency: Omit<Emergency, 'id' | 'createdAt'>) => {
    const newEmergency: Emergency = {
      ...emergency,
      id: generateId(),
      createdAt: new Date(),
    };
    setEmergencies(prev => [...prev, newEmergency]);
    return newEmergency;
  };

  const addBioWaste = (waste: Omit<BiowWaste, 'id'>) => {
    const newWaste: BiowWaste = {
      ...waste,
      id: generateId(),
    };
    setBioWaste(prev => [...prev, newWaste]);
    return newWaste;
  };

  const addAmbulanceMovement = (movement: Omit<AmbulanceMovement, 'id'>) => {
    const newMovement: AmbulanceMovement = {
      ...movement,
      id: generateId(),
    };
    setAmbulanceMovements(prev => [...prev, newMovement]);
    return newMovement;
  };

  const addSpecialistConsultation = (consultation: Omit<SpecialistConsultation, 'id' | 'createdAt'>) => {
    const newConsultation: SpecialistConsultation = {
      ...consultation,
      id: generateId(),
      createdAt: new Date(),
    };
    setSpecialistConsultations(prev => [...prev, newConsultation]);
    return newConsultation;
  };

  const addPrescription = (prescription: Omit<DigitalPrescription, 'id' | 'sentAt'>) => {
    const newPrescription: DigitalPrescription = {
      ...prescription,
      id: generateId(),
      sentAt: new Date(),
    };
    setPrescriptions(prev => [...prev, newPrescription]);
    return newPrescription;
  };

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
      employees,
      addEmployee,
      searchEmployees,
      getEmployee,
      walkIns,
      addWalkIn,
      medicines,
      addMedicine,
      updateMedicineStock,
      dispenseMedicine,
      emergencies,
      addEmergency,
      bioWaste,
      addBioWaste,
      ambulanceMovements,
      addAmbulanceMovement,
      specialistConsultations,
      addSpecialistConsultation,
      prescriptions,
      addPrescription,
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
