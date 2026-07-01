'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import {
  TreePine,
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  Handshake,
  Activity,
  Package,
  Receipt,
  CreditCard,
  FileText,
  Sprout,
  BarChart3,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Wrench,
  Tags,
  MapPin,
  UserCheck,
  Link2,
  IndianRupee,
  Shield,
  UserCircle,
  IdCard,
  HardHat,
  FileSignature,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { AppHeader } from '@/components/layout/app-header';
import { ROLE_LABELS, MODULE_ACCESS, type UserRole } from '@/types/database';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { label: 'Projects', href: '/projects', icon: FolderKanban, module: 'projects' },
  { label: 'Daily Activities', href: '/daily-activities', icon: Activity, module: 'daily_activities' },
  { label: 'Attendance', href: '/attendance', icon: ClipboardList, module: 'attendance' },
  { label: 'Attendance Details', href: '/attendance/details', icon: ClipboardList, module: 'attendance' },
  { label: 'Bills', href: '/bills', icon: Receipt, module: 'bills' },
  { label: 'Unbilled Activities', href: '/bills/unbilled', icon: ClipboardList, module: 'bills' },
  { label: 'Invoices', href: '/invoices', icon: FileText, module: 'invoices' },
  { label: 'Payments', href: '/payments', icon: CreditCard, module: 'payments' },
  { label: 'Expenses', href: '/expenses', icon: Receipt, module: 'expenses' },
  { label: 'Nursery', href: '/nursery', icon: Sprout, module: 'nursery' },
  { label: 'Tree Census', href: '/census', icon: TreePine, module: 'census' },
  { label: 'Tools Stock', href: '/tools-stock', icon: Wrench, module: 'tools_stock' },
  { label: 'Reports', href: '/reports', icon: BarChart3, module: 'reports' },
  { label: 'Masters', href: '/masters', icon: Settings, module: 'masters', roles: ['admin'] },
];

const MASTER_SUB_ITEMS = [
  { label: 'Users', href: '/masters/users', icon: Users },
  { label: 'Years', href: '/masters/years', icon: FolderKanban },
  { label: 'CSR Partners', href: '/masters/csr-partners', icon: Handshake },
  { label: 'Organisations', href: '/masters/organisations', icon: Building2 },
  { label: 'Org Contacts', href: '/masters/organisation-contacts', icon: UserCircle },
  { label: 'Org Certificates', href: '/masters/organisation-certificates', icon: Award },
  { label: 'Org Employees', href: '/masters/organisation-employees', icon: IdCard },
  { label: 'Stakeholders', href: '/masters/stakeholders', icon: Users },
  { label: 'Stakeholder Categories', href: '/masters/stakeholder-categories', icon: Tags },
  { label: 'Stakeholder Resources', href: '/masters/stakeholder-resources', icon: Link2 },
  { label: 'Supply Rates', href: '/masters/stakeholder-supply-rates', icon: IndianRupee },
  { label: 'Access Rights', href: '/masters/stakeholder-access-rights', icon: Shield },
  { label: 'Activities', href: '/masters/activities', icon: Activity },
  { label: 'Projects', href: '/masters/projects', icon: FolderKanban },
  { label: 'Project Areas', href: '/masters/project-areas', icon: MapPin },
  { label: 'Project Activities', href: '/masters/project-activities', icon: Activity },
  { label: 'Project User Access', href: '/masters/project-user-access', icon: UserCheck },
  { label: 'Resource Requirements', href: '/masters/activity-resource-requirements', icon: Package },
  { label: 'Contractor Allocations', href: '/masters/activity-contractor-allocations', icon: HardHat },
  { label: 'Work Contracts', href: '/masters/work-contracts', icon: FileSignature },
  { label: 'Contract Items', href: '/masters/work-contract-items', icon: ListOrdered },
  { label: 'Resource Categories', href: '/masters/resource-categories', icon: Tags },
  { label: 'Resources', href: '/masters/resources', icon: Package },
  { label: 'Designations', href: '/masters/designations', icon: ClipboardList },
  { label: 'Certificates', href: '/masters/certificates', icon: FileText },
];

function canAccessModule(role: UserRole, module: string): boolean {
  const access = MODULE_ACCESS[role];
  return access.includes('*') || access.includes(module);
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();
    router.push('/');
  }

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (!user) return false;
    if (item.roles && !item.roles.includes(user.role)) return false;
    return canAccessModule(user.role, item.module);
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <Logo size="sm" className="w-full max-w-[160px]" />
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        {user?.role === 'admin' && pathname.startsWith('/masters') && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Master Data</p>
            {MASTER_SUB_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        {user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        {sidebarContent}
      </aside>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:pl-64">
        <AppHeader />
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
