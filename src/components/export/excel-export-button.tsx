'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';
import { Download, Loader2 } from 'lucide-react';

export interface ExportColumnDef {
  key: string;
  header: string;
}

interface ExcelExportButtonProps {
  sheetName: string;
  filename?: string;
  columns: ExportColumnDef[];
  rows: Record<string, unknown>[];
  disabled?: boolean;
  label?: string;
}

export function ExcelExportButton({
  sheetName,
  filename,
  columns,
  rows,
  disabled,
  label = 'Export Excel',
}: ExcelExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(columns.map((c) => c.key)));
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const selectedColumns = useMemo(
    () => columns.filter((c) => selected.has(c.key)),
    [columns, selected]
  );

  function toggleColumn(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(columns.map((c) => c.key)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function handleExport() {
    if (!selectedColumns.length || !rows.length) return;
    setExporting(true);
    setError('');
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName,
          filename: filename || `${sheetName.replace(/\s+/g, '_')}.xlsx`,
          columns: selectedColumns,
          rows,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${sheetName.replace(/\s+/g, '_')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled || rows.length === 0}
      >
        <Download className="w-4 h-4" />
        {label}
      </Button>

      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent title="Export to Excel" className="max-w-md">
          <p className="text-sm text-gray-500 mb-4">
            Select columns to include ({rows.length} rows)
          </p>

          <div className="flex gap-2 mb-3">
            <Button type="button" variant="outline" size="sm" onClick={selectAll}>
              Select all
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearAll}>
              Clear
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
            {columns.map((col) => (
              <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded border-gray-300"
                />
                {col.header}
              </label>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-3">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={exporting || selectedColumns.length === 0}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
