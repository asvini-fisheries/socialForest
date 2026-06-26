'use client';

import { useEffect, useState } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ImportLogRow {
  id: string;
  file_name: string | null;
  total_rows: number;
  success_count: number;
  error_count: number;
  status: string;
  error_details: { row: number; column: string; value: string; message: string }[];
  created_at: string;
  uploader?: { full_name?: string } | null;
}

interface ImportLogsDialogProps {
  table: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportLogsDialog({ table, title, open, onOpenChange }: ImportLogsDialogProps) {
  const [logs, setLogs] = useState<ImportLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [migrationRequired, setMigrationRequired] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/masters/${table}/import-logs`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLogs(data.logs || []);
        setMigrationRequired(Boolean(data.migrationRequired));
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open, table]);

  const expanded = logs.find((l) => l.id === expandedId);

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`${title} — Import Logs`} className="max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading logs...
          </div>
        ) : migrationRequired ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
            Import logs table not found. Apply migration{' '}
            <code className="text-xs">013_master_import_logs.sql</code> in Supabase.
          </p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No import logs yet.</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{log.file_name || 'Upload'}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatDate(log.created_at)} · {log.uploader?.full_name || 'Admin'}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      log.error_count === 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : log.success_count > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {log.success_count}/{log.total_rows} ok · {log.error_count} errors
                  </span>
                </div>
                {log.error_details?.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    {expandedId === log.id ? 'Hide errors' : 'View error details'}
                  </Button>
                )}
                {expandedId === log.id && expanded && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="text-left py-1 pr-2">Row</th>
                          <th className="text-left py-1 pr-2">Column</th>
                          <th className="text-left py-1 pr-2">Value</th>
                          <th className="text-left py-1">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expanded.error_details.map((err, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-1 pr-2">{err.row}</td>
                            <td className="py-1 pr-2">{err.column}</td>
                            <td className="py-1 pr-2 max-w-[120px] truncate">{err.value || '—'}</td>
                            <td className="py-1 text-red-600">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  );
}
