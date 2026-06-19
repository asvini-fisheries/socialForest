'use client';

import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Handshake, Activity, Package, Calendar, Award, Briefcase } from 'lucide-react';
import Link from 'next/link';

const MASTER_MODULES = [
  { title: 'Users', description: 'Manage application users and roles', href: '/masters/users', icon: Users, count: 0 },
  { title: 'Years', description: 'Financial year master data', href: '/masters/years', icon: Calendar, count: 3 },
  { title: 'CSR Partners', description: 'CSR partner organisations', href: '/masters/csr-partners', icon: Handshake, count: 0 },
  { title: 'Organisations', description: 'Executing organisations with contacts & certificates', href: '/masters/organisations', icon: Building2, count: 0 },
  { title: 'Stakeholders', description: 'Contractors, suppliers, and service providers', href: '/masters/stakeholders', icon: Briefcase, count: 0 },
  { title: 'Activities', description: 'Project activity types master', href: '/masters/activities', icon: Activity, count: 12 },
  { title: 'Resources', description: 'Materials and tree species master', href: '/masters/resources', icon: Package, count: 13 },
  { title: 'Designations', description: 'Employee designation master', href: '/masters/designations', icon: Users, count: 8 },
  { title: 'Certificates', description: 'Certificate types master', href: '/masters/certificates', icon: Award, count: 7 },
];

export default function MastersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
            <p className="text-gray-500 mt-1">Manage all master data configurations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MASTER_MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <mod.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-300">{mod.count}</span>
                  </div>
                  <CardTitle className="text-base mt-3">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{mod.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
