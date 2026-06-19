'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import {
  BarChart3,
  ClipboardList,
  FileText,
  TreePine,
  IndianRupee,
  Users,
  Sprout,
} from 'lucide-react';

const REPORT_SECTIONS = [
  {
    title: 'Project Reports',
    items: [
      { label: 'Project Progress', href: '/dashboard', icon: BarChart3, desc: 'Budget, trees, activities overview' },
      { label: 'Tree Census Report', href: '/census', icon: TreePine, desc: 'Health status by area' },
      { label: 'Nursery Stock Report', href: '/nursery', icon: Sprout, desc: 'Inward, issue, and balance' },
    ],
  },
  {
    title: 'Financial Reports',
    items: [
      { label: 'Stakeholder Bills', href: '/bills', icon: FileText, desc: 'Bills by period' },
      { label: 'Contractor Invoices', href: '/invoices', icon: FileText, desc: 'Invoices to CSR' },
      { label: 'Payments', href: '/payments', icon: IndianRupee, desc: 'Payment history' },
      { label: 'Expenses', href: '/expenses', icon: IndianRupee, desc: 'Contractor expense report' },
    ],
  },
  {
    title: 'HR & Statutory',
    items: [
      { label: 'Daily Attendance', href: '/attendance', icon: ClipboardList, desc: 'Employee attendance sheets' },
      { label: 'Employee Reports', href: '/reports', icon: Users, desc: 'Salary & statutory sheets (coming soon)' },
    ],
  },
  {
    title: 'ESG',
    items: [
      { label: 'ESG Report', href: '/reports', icon: BarChart3, desc: 'Periodic ESG report to CSR partner (coming soon)' },
    ],
  },
];

export default function ReportsPage() {
  const { selectedProject, selectedYear } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">
            {selectedProject?.name} — {selectedYear?.year_label}
          </p>
        </div>

        {REPORT_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <Link key={item.label} href={item.href}>
                  <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-emerald-600" />
                        {item.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
