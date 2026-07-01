'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { AttendanceStatus, OrganisationEmployee } from '@/types/database';
import { ClipboardList, Loader2, Save, Users } from 'lucide-react';

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
  { value: 'holiday', label: 'Holiday' },
];

type EmployeeAttendance = {
  employee: OrganisationEmployee;
  status: AttendanceStatus;
  recordId?: string;
};

export default function AttendancePage() {
  const { user, selectedProject } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAttendance = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const supabase = createClient();

    const { data: employees, error: empError } = await supabase
      .from('organisation_employees')
      .select('*')
      .eq('organisation_id', selectedProject.organisation_id)
      .eq('is_active', true)
      .order('full_name');

    if (empError) {
      setError(empError.message);
      setLoading(false);
      return;
    }

    const { data: records } = await supabase
      .from('daily_attendance')
      .select('*')
      .eq('project_id', selectedProject.id)
      .eq('attendance_date', date);

    const recordMap = new Map(records?.map((r) => [r.employee_id, r]) || []);

    setEntries(
      (employees || []).map((emp) => {
        const rec = recordMap.get(emp.id);
        return {
          employee: emp as OrganisationEmployee,
          status: (rec?.status as AttendanceStatus) || 'present',
          recordId: rec?.id,
        };
      })
    );
    setLoading(false);
  }, [selectedProject, date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  function updateStatus(employeeId: string, status: AttendanceStatus) {
    setEntries((prev) =>
      prev.map((e) => (e.employee.id === employeeId ? { ...e, status } : e))
    );
  }

  function markAllPresent() {
    setEntries((prev) => prev.map((e) => ({ ...e, status: 'present' as AttendanceStatus })));
  }

  async function handleSave() {
    if (!selectedProject || !user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const supabase = createClient();

    const upserts = entries.map((e) => ({
      project_id: selectedProject.id,
      organisation_id: selectedProject.organisation_id,
      employee_id: e.employee.id,
      attendance_date: date,
      status: e.status,
      recorded_by: user.id,
      ...(e.recordId ? { id: e.recordId } : {}),
    }));

    const { error: saveError } = await supabase
      .from('daily_attendance')
      .upsert(upserts, { onConflict: 'project_id,employee_id,attendance_date' });

    if (saveError) {
      setError(saveError.message);
    } else {
      setSuccess(`Attendance saved for ${entries.length} employees`);
      await loadAttendance();
    }
    setSaving(false);
  }

  const presentCount = entries.filter((e) => e.status === 'present').length;
  const absentCount = entries.filter((e) => e.status === 'absent').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Attendance</h1>
            <p className="text-gray-500 mt-1">Mark organisation employee attendance</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/attendance/details"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Details
            </Link>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
            />
            <Button variant="outline" onClick={markAllPresent}>
              Mark All Present
            </Button>
            <Button onClick={handleSave} disabled={saving || entries.length === 0}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Employees</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-2xl font-bold">{presentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-50">
                <ClipboardList className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl font-bold">{absentCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Attendance — {date}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading employees...
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No active employees found"
                description="Add organisation employees in Masters to record attendance"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Mobile</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(({ employee, status }) => (
                      <tr key={employee.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-600">{employee.employee_code}</td>
                        <td className="py-3 px-4 font-medium">{employee.full_name}</td>
                        <td className="py-3 px-4 text-gray-600">{employee.mobile || '—'}</td>
                        <td className="py-3 px-4">
                          <select
                            value={status}
                            onChange={(e) =>
                              updateStatus(employee.id, e.target.value as AttendanceStatus)
                            }
                            className="h-9 rounded-lg border border-gray-300 px-2 text-sm min-w-[120px]"
                          >
                            {ATTENDANCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
