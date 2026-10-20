'use client';

import { useState } from 'react';
import { Phone, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { validateMobile, maskMobile } from '@/lib/utils';
import { getAuthErrorMessage, validateEmail, maskEmail } from '@/lib/auth-errors';
import { isTempDefaultOtp, TEMP_DEFAULT_OTP } from '@/lib/auth-temp';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { fetchAllProjectsForUser } from '@/lib/projects';
import type { User, Project } from '@/types/database';
import { ROLE_LABELS } from '@/types/database';

type LoginMethod = 'email' | 'mobile' | 'password';
type LoginStep = 'credentials' | 'otp' | 'selection';

type DefaultOtpResponse =
  | { mode: 'token_hash'; token_hash: string; type: 'email' }
  | { mode: 'password'; email: string | null; phone: string | null; password: string }
  | { error: string };

export function LoginForm() {
  const [method, setMethod] = useState<LoginMethod>('email');
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const { setUser, selectProject } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  async function loadUserProfileByIdentifier(): Promise<User> {
    let query = supabase.from('users').select('*');

    if (method === 'mobile') {
      query = query.eq('mobile', mobile);
    } else {
      query = query.eq('email', email.trim().toLowerCase());
    }

    const { data: profile, error: profileError } = await query.single();

    if (profileError || !profile) {
      throw new Error('User profile not found. Contact your administrator to create your account.');
    }

    if (profile.status !== 'active') {
      throw new Error('Your account is inactive. Contact your administrator.');
    }

    return profile;
  }

  async function loadUserProfileByAuthId(authUserId: string): Promise<User> {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found. Contact your administrator to create your account.');
    }

    if (profile.status !== 'active') {
      throw new Error('Your account is inactive. Contact your administrator.');
    }

    return profile;
  }

  async function continueToProjectSelection(profile: User) {
    setUserProfile(profile);

    const projectsData = await fetchAllProjectsForUser(profile);
    if (projectsData.length === 0) {
      setError('No active projects are assigned to your account. Contact your administrator.');
      return;
    }
    setProjects(projectsData);
    setSelectedProjectId(projectsData[0].id);
    setStep('selection');
  }

  async function establishSessionWithDefaultOtp(identifier: {
    email?: string;
    mobile?: string;
  }) {
    const res = await fetch('/api/auth/default-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: identifier.email,
        mobile: identifier.mobile,
        otp: TEMP_DEFAULT_OTP,
      }),
    });

    const data = (await res.json()) as DefaultOtpResponse;
    if (!res.ok || 'error' in data) {
      throw new Error(
        'error' in data && data.error ? data.error : 'Temporary sign-in failed. Please try again.'
      );
    }

    if (data.mode === 'token_hash') {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: data.type,
      });
      if (verifyError) throw verifyError;
      return;
    }

    const { error: passwordError } = await supabase.auth.signInWithPassword(
      data.email
        ? { email: data.email, password: data.password }
        : { phone: data.phone!, password: data.password }
    );
    if (passwordError) throw passwordError;
  }

  async function handleSendOtp() {
    setError('');
    setInfo('');

    if (method === 'email') {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }
    } else if (!validateMobile(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } =
        method === 'email'
          ? await supabase.auth.signInWithOtp({
              email: email.trim().toLowerCase(),
              options: { shouldCreateUser: false },
            })
          : await supabase.auth.signInWithOtp({
              phone: `+91${mobile}`,
              options: { shouldCreateUser: false },
            });

      if (otpError) {
        // Temporary: OTP delivery may be unavailable — still allow default code.
        setInfo(
          `Verification code could not be delivered. For now, use temporary code ${TEMP_DEFAULT_OTP}.`
        );
      } else {
        setInfo(`If you do not receive a code, use temporary code ${TEMP_DEFAULT_OTP}.`);
      }
      setStep('otp');
    } catch {
      setInfo(
        `Verification code could not be delivered. For now, use temporary code ${TEMP_DEFAULT_OTP}.`
      );
      setStep('otp');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      if (isTempDefaultOtp(otp)) {
        await establishSessionWithDefaultOtp(
          method === 'email'
            ? { email: email.trim().toLowerCase() }
            : { mobile }
        );
      } else {
        const { error: verifyError } =
          method === 'email'
            ? await supabase.auth.verifyOtp({
                email: email.trim().toLowerCase(),
                token: otp,
                type: 'email',
              })
            : await supabase.auth.verifyOtp({
                phone: `+91${mobile}`,
                token: otp,
                type: 'sms',
              });

        if (verifyError) throw verifyError;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const profile = authUser?.id
        ? await loadUserProfileByAuthId(authUser.id)
        : await loadUserProfileByIdentifier();

      await continueToProjectSelection(profile);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Verification failed. Please check the code and try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin() {
    setError('');
    setInfo('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      if (isTempDefaultOtp(password)) {
        await establishSessionWithDefaultOtp({ email: email.trim().toLowerCase() });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) throw new Error('Sign-in succeeded but no session was created.');

      const profile = await loadUserProfileByAuthId(authUser.id);
      await continueToProjectSelection(profile);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Invalid email or password. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  function handleLogin() {
    if (!userProfile || !selectedProjectId) {
      setError('Please select a project');
      return;
    }

    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    setUser(userProfile);
    selectProject(project);
    router.push('/dashboard');
  }

  function resetToCredentials() {
    setStep('credentials');
    setOtp('');
    setError('');
    setInfo('');
  }

  function switchMethod(next: LoginMethod) {
    setMethod(next);
    resetToCredentials();
  }

  const otpTarget =
    method === 'email' ? maskEmail(email.trim().toLowerCase()) : maskMobile(mobile);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedYearLabel = selectedProject?.year?.year_label;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="xl" className="mx-auto" priority />
          <p className="text-gray-500 mt-4 text-sm">CSR Agroforestry Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'credentials' && 'Sign In'}
              {step === 'otp' && 'Verify Code'}
              {step === 'selection' && 'Select Project'}
            </CardTitle>
            <CardDescription>
              {step === 'credentials' && 'Sign in with password, email OTP, or mobile OTP'}
              {step === 'otp' && `Verification code sent to ${otpTarget}`}
              {step === 'selection' && userProfile && (
                <span>
                  Welcome, {userProfile.full_name} ({ROLE_LABELS[userProfile.role]})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}
            {info && !error && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                {info}
              </div>
            )}

            {step === 'credentials' && (
              <>
                <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => switchMethod('email')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
                      method === 'email'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMethod('mobile')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
                      method === 'mobile'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Mobile OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMethod('password')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
                      method === 'password'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Password
                  </button>
                </div>

                {method === 'password' ? (
                  <>
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <p className="text-xs text-gray-500">
                      Temporary access: use password <span className="font-medium">{TEMP_DEFAULT_OTP}</span>{' '}
                      if your account password is not set yet.
                    </p>
                    <Button onClick={handlePasswordLogin} disabled={loading} className="w-full" size="lg">
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Sign In with Password
                        </>
                      )}
                    </Button>
                  </>
                ) : method === 'email' ? (
                  <>
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <Button onClick={handleSendOtp} disabled={loading} className="w-full" size="lg">
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      label="Mobile Number"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      autoComplete="tel"
                    />
                    <Button onClick={handleSendOtp} disabled={loading} className="w-full" size="lg">
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Phone className="w-4 h-4" />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  </>
                )}
              </>
            )}

            {step === 'otp' && (
              <>
                <Input
                  label="Enter 6-digit code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500">
                  Temporary default OTP: <span className="font-medium">{TEMP_DEFAULT_OTP}</span>
                </p>
                <Button onClick={handleVerifyOtp} disabled={loading} className="w-full" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
                </Button>
                <Button variant="ghost" onClick={resetToCredentials} className="w-full">
                  {method === 'email' ? 'Change Email' : 'Change Mobile Number'}
                </Button>
              </>
            )}

            {step === 'selection' && (
              <>
                <Select
                  label="Project"
                  placeholder={loading ? 'Loading projects...' : 'Select project'}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: `${p.name}${p.code ? ` (${p.code})` : ''}`,
                  }))}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={loading || projects.length === 0}
                />
                {selectedYearLabel && (
                  <p className="text-sm text-gray-500">
                    Financial year: <span className="font-medium text-gray-700">{selectedYearLabel}</span>
                    <span className="block text-xs mt-1">Year is taken from the selected project.</span>
                  </p>
                )}
                <Button
                  onClick={handleLogin}
                  disabled={!selectedProjectId || loading}
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
