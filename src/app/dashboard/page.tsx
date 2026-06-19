'use client';

import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  TreePine,
  IndianRupee,
  Users,
  Activity,
  Receipt,
  TrendingUp,
  MapPin,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, selectedProject, selectedYear } = useAuth();

  const stats = [
    {
      label: 'Trees Planned',
      value: formatNumber(selectedProject?.total_trees_planned || 0),
      icon: TreePine,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Land Area (Acres)',
      value: selectedProject?.total_land_area_acres?.toFixed(2) || '0',
      icon: MapPin,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Budget',
      value: formatCurrency(selectedProject?.budget_amount || 0),
      icon: IndianRupee,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Project Status',
      value: selectedProject?.status?.replace('_', ' ').toUpperCase() || 'N/A',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {selectedProject?.name} — {selectedYear?.year_label}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent activities recorded</p>
                <p className="text-sm mt-1">Activities will appear here once work begins</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                Pending Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending bills</p>
                <p className="text-sm mt-1">Bills will be generated from daily activity entries</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Create User', href: '/masters/users' },
                  { label: 'New Project', href: '/projects/new' },
                  { label: 'Add Stakeholder', href: '/masters/stakeholders' },
                  { label: 'View Reports', href: '/reports' },
                ].map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className="p-4 text-center rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-700">{action.label}</p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
