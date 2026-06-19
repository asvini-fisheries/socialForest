'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FolderKanban } from 'lucide-react';

export default function NewProjectPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
        </div>

        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-gray-600">Project creation form coming soon</p>
            <p className="text-sm mt-1">Admin can create projects from the masters module</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
