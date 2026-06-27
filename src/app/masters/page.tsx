'use client';

import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Handshake, Activity, Package, Calendar, Award, Briefcase, Tags, FolderKanban, MapPin, UserCheck, Link2, IndianRupee, Shield, UserCircle, IdCard, HardHat, FileSignature, ListOrdered } from 'lucide-react';
import Link from 'next/link';

const MASTER_MODULES = [
  { title: 'Users', description: 'Manage application users and roles', href: '/masters/users', icon: Users, count: 0 },
  { title: 'Years', description: 'Financial year master data', href: '/masters/years', icon: Calendar, count: 3 },
  { title: 'CSR Partners', description: 'CSR partner organisations', href: '/masters/csr-partners', icon: Handshake, count: 0 },
  { title: 'Organisations', description: 'Executing organisations', href: '/masters/organisations', icon: Building2, count: 0 },
  { title: 'Organisation Contacts', description: 'Contact persons per organisation', href: '/masters/organisation-contacts', icon: UserCircle, count: 0 },
  { title: 'Organisation Certificates', description: 'Certificate attachments per organisation', href: '/masters/organisation-certificates', icon: Award, count: 0 },
  { title: 'Organisation Employees', description: 'Employees with statutory and salary details', href: '/masters/organisation-employees', icon: IdCard, count: 0 },
  { title: 'Stakeholders', description: 'Contractors, suppliers, and service providers', href: '/masters/stakeholders', icon: Briefcase, count: 0 },
  { title: 'Stakeholder Categories', description: 'Contractor, supplier, nursery, etc.', href: '/masters/stakeholder-categories', icon: Tags, count: 0 },
  { title: 'Stakeholder Resources', description: 'Resources each stakeholder can supply', href: '/masters/stakeholder-resources', icon: Link2, count: 0 },
  { title: 'Stakeholder Supply Rates', description: 'Stakeholder-wise resource rates by project', href: '/masters/stakeholder-supply-rates', icon: IndianRupee, count: 0 },
  { title: 'Stakeholder Access Rights', description: 'Module access per stakeholder category', href: '/masters/stakeholder-access-rights', icon: Shield, count: 0 },
  { title: 'Activities', description: 'Project activity types master', href: '/masters/activities', icon: Activity, count: 12 },
  { title: 'Projects', description: 'Year-wise CSR agroforestry projects', href: '/masters/projects', icon: FolderKanban, count: 0 },
  { title: 'Project Areas', description: 'Zone, block, and plot hierarchy per project', href: '/masters/project-areas', icon: MapPin, count: 0 },
  { title: 'Project Activities', description: 'Activities planned per project and area', href: '/masters/project-activities', icon: Activity, count: 0 },
  { title: 'Project User Access', description: 'Grant users access to specific projects', href: '/masters/project-user-access', icon: UserCheck, count: 0 },
  { title: 'Activity Resource Requirements', description: 'Material planning per project activity', href: '/masters/activity-resource-requirements', icon: Package, count: 0 },
  { title: 'Contractor Allocations', description: 'Contractor assignment to project activities', href: '/masters/activity-contractor-allocations', icon: HardHat, count: 0 },
  { title: 'Work Contracts', description: 'Formal contracts with stakeholders', href: '/masters/work-contracts', icon: FileSignature, count: 0 },
  { title: 'Work Contract Items', description: 'Contract line items with rates', href: '/masters/work-contract-items', icon: ListOrdered, count: 0 },
  { title: 'Resource Categories', description: 'Material or service categories for resources', href: '/masters/resource-categories', icon: Tags, count: 7 },
  { title: 'Resources', description: 'Materials, services, and tree species', href: '/masters/resources', icon: Package, count: 13 },
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
