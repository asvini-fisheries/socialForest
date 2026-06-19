'use client';

import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sprout, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function NurseryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centralized Nursery</h1>
            <p className="text-gray-500 mt-1">Manage tree stock — inwards, issues, and inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <ArrowDownToLine className="w-4 h-4" />
              Record Inward
            </Button>
            <Button>
              <ArrowUpFromLine className="w-4 h-4" />
              Issue Stock
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              Current Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Species</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total Inward</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total Issued</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Current Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400">
                      No nursery stock data available. Connect Supabase to view stock.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
