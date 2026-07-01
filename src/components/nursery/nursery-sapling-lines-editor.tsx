'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatNumber } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export type SaplingLineRow = {
  key: string;
  resource_id: string;
  quantity: string;
};

type SpeciesOption = { value: string; label: string };

interface NurserySaplingLinesEditorProps {
  lines: SaplingLineRow[];
  species: SpeciesOption[];
  onChange: (lines: SaplingLineRow[]) => void;
}

export function createEmptySaplingLine(): SaplingLineRow {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    resource_id: '',
    quantity: '',
  };
}

export function NurserySaplingLinesEditor({ lines, species, onChange }: NurserySaplingLinesEditorProps) {
  function updateLine(key: string, patch: Partial<SaplingLineRow>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    if (lines.length <= 1) return;
    onChange(lines.filter((line) => line.key !== key));
  }

  function addLine() {
    onChange([...lines, createEmptySaplingLine()]);
  }

  const totalQty = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Sapling Details</h3>
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus className="w-4 h-4" />
          Add Sapling
        </Button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-2 px-3 font-medium text-gray-500">Tree Species</th>
              <th className="text-right py-2 px-3 font-medium text-gray-500 w-36">Quantity</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className="border-b border-gray-100">
                <td className="py-2 px-3">
                  <Select
                    value={line.resource_id}
                    onChange={(e) => updateLine(line.key, { resource_id: e.target.value })}
                    placeholder="Select species"
                    options={species}
                  />
                </td>
                <td className="py-2 px-3">
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  />
                </td>
                <td className="py-2 px-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="py-2 px-3 text-right text-gray-700">Total Saplings</td>
              <td className="py-2 px-3 text-right tabular-nums">{formatNumber(totalQty)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
