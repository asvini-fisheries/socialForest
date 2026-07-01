'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ExcelExportButton } from '@/components/export/excel-export-button';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { formatOrgShortName } from '@/lib/master-display';
import type { AttendanceStatus } from '@/types/database';
import { ClipboardList, Loader2, ArrowLeft } from 'lucide-react';

type AttendanceRow = {
  id: string;
  attendance_date: string;
  status: AttendanceStatus;
  organisation_id: string;
  organisation?: { name?: string; code?: string } | null;
  employee?: {
    employee_code?: string;
    full_name?: string;
    designation?: { name?: string } | null;
  } | null;
};

type AttendanceFilters = {
  dateFrom: string;
  dateTo: string;
  organisation: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
};

const EMPTY_FILTERS: AttendanceFilters = {
  dateFrom: '',
  dateTo: '',
  organisation: '',
  employeeCode: '',
  employeeName: '',
  designation: '',
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  leave: 'Leave',
  holiday: 'Holiday',
};

const EXPORT_COLUMNS = [
  { key: 'attendance_date', header: 'Date' },
  { key: 'organisation', header: 'Organisation' },
  { key: 'employee_code', header: 'Employee Code' },
  { key: 'employee_name', header: 'Employee Name' },
  { key: 'designation', header: 'Designation' },
  { key: 'status', header: 'Status' },
];

function toExportRow(row: AttendanceRow): Record<string, unknown> {
  return {
    attendance_date: formatDate(row.attendance_date),
    organisation: formatOrgShortName(row.organisation),
    employee_code: row.employee?.employee_code || '',
    employee_name: row.employee?.full_name || '',
    designation: row.employee?.designation?.name || '',
    status: STATUS_LABELS[row.status] || row.status,
  };
}

export default function AttendanceDetailsPage() {
  const { selectedProject } = useAuth();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [organisations, setOrganisations] = useState<{ id: string; name: string; code: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<AttendanceFilters>(EMPTY_FILTERS);

  const loadData = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError('');
    const supabase = createClient();

    const [orgsRes, attendanceRes] = await Promise.all([
      supabase.from('organisations').select('id, name, code').eq('is_active', true).order('name'),
      supabase
        .from('daily_attendance')
        .select(
          'id, attendance_date, status, organisation_id, organisation:organisations(name, code), employee:organisation_employees(employee_code, full_name, designation:designations(name))'
        )
        .eq('project_id', selectedProject.id)
        .order('attendance_date', { ascending: false }),
    ]);

    if (attendanceRes.error) {
      setError(attendanceRes.error.message);
      setRows([]);
    } else {
      setRows((attendanceRes.data as AttendanceRow[]) || []);
    }
    setOrganisations(orgsRes.data || []);
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRows = useMemo(() => {
    const codeQ = filters.employeeCode.trim().toLowerCase();
    const nameQ = filters.employeeName.trim().toLowerCase();
    const desigQ = filters.designation.trim().toLowerCase();

    return rows.filter((row) => {
      if (filters.dateFrom && row.attendance_date < filters.dateFrom) return false;
      if (filters.dateTo && row.attendance_date > filters.dateTo) return false;
      if (filters.organisation && row.organisation_id !== filters.organisation) return false;

      if (codeQ) {
        const code = row.employee?.employee_code?.toLowerCase() || '';
        if (!code.includes(codeQ)) return false;
      }

      if (nameQ) {
        const name = row.employee?.full_name?.toLowerCase() || '';
        if (!name.includes(nameQ)) return false;
      }

      if (desigQ) {
        const desig = row.employee?.designation?.name?.toLowerCase() || '';
        if (!desig.includes(desigQ)) return false;
      }

      return true;
    });
  }, [rows, filters]);

  const exportRows = useMemo(() => filteredRows.map(toExportRow), [filteredRows]);

  function setFilter<K extends keyof AttendanceFilters>(key: K, value: AttendanceFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (!selectedProject) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={ClipboardList}
          title="No project selected"
          description="Select a project to view attendance details"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Daily Attendance
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Details</h1>
            <p className="text-gray-500 mt-1">View and export attendance records</p>
          </div>
          <ExcelExportButton
            sheetName="Attendance Details"
            filename="attendance_details.xlsx"
            columns={EXPORT_COLUMNS}
            rows={exportRows}
            disabled={loading || filteredRows.length === 0}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Attendance Records ({filteredRows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <Input
                label="Date from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
              />
              <Input
                label="Date to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter('dateTo', e.target.value)}
              />
              <Select
                label="Organisation"
                value={filters.organisation}
                onChange={(e) => setFilter('organisation', e.target.value)}
                placeholder="All organisations"
                options={[
                  { value: '', label: 'All organisations' },
                  ...organisations.map((org) => ({
                    value: org.id,
                    label: org.code || org.name,
                  })),
                ]}
              />
              <Input
                label="Employee Code"
                placeholder="Filter by code…"
                value={filters.employeeCode}
                onChange={(e) => setFilter('employeeCode', e.target.value)}
              />
              <Input
                label="Employee Name"
                placeholder="Filter by name…"
                value={filters.employeeName}
                onChange={(e) => setFilter('employeeName', e.target.value)}
              />
              <Input
                label="Designation"
                placeholder="Filter by designation…"
                value={filters.designation}
                onChange={(e) => setFilter('designation', e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading attendance...
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No attendance records found"
                description="Mark attendance on the Daily Attendance screen or adjust filters"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Organisation</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Employee Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Employee Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Designation</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 whitespace-nowrap">{formatDate(row.attendance_date)}</td>
                        <td className="py-3 px-4">{formatOrgShortName(row.organisation)}</td>
                        <td className="py-3 px-4">{row.employee?.employee_code || '—'}</td>
                        <td className="py-3 px-4 font-medium">{row.employee?.full_name || '—'}</td>
                        <td className="py-3 px-4">{row.employee?.designation?.name || '—'}</td>
                        <td className="py-3 px-4">{STATUS_LABELS[row.status] || row.status}</td>
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
