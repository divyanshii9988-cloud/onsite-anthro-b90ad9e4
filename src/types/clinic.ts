// Core types for the Clinic Management System

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  mobile: string;
  companyName?: string;
  department?: string;
  designation?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  registeredAt: Date;
  lastVisit?: Date;
  corporateId?: string;
}

export interface WalkIn {
  id: string;
  employeeId: string;
  employeeName: string;
  consultationType: 'doctor' | 'nurse';
  doctorName?: string;
  chiefComplaint: string;
  diagnosis?: string;
  vitals?: {
    bp?: string;
    pulse?: number;
    temperature?: number;
    weight?: number;
    spo2?: number;
  };
  medicinesDispensed?: MedicineDispensed[];
  prescription?: string;
  followUpDate?: Date;
  createdAt: Date;
  locationId: string;
  corporateId?: string;
  isEmergency?: boolean;
  incidentType?: string;
  severity?: 'minor' | 'moderate' | 'critical';
  description?: string;
  actionTaken?: string;
  ambulanceUsed?: boolean;
  ambulanceDetails?: string;
  escalatedTo?: string;
  outcome?: string;
  caseStatus?: 'open' | 'under_investigation' | 'closed';
  closureDate?: Date;
  closureRemarks?: string;
}

export interface MedicineDispensed {
  medicineId: string;
  medicineName: string;
  quantity: number;
  dosage?: string;
}

export interface Medicine {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate?: Date;
  minStock: number;
  locationId: string;
  corporateId?: string;
}

export interface Emergency {
  id: string;
  employeeId: string;
  employeeName: string;
  incidentType: string;
  severity: 'minor' | 'moderate' | 'critical';
  description: string;
  actionTaken: string;
  ambulanceUsed: boolean;
  ambulanceDetails?: string;
  escalatedTo?: string;
  outcome: string;
  createdAt: Date;
  locationId: string;
  corporateId?: string;
}

export interface BiowWaste {
  id: string;
  wasteType: 'yellow' | 'red' | 'blue' | 'white' | 'black';
  quantity: number;
  unit: 'kg' | 'bags';
  collectedBy: string;
  collectedAt: Date;
  disposedAt?: Date;
  remarks?: string;
  locationId: string;
  corporateId?: string;
}

export interface AmbulanceMovement {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
  patientName: string;
  pickupLocation: string;
  dropLocation: string;
  departureTime: Date;
  arrivalTime?: Date;
  emergencyId?: string;
  remarks?: string;
  locationId: string;
  corporateId?: string;
}

export interface SpecialistConsultation {
  id: string;
  employeeId: string;
  employeeName: string;
  speciality: string;
  specialistName: string;
  hospitalName?: string;
  appointmentDate: Date;
  referralReason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  locationId: string;
  createdAt: Date;
  corporateId?: string;
}

export interface DigitalPrescription {
  id: string;
  walkInId: string;
  employeeId: string;
  employeeName: string;
  doctorName: string;
  medicines: {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }[];
  diagnosis: string;
  advice?: string;
  sentVia: 'sms' | 'email' | 'both';
  sentTo: string;
  sentAt: Date;
  locationId: string;
  corporateId?: string;
}

export interface Corporate {
  id: string;
  name: string;
  location: string;
  address: string;
  contactPerson?: string;
  contactNumber?: string;
}

export interface Location {
  id: string;
  name: string;
  clientName: string;
  address: string;
  contactPerson?: string;
  contactNumber?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'nurse' | 'admin';
  locationId: string;
  locationName: string;
  assignedCorporates?: string[];
  selectedCorporateId?: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Only used during creation, not stored in Firestore
  mobile: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE';
  isSuperAdmin: boolean;
  assignedCorporates: string[];
  location?: string;
  createdAt: Date;
}
