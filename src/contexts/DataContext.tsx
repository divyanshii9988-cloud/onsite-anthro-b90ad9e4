import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Employee, WalkIn, Medicine, Emergency, BiowWaste, AmbulanceMovement, SpecialistConsultation, DigitalPrescription } from '@/types/clinic';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, canAccessCorporate } from '@/lib/permissions';
import { toast } from 'sonner';

interface DataContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'registeredAt'>) => Promise<boolean>;
  searchEmployees: (query: string) => Employee[];
  getEmployee: (id: string) => Employee | undefined;
  walkIns: WalkIn[];
  addWalkIn: (walkIn: Omit<WalkIn, 'id' | 'createdAt'>) => Promise<boolean>;
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

  // Fetch all data from Supabase
  const fetchAll = useCallback(async () => {
    if (!user) return;

    const [
      { data: emps },
      { data: walkins },
      { data: meds },
      { data: emergencies },
      { data: waste },
      { data: ambulance },
      { data: specialist },
      { data: prescriptions },
    ] = await Promise.all([
      supabase.from('employees').select('*'),
      supabase.from('walkin_consultations').select('*'),
      supabase.from('medicine_inventory').select('*'),
      supabase.from('emergency_cases').select('*'),
      supabase.from('biomedical_waste').select('*'),
      supabase.from('ambulance_movement').select('*'),
      supabase.from('specialist_consultations').select('*'),
      supabase.from('prescriptions').select('*'),
    ]);

    if (emps) setAllEmployees(emps.map(e => ({
      id: e.id,
      employeeId: e.employee_id,
      name: e.full_name,
      email: e.email,
      mobile: e.mobile,
      companyName: e.company_name,
      department: e.department || undefined,
      age: e.age || undefined,
      bloodGroup: e.blood_group || undefined,
      registeredAt: new Date(e.created_at || Date.now()),
    })));

    if (walkins) setAllWalkIns(walkins.map(w => ({
      id: w.id,
      employeeId: w.employee_id || '',
      employeeName: '', // Will be resolved from employees
      consultationType: (w.consultation_type as 'doctor' | 'nurse') || 'doctor',
      chiefComplaint: w.chief_complaint || '',
      diagnosis: w.diagnosis || undefined,
      vitals: {
        bp: w.bp || undefined,
        pulse: w.pulse || undefined,
        temperature: w.temp ? Number(w.temp) : undefined,
        weight: w.weight ? Number(w.weight) : undefined,
        spo2: w.spo2 ? Number(w.spo2) : undefined,
      },
      createdAt: new Date(w.created_at || Date.now()),
      locationId: '',
      isEmergency: w.is_emergency || false,
    })));

    if (meds) setAllMedicines(meds.map(m => ({
      id: m.id,
      name: m.medicine_name,
      sku: m.sku,
      brand: m.brand || '',
      category: m.category || '',
      quantity: m.quantity,
      totalQuantity: m.quantity,
      unit: m.unit || '',
      expiryDate: m.expiry_date ? new Date(m.expiry_date) : undefined,
      minStock: m.min_stock_level || 5,
      locationId: '',
      itemType: (m as any).item_type || 'medicine',
      form: (m as any).form || undefined,
      strength: (m as any).strength || undefined,
    })));

    if (emergencies) setAllEmergencies(emergencies.map(e => ({
      id: e.id,
      employeeId: e.walkin_id || '',
      employeeName: '',
      incidentType: e.incident_type || '',
      severity: (e.severity as 'minor' | 'moderate' | 'critical') || 'moderate',
      description: e.incident_description || '',
      actionTaken: e.action_taken || '',
      ambulanceUsed: e.ambulance_used || false,
      escalatedTo: e.escalated_to || undefined,
      outcome: e.case_status || '',
      createdAt: new Date(e.created_at || Date.now()),
      locationId: '',
    })));

    if (waste) setAllBioWaste(waste.map(w => ({
      id: w.id,
      wasteType: (w.waste_type as 'yellow' | 'red' | 'blue' | 'white' | 'black') || 'yellow',
      quantity: Number(w.quantity) || 0,
      unit: (w.unit as 'kg' | 'grams' | 'bags') || 'kg',
      collectedBy: w.collected_by || '',
      collectedAt: new Date(w.created_at || Date.now()),
      remarks: w.remarks || undefined,
      locationId: '',
    })));

    if (ambulance) setAllAmbulanceMovements(ambulance.map(a => ({
      id: a.id,
      vehicleNumber: a.vehicle_number,
      driverName: a.driver_name || '',
      driverContact: a.driver_contact || '',
      patientName: a.patient_name,
      pickupLocation: a.pickup_location,
      dropLocation: a.drop_location,
      departureTime: new Date(a.created_at || Date.now()),
      reasonOfTransfer: a.remarks || '',
      locationId: '',
    })));

    if (specialist) setAllSpecialistConsultations(specialist.map(s => ({
      id: s.id,
      employeeId: s.employee_id || '',
      employeeName: '',
      speciality: s.speciality || '',
      specialistName: s.specialist_name,
      hospitalName: s.hospital_clinic || undefined,
      appointmentDate: new Date(s.appointment_date),
      referralReason: s.referral_reason || '',
      status: 'scheduled' as const,
      notes: s.notes || undefined,
      locationId: '',
      createdAt: new Date(s.created_at || Date.now()),
    })));

    if (prescriptions) setAllPrescriptions(prescriptions.map(p => ({
      id: p.id,
      walkInId: p.walkin_id || '',
      employeeId: p.patient_id || '',
      employeeName: '',
      doctorName: '',
      medicines: (() => {
        try { return JSON.parse(p.medicines); } catch { return [{ name: p.medicines, dosage: '', duration: '' }]; }
      })(),
      diagnosis: p.diagnosis,
      advice: p.advice || undefined,
      sentVia: (p.send_via as 'sms' | 'email' | 'both') || 'email',
      sentTo: '',
      sentAt: new Date(p.sent_at || Date.now()),
      locationId: '',
    })));
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // No corporate filtering needed since Supabase tables don't have corporateId
  const employees = allEmployees;
  const walkIns = allWalkIns;
  const medicines = allMedicines;
  const emergencies = allEmergencies;
  const bioWaste = allBioWaste;
  const ambulanceMovements = allAmbulanceMovements;
  const specialistConsultations = allSpecialistConsultations;
  const prescriptions = allPrescriptions;

  // ─── Employees ─────────────────────────────────────────
  const addEmployee = async (employee: Omit<Employee, 'id' | 'registeredAt'>): Promise<boolean> => {
    if (!hasPermission(userRole, 'register_employee')) { toast.error('Access Denied'); return false; }

    const { error } = await supabase.from('employees').insert({
      employee_id: employee.employeeId,
      full_name: employee.name,
      email: employee.email,
      mobile: employee.mobile,
      company_name: employee.companyName || '',
      department: employee.department || null,
      age: employee.age || null,
      blood_group: employee.bloodGroup || null,
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to save employee: ' + error.message);
      return false;
    }

    await fetchAll();
    return true;
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
  const addWalkIn = async (walkIn: Omit<WalkIn, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!hasPermission(userRole, 'create_walkin')) { toast.error('Access Denied'); return false; }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || null;

    const insertPayload: any = {
      employee_id: walkIn.employeeId || null,
      consultation_type: walkIn.consultationType,
      chief_complaint: walkIn.chiefComplaint,
      diagnosis: walkIn.diagnosis || null,
      bp: walkIn.vitals?.bp || null,
      pulse: walkIn.vitals?.pulse && !isNaN(Number(walkIn.vitals.pulse)) ? Number(walkIn.vitals.pulse) : null,
      temp: walkIn.vitals?.temperature && !isNaN(Number(walkIn.vitals.temperature)) ? Number(walkIn.vitals.temperature) : null,
      weight: walkIn.vitals?.weight && !isNaN(Number(walkIn.vitals.weight)) ? Number(walkIn.vitals.weight) : null,
      spo2: walkIn.vitals?.spo2 && !isNaN(Number(walkIn.vitals.spo2)) ? Number(walkIn.vitals.spo2) : null,
      is_emergency: walkIn.isEmergency || false,
      created_by: userId,
    };

    const { data: walkinData, error } = await supabase.from('walkin_consultations').insert(insertPayload).select().single();

    if (error) { toast.error('Failed to save walk-in: ' + error.message); return false; }

    // If emergency, also create emergency_cases entry
    if (walkIn.isEmergency && walkinData) {
      await supabase.from('emergency_cases').insert({
        walkin_id: walkinData.id,
        incident_type: walkIn.incidentType || '',
        severity: walkIn.severity || 'moderate',
        incident_description: walkIn.description || '',
        action_taken: walkIn.actionTaken || '',
        ambulance_used: walkIn.ambulanceUsed || false,
        escalated_to: walkIn.escalatedTo || null,
        case_status: walkIn.caseStatus || 'open',
      });
    }

    await fetchAll();
    return true;
  };

  // ─── Medicines ─────────────────────────────────────────
  const addMedicine = async (medicine: Omit<Medicine, 'id'>) => {
    if (!hasPermission(userRole, 'update_inventory')) { toast.error('Access Denied'); return; }

    const { error } = await supabase.from('medicine_inventory').insert({
      medicine_name: medicine.name,
      sku: medicine.sku,
      brand: medicine.brand || null,
      category: medicine.category || null,
      quantity: medicine.quantity,
      unit: medicine.unit || null,
      min_stock_level: medicine.minStock || 5,
      expiry_date: medicine.expiryDate ? medicine.expiryDate.toISOString().split('T')[0] : null,
    });
    if (error) { toast.error('Failed to add medicine: ' + error.message); return; }
    fetchAll();
  };

  const updateMedicineStock = async (id: string, quantity: number) => {
    if (!hasPermission(userRole, 'update_inventory')) { toast.error('Access Denied'); return; }
    const { error } = await supabase.from('medicine_inventory').update({ quantity }).eq('id', id);
    if (error) { toast.error('Failed to update stock: ' + error.message); return; }
    fetchAll();
  };

  const dispenseMedicine = (id: string, quantity: number) => {
    if (!hasPermission(userRole, 'dispense_medicine')) { toast.error('Access Denied'); return false; }
    const medicine = allMedicines.find(m => m.id === id);
    if (medicine && medicine.quantity >= quantity) {
      supabase.from('medicine_inventory').update({ quantity: medicine.quantity - quantity }).eq('id', id)
        .then(() => fetchAll());
      return true;
    }
    return false;
  };

  // ─── Emergencies ───────────────────────────────────────
  const addEmergency = async (emergency: Omit<Emergency, 'id' | 'createdAt'>) => {
    if (!hasPermission(userRole, 'create_walkin')) { toast.error('Access Denied'); return; }

    const { error } = await supabase.from('emergency_cases').insert({
      incident_type: emergency.incidentType,
      severity: emergency.severity,
      incident_description: emergency.description,
      action_taken: emergency.actionTaken,
      ambulance_used: emergency.ambulanceUsed,
      escalated_to: emergency.escalatedTo || null,
      case_status: 'open',
    });
    if (error) { toast.error('Failed to log emergency: ' + error.message); return; }
    fetchAll();
  };

  // ─── Bio Waste ─────────────────────────────────────────
  const addBioWaste = async (waste: Omit<BiowWaste, 'id'>) => {
    if (!hasPermission(userRole, 'log_biowaste')) { toast.error('Access Denied'); return; }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || null;

    const { error } = await supabase.from('biomedical_waste').insert({
      waste_type: waste.wasteType,
      quantity: waste.quantity,
      unit: waste.unit,
      collected_by: waste.collectedBy,
      remarks: waste.remarks || null,
      logged_by: userId,
    });
    if (error) { toast.error('Failed to log waste: ' + error.message); return; }
    fetchAll();
  };

  // ─── Ambulance ─────────────────────────────────────────
  const addAmbulanceMovement = async (movement: Omit<AmbulanceMovement, 'id'>) => {
    if (!hasPermission(userRole, 'log_ambulance')) { toast.error('Access Denied'); return; }

    const { error } = await supabase.from('ambulance_movement').insert({
      vehicle_number: movement.vehicleNumber,
      driver_name: movement.driverName || null,
      driver_contact: movement.driverContact || null,
      patient_name: movement.patientName,
      pickup_location: movement.pickupLocation,
      drop_location: movement.dropLocation,
      remarks: movement.reasonOfTransfer || null,
    });
    if (error) { toast.error('Failed to log ambulance: ' + error.message); return; }
    fetchAll();
  };

  // ─── Specialist Consultations ──────────────────────────
  const addSpecialistConsultation = async (consultation: Omit<SpecialistConsultation, 'id' | 'createdAt'>) => {
    if (!hasPermission(userRole, 'schedule_specialist')) { toast.error('Access Denied'); return; }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || null;

    const { error } = await supabase.from('specialist_consultations').insert({
      employee_id: consultation.employeeId || null,
      speciality: consultation.speciality || null,
      specialist_name: consultation.specialistName,
      hospital_clinic: consultation.hospitalName || null,
      appointment_date: consultation.appointmentDate.toISOString().split('T')[0],
      referral_reason: consultation.referralReason || null,
      notes: consultation.notes || null,
      created_by: userId,
    });
    if (error) { toast.error('Failed to schedule consultation: ' + error.message); return; }
    fetchAll();
  };

  // ─── Prescriptions ────────────────────────────────────
  const addPrescription = async (prescription: Omit<DigitalPrescription, 'id' | 'sentAt'>) => {
    if (!hasPermission(userRole, 'generate_prescription')) { toast.error('Access Denied'); return; }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || null;

    const { error } = await supabase.from('prescriptions').insert({
      walkin_id: prescription.walkInId || null,
      patient_id: prescription.employeeId || null,
      diagnosis: prescription.diagnosis,
      medicines: JSON.stringify(prescription.medicines),
      advice: prescription.advice || null,
      send_via: prescription.sentVia || null,
      created_by: userId,
    });
    if (error) { toast.error('Failed to create prescription: ' + error.message); return; }
    fetchAll();
  };

  // ─── Stats ─────────────────────────────────────────────
  const getTodayStats = (locationId?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredWalkIns = walkIns.filter(w => {
      const walkInDate = new Date(w.createdAt);
      walkInDate.setHours(0, 0, 0, 0);
      return walkInDate.getTime() === today.getTime();
    });

    const filteredEmergencies = emergencies.filter(e => {
      const emergencyDate = new Date(e.createdAt);
      emergencyDate.setHours(0, 0, 0, 0);
      return emergencyDate.getTime() === today.getTime();
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
