'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';
import { MasterToolbar } from '@/components/masters/master-toolbar';
import { ImportLogsDialog } from '@/components/masters/import-logs-dialog';
import { MasterImageCell } from '@/components/masters/master-image-cell';
import { MasterImageField } from '@/components/masters/master-image-field';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { getMasterTableSpec } from '@/lib/master-registry-data';
import { filterMasterRows } from '@/lib/master-registry';
import { getMasterImageField, uploadMasterImage, removeMasterImageFromUrl } from '@/lib/master-image';
import type { MasterConfig, MasterField } from '@/lib/master-types';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

interface MasterCrudPageProps {
  config: MasterConfig;
}

export function MasterCrudPage({ config }: MasterCrudPageProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const tableSpec = getMasterTableSpec(config.table);
  const searchKeys = useMemo(
    () => config.searchKeys ?? tableSpec?.searchKeys ?? [],
    [config.searchKeys, tableSpec?.searchKeys]
  );
  const importEnabled = tableSpec?.importEnabled ?? false;
  const imageField = config.imageField ?? getMasterImageField(config.table);

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState('');
  const [logsOpen, setLogsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageClear, setImageClear] = useState(false);

  const gridColumns = useMemo(
    () => [
      {
        key: '_image',
        header: 'Image',
        render: (row: Record<string, unknown>) => (
          <MasterImageCell
            url={String(row[imageField] || '')}
            alt={String(row.name || row.full_name || row.year_label || config.title)}
          />
        ),
      },
      ...config.columns,
    ],
    [config.columns, config.title, imageField]
  );

  const filteredRows = useMemo(
    () => filterMasterRows(rows, search, searchKeys),
    [rows, search, searchKeys]
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from(config.table)
      .select(config.selectQuery || '*')
      .order(config.orderBy);
    if (err) setError(err.message);
    else setRows((data as unknown as Record<string, unknown>[]) || []);
    setLoading(false);
  }, [config.table, config.orderBy, config.selectQuery]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    async function loadDynamicOptions() {
      const supabase = createClient();
      const opts: Record<string, { value: string; label: string }[]> = {};
      for (const field of config.fields) {
        if (field.optionsFrom) {
          const { data } = await supabase
            .from(field.optionsFrom.table)
            .select('*')
            .order(field.optionsFrom.labelKey);
          opts[field.name] =
            data?.map((r) => {
              const row = r as unknown as Record<string, string>;
              const label = field.optionsFrom!.labelSuffixKey
                ? `${row[field.optionsFrom!.labelKey]} (${row[field.optionsFrom!.labelSuffixKey]})`
                : row[field.optionsFrom!.labelKey];
              return { value: row[field.optionsFrom!.valueKey], label };
            }) || [];
        }
      }
      setFieldOptions(opts);
    }
    loadDynamicOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.table]);

  function resetImageState() {
    setImageFile(null);
    setImagePreview(null);
    setImageClear(false);
  }

  function openCreate() {
    const defaults: Record<string, unknown> = { ...config.defaultValues };
    config.fields.forEach((f) => {
      if (f.type === 'boolean' && defaults[f.name] === undefined) defaults[f.name] = true;
    });
    setEditing(null);
    setForm(defaults);
    resetImageState();
    setDialogOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    const values: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      values[f.name] = row[f.name] ?? (f.type === 'boolean' ? false : '');
    });
    setForm(values);
    resetImageState();
    setDialogOpen(true);
  }

  function handleImageSelect(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setImageFile(file);
    setImageClear(false);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleImageClear() {
    setImageFile(null);
    setImagePreview(null);
    setImageClear(true);
  }

  async function saveImageForRecord(recordId: string, payload: Record<string, unknown>) {
    if (!imageFile && !imageClear) return;

    let imageUrl: string | null = imageClear
      ? null
      : String(editing?.[imageField] || payload[imageField] || '');

    if (imageFile) {
      const previous = editing?.[imageField] ? String(editing[imageField]) : '';
      if (previous) await removeMasterImageFromUrl(previous).catch(() => {});
      imageUrl = await uploadMasterImage(config.table, recordId, imageFile);
    }

    if (config.apiRoute) {
      const res = await fetch(config.apiRoute, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, ...payload, [imageField]: imageUrl }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Image save failed');
    } else {
      const supabase = createClient();
      const { error: err } = await supabase
        .from(config.table)
        .update({ [imageField]: imageUrl })
        .eq('id', recordId);
      if (err) throw err;
    }
  }

  function updateField(name: string, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setError('');

    const payload: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      let val = form[f.name];
      if ((f.type === 'number' || f.coerceNumber) && val !== '' && val != null) val = Number(val);
      if (f.type === 'boolean') val = Boolean(val);
      if (val === '') val = null;
      payload[f.name] = val;
    });

    try {
      let recordId = editing?.id as string | undefined;

      if (config.apiRoute) {
        const res = await fetch(config.apiRoute, {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Save failed');
        recordId = editing ? (editing.id as string) : (result.id as string);
      } else {
        const supabase = createClient();
        if (editing) {
          const { error: err } = await supabase
            .from(config.table)
            .update(payload)
            .eq('id', editing.id as string);
          if (err) throw err;
          recordId = editing.id as string;
        } else {
          const { data, error: err } = await supabase
            .from(config.table)
            .insert(payload)
            .select('id')
            .single();
          if (err) throw err;
          recordId = data.id as string;
        }
      }

      if (recordId && (imageFile || imageClear)) {
        await saveImageForRecord(recordId, payload);
      }

      setDialogOpen(false);
      resetImageState();
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!isAdmin) return;
    if (!confirm(`Delete this ${config.title.slice(0, -1).toLowerCase()}?`)) return;

    setError('');
    try {
      if (config.apiRoute) {
        const res = await fetch(`${config.apiRoute}?id=${row.id}`, { method: 'DELETE' });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Delete failed');
      } else {
        const supabase = createClient();
        if (config.softDelete !== false && 'is_active' in row) {
          const { error: err } = await supabase
            .from(config.table)
            .update({ is_active: false })
            .eq('id', row.id as string);
          if (err) throw err;
        } else {
          const { error: err } = await supabase.from(config.table).delete().eq('id', row.id as string);
          if (err) throw err;
        }
      }
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function renderField(field: MasterField) {
    const value = form[field.name];
    const options = field.options || fieldOptions[field.name] || [];

    if (field.type === 'boolean') {
      return (
        <label key={field.name} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateField(field.name, e.target.checked)}
            className="rounded border-gray-300"
          />
          {field.label}
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <Select
          key={field.name}
          label={field.label}
          placeholder={`Select ${field.label.toLowerCase()}`}
          options={options}
          value={String(value ?? '')}
          onChange={(e) => updateField(field.name, e.target.value)}
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <textarea
            value={String(value ?? '')}
            onChange={(e) => updateField(field.name, e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      );
    }

    return (
      <Input
        key={field.name}
        label={field.label}
        type={field.type}
        value={String(value ?? '')}
        onChange={(e) => updateField(field.name, e.target.value)}
        required={field.required}
        placeholder={field.placeholder}
      />
    );
  }

  const Icon = config.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-500 mt-1">
              {isAdmin ? 'Search, import/export, and manage master records' : 'View master data (read only)'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}

        {isAdmin && (
          <MasterToolbar
            table={config.table}
            title={config.title}
            search={search}
            onSearchChange={setSearch}
            importEnabled={importEnabled}
            filteredRows={filteredRows}
            onImportComplete={loadRows}
            onOpenLogs={() => setLogsOpen(true)}
          />
        )}

        {!isAdmin && (
          <div className="relative max-w-md">
            <Input
              placeholder={`Search ${config.title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-emerald-600" />
              {config.title}
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({filteredRows.length}
                {search ? ` of ${rows.length}` : ''})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState
                icon={Icon}
                title={search ? 'No matching records' : `No ${config.title.toLowerCase()} found`}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {gridColumns.map((col) => (
                        <th key={col.key} className="text-left py-3 px-4 font-medium text-gray-500">
                          {col.header}
                        </th>
                      ))}
                      {isAdmin && (
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id as string} className="border-b border-gray-100 hover:bg-gray-50">
                        {gridColumns.map((col) => (
                          <td key={col.key} className="py-3 px-4 text-gray-700">
                            {col.render(row)}
                          </td>
                        ))}
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(row)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ImportLogsDialog
        table={config.table}
        title={config.title}
        open={logsOpen}
        onOpenChange={setLogsOpen}
      />

      <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent title={editing ? `Edit ${config.title.slice(0, -1)}` : `Add ${config.title.slice(0, -1)}`}>
          <form onSubmit={handleSave} className="space-y-4">
            <MasterImageField
              currentUrl={imageClear ? null : String(editing?.[imageField] || '')}
              previewUrl={imagePreview}
              onFileSelect={handleImageSelect}
              onClear={handleImageClear}
            />
            {config.fields.map(renderField)}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogRoot>
    </DashboardLayout>
  );
}
