'use client';

import { useState } from 'react';
import { TreePine, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { validateMobile, maskMobile } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import type { User, Year, Project } from '@/types/database';
import { ROLE_LABELS } from '@/types/database';

type LoginStep = 'mobile' | 'otp' | 'selection';

export function LoginForm() {
  const [step, setStep] = useState<LoginStep>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [years, setYears] = useState<Year[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const { setUser, setSelectedYear, setSelectedProject } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  async function handleSendOtp() {
    setError('');
    if (!validateMobile(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: `+91${mobile}`,
      });
      if (otpError) throw otpError;
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+91${mobile}`,
        token: otp,
        type: 'sms',
      });
      if (verifyError) throw verifyError;

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', mobile)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found. Contact administrator.');
      }

      if (profile.status !== 'active') {
        throw new Error('Your account is inactive. Contact administrator.');
      }

      setUserProfile(profile);

      const { data: yearsData } = await supabase
        .from('years')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      setYears(yearsData || []);
      setStep('selection');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleYearChange(yearId: string) {
    setSelectedYearId(yearId);
    setSelectedProjectId('');
    if (!yearId || !userProfile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*, year:years(*), csr_partner:csr_partners(name), organisation:organisations(name)')
        .eq('year_id', yearId)
        .eq('is_active', true);

      if (userProfile.role === 'csr_partner' && userProfile.csr_partner_id) {
        query = query.eq('csr_partner_id', userProfile.csr_partner_id);
      } else if (userProfile.role === 'organisation' && userProfile.organisation_id) {
        query = query.eq('organisation_id', userProfile.organisation_id);
      } else if (userProfile.role === 'stakeholder' && userProfile.stakeholder_id) {
        const { data: allocations } = await supabase
          .from('activity_contractor_allocations')
          .select('project_activity_id, project_activities!inner(project_id)')
          .eq('stakeholder_id', userProfile.stakeholder_id);

        const projectIds = [
          ...new Set(
            allocations?.map((a) => {
              const pa = a.project_activities as unknown as { project_id: string };
              return pa.project_id;
            }) || []
          ),
        ];

        if (projectIds.length > 0) {
          query = query.in('id', projectIds);
        } else {
          setProjects([]);
          setLoading(false);
          return;
        }
      }

      const { data: projectsData } = await query.order('name');
      setProjects(projectsData || []);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (!userProfile || !selectedYearId || !selectedProjectId) {
      setError('Please select both year and project');
      return;
    }

    const year = years.find((y) => y.id === selectedYearId);
    const project = projects.find((p) => p.id === selectedProjectId);

    if (!year || !project) return;

    setUser(userProfile);
    setSelectedYear(year);
    setSelectedProject(project);
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4">
            <TreePine className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SocialForest</h1>
          <p className="text-gray-500 mt-1">CSR Agroforestry Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'mobile' && 'Sign In'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'selection' && 'Select Project'}
            </CardTitle>
            <CardDescription>
              {step === 'mobile' && 'Enter your registered mobile number'}
              {step === 'otp' && `OTP sent to ${maskMobile(mobile)}`}
              {step === 'selection' && userProfile && (
                <span>
                  Welcome, {userProfile.full_name} ({ROLE_LABELS[userProfile.role]})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            {step === 'mobile' && (
              <>
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
                <Button onClick={handleSendOtp} disabled={loading} className="w-full" size="lg">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      Send OTP
                    </>
                  )}
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <Input
                  label="Enter OTP"
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <Button onClick={handleVerifyOtp} disabled={loading} className="w-full" size="lg">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep('mobile');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full"
                >
                  Change Mobile Number
                </Button>
              </>
            )}

            {step === 'selection' && (
              <>
                <Select
                  label="Financial Year"
                  placeholder="Select year"
                  options={years.map((y) => ({ value: y.id, label: y.year_label }))}
                  value={selectedYearId}
                  onChange={(e) => handleYearChange(e.target.value)}
                />
                <Select
                  label="Project"
                  placeholder={loading ? 'Loading projects...' : 'Select project'}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: `${p.name}${p.code ? ` (${p.code})` : ''}`,
                  }))}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={!selectedYearId || loading}
                />
                <Button
                  onClick={handleLogin}
                  disabled={!selectedYearId || !selectedProjectId}
                  className="w-full"
                  size="lg"
                >
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          SocialForest &copy; {new Date().getFullYear()} — Agroforestry with Biodiversity
        </p>
      </div>
    </div>
  );
}
