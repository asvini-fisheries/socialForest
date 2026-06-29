'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, Year, Project } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { fetchAllProjectsForUser } from '@/lib/projects';

const PROJECT_STORAGE_KEY = 'sf_selected_project_id';

interface AuthContextType {
  user: User | null;
  selectedYear: Year | null;
  selectedProject: Project | null;
  setUser: (user: User | null) => void;
  setSelectedYear: (year: Year | null) => void;
  setSelectedProject: (project: Project | null) => void;
  /** Sets project and derives financial year from project.year */
  selectProject: (project: Project) => void;
  logout: () => void;
  isAuthenticated: boolean;
  sessionReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const selectProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setSelectedYear((project.year as Year | undefined) ?? null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROJECT_STORAGE_KEY, project.id);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setSelectedYear(null);
    setSelectedProject(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser || cancelled) return;

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!profile || profile.status !== 'active' || cancelled) return;

        setUser(profile as User);

        const storedProjectId = localStorage.getItem(PROJECT_STORAGE_KEY);
        const projects = await fetchAllProjectsForUser(profile as User);
        if (cancelled || projects.length === 0) return;

        const match = storedProjectId
          ? projects.find((p) => p.id === storedProjectId)
          : undefined;
        const project = match ?? projects[0];
        selectProject(project);
      } catch {
        // ignore — user stays on login
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    }

    restoreSession().catch(() => {
      if (!cancelled) setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [selectProject]);

  return (
    <AuthContext.Provider
      value={{
        user,
        selectedYear,
        selectedProject,
        setUser,
        setSelectedYear,
        setSelectedProject,
        selectProject,
        logout,
        isAuthenticated: !!user && !!selectedProject,
        sessionReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
