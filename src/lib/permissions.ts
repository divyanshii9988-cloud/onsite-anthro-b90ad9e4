// Role-based permission system
// Hierarchy: Admin > Doctor > Nurse

export type UserRole = 'admin' | 'doctor' | 'nurse';

export type Permission =
  | 'create_users'
  | 'download_mis'
  | 'view_all_corporates'
  | 'generate_prescription'
  | 'register_employee'
  | 'create_walkin'
  | 'update_inventory'
  | 'dispense_medicine'
  | 'log_biowaste'
  | 'log_ambulance'
  | 'schedule_specialist'
  | 'manage_corporates';

const rolePermissions: Record<UserRole, Permission[]> = {
  nurse: [
    'register_employee',
    'create_walkin',
    'update_inventory',
    'dispense_medicine',
    'log_biowaste',
    'log_ambulance',
    'schedule_specialist',
  ],
  doctor: [
    // Doctor inherits all Nurse permissions + extras
    'register_employee',
    'create_walkin',
    'update_inventory',
    'dispense_medicine',
    'log_biowaste',
    'log_ambulance',
    'schedule_specialist',
    'generate_prescription',
  ],
  admin: [
    // Admin has all permissions
    'register_employee',
    'create_walkin',
    'update_inventory',
    'dispense_medicine',
    'log_biowaste',
    'log_ambulance',
    'schedule_specialist',
    'generate_prescription',
    'create_users',
    'download_mis',
    'view_all_corporates',
    'manage_corporates',
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some(p => hasPermission(role, p));
}

// Check if user can access a specific corporate
export function canAccessCorporate(
  role: UserRole | undefined,
  assignedCorporates: string[] | undefined,
  corporateId: string
): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  return assignedCorporates?.includes(corporateId) ?? false;
}
