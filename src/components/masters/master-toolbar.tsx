'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { exportRowsBuffer, downloadBuffer } from '@/lib/master-excel';
import type { ImportColumnSpec } from '@/lib/master-types';

interface MasterToolbarProps {
  table: string;
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  importEnabled: boolean;
  importColumns: ImportColumnSpec[];
  filteredRows: Record<string, unknown>[];
  onImportComplete: () => void;
  onOpenLogs: () => void;
}

async function downloadFromApi(path: string, fallbackName: string) {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Download failed');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="(.+)"/);
  const filename = match?.[1] || fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MasterToolbar({
  table,
  title,
  search,
  onSearchChange,
  importEnabled,
  importColumns,
  filteredRows,
  onImportComplete,
  onOpenLogs,
}: MasterToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  async function handleExport() {
    setBusy('export');
    setMessage('');
    try {
      if (importColumns.length) {
        const buffer = exportRowsBuffer(title, importColumns, filteredRows);
        downloadBuffer(buffer, `${title.replace(/\s+/g, '_')}_export.xlsx`);
      } else {
        await downloadFromApi(`/api/masters/${table}/export`, `${table}_export.xlsx`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy('');
    }
  }

  async function handleTemplate() {
    if (!importEnabled) return;
    setBusy('template');
    setMessage('');
    try {
      await downloadFromApi(`/api/masters/${table}/template`, `${table}_template.xlsx`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Template download failed');
    } finally {
      setBusy('');
    }
  }

  async function handleUpload(file: File) {
    setBusy('upload');
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/masters/${table}/import`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      if (data.errorCount > 0) {
        setMessage(
          `Imported ${data.successCount}/${data.totalRows} rows. ${data.errorCount} error(s) — see Import Logs.`
        );
      } else {
        setMessage(`Successfully imported ${data.successCount} row(s).`);
      }
      onImportComplete();
      onOpenLogs();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!!busy}>
            {busy === 'export' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Excel Download
          </Button>
          {importEnabled && (
            <>
              <Button variant="outline" size="sm" onClick={handleTemplate} disabled={!!busy}>
                {busy === 'template' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                Upload Format
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!!busy}
                onClick={() => fileRef.current?.click()}
              >
                {busy === 'upload' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Excel Upload
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </>
          )}
          <Button variant="outline" size="sm" onClick={onOpenLogs}>
            <ClipboardList className="w-4 h-4" />
            Import Logs
          </Button>
        </div>
      </div>
      {message && (
        <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">
          {message}
        </div>
      )}
    </div>
  );
}
