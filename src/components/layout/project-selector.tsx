'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { fetchAllProjectsForUser } from '@/lib/projects';
import type { Project } from '@/types/database';

interface ProjectSelectorProps {
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ProjectSelector({ label = 'Project', className, disabled }: ProjectSelectorProps) {
  const { user, selectedProject, selectProject } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchAllProjectsForUser(user)
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className={className}>
      <Select
        label={label}
        placeholder={loading ? 'Loading projects...' : 'Select project'}
        options={projects.map((p) => ({
          value: p.id,
          label: `${p.name}${p.code ? ` (${p.code})` : ''}`,
        }))}
        value={selectedProject?.id ?? ''}
        onChange={(e) => {
          const project = projects.find((p) => p.id === e.target.value);
          if (project) selectProject(project);
        }}
        disabled={disabled || loading || projects.length === 0}
      />
      {loading && (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading…
        </span>
      )}
    </div>
  );
}
