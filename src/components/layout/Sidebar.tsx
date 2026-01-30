import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  Stethoscope, 
  Pill, 
  Package, 
  Trash2, 
  Truck, 
  UserCheck, 
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';


const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Employee Registration', icon: UserPlus },
  { path: '/walk-ins', label: 'Daily Walk-ins', icon: Stethoscope },
  { path: '/medicines', label: 'Medicine Dispensation', icon: Pill },
  { path: '/inventory', label: 'Medicine Inventory', icon: Package },
  { path: '/biowaste', label: 'Bio-Medical Waste', icon: Trash2 },
  { path: '/ambulance', label: 'Ambulance Movement', icon: Truck },
  { path: '/specialist', label: 'Specialist Consultation', icon: UserCheck },
  { path: '/prescriptions', label: 'Digital Prescription', icon: FileText },
];

const adminItems = [
  { path: '/admin-users', label: 'Manage Users', icon: Users },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  const isAdmin = user?.role === 'admin';

  return (
    <aside className={cn(
      "h-screen gradient-sidebar flex flex-col transition-all duration-300 sticky top-0",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <h1 className="text-sidebar-foreground font-bold text-lg">
              Medical Room
            </h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item",
                isActive && "nav-item-active"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider px-3">
                  Administration
                </p>
              </div>
            )}
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "nav-item",
                    isActive && "nav-item-active"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info & Logout */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-sidebar-accent">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-muted truncate capitalize">{user.role}</p>
          </div>
        )}
        
        <button
          onClick={logout}
          className="nav-item w-full text-left hover:bg-destructive/20 hover:text-destructive"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
