'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function AppHeader() {
  const { selectedProject, selectedYear } = useAuth();

  useEffect(() => {
    if (selectedProject?.name) {
      document.title = `${selectedProject.name} — SocialForest`;
    } else {
      document.title = 'SocialForest';
    }
  }, [selectedProject?.name]);

  if (!selectedProject) return null;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{selectedProject.name}</h1>
        {selectedYear?.year_label && (
          <p className="text-sm text-gray-500 mt-0.5">Financial Year: {selectedYear.year_label}</p>
        )}
      </div>
    </header>
  );
}
