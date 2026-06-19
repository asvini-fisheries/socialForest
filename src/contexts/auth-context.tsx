'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, Year, Project } from '@/types/database';

interface AuthContextType {
  user: User | null;
  selectedYear: Year | null;
  selectedProject: Project | null;
  setUser: (user: User | null) => void;
  setSelectedYear: (year: Year | null) => void;
  setSelectedProject: (project: Project | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    setSelectedYear(null);
    setSelectedProject(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        selectedYear,
        selectedProject,
        setUser,
        setSelectedYear,
        setSelectedProject,
        logout,
        isAuthenticated: !!user && !!selectedYear && !!selectedProject,
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
