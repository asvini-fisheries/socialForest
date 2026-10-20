'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { fetchAllProjectsForUser } from '@/lib/projects';
import type { Project } from '@/types/database';

export function AppHeader() {
  const { user, selectedProject, selectedYear, selectProject, sessionReady } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (selectedProject?.name) {
      document.title = `${selectedProject.name} — SocialForest`;
    } else {
      document.title = 'SocialForest';
    }
  }, [selectedProject?.name]);

  useEffect(() => {
    if (!sessionReady || !user) {
      setProjects([]);
      return;
    }

    let cancelled = false;
    fetchAllProjectsForUser(user)
      .then((rows) => {
        if (!cancelled) setProjects(rows);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionReady, user]);

  if (!selectedProject) return null;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{selectedProject.name}</h1>
          {selectedYear?.year_label && (
            <p className="text-sm text-gray-500 mt-0.5">Financial Year: {selectedYear.year_label}</p>
          )}
          {process.env.NEXT_PUBLIC_BUILD_ID && (
            <p className="text-xs text-gray-400 mt-1">Build {process.env.NEXT_PUBLIC_BUILD_ID}</p>
          )}
        </div>

        {projects.length > 1 && (
          <div className="min-w-[220px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Active project</label>
            <select
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedProject.id}
              onChange={(e) => {
                const next = projects.find((project) => project.id === e.target.value);
                if (next) selectProject(next);
              }}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {project.code ? ` (${project.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </header>
  );
}
