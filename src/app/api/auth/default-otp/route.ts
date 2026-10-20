import { NextRequest, NextResponse } from 'next/server';
import { TEMP_DEFAULT_OTP } from '@/lib/auth-temp';
import { getServiceClient } from '@/lib/daily-activities-api';

/**
 * Temporary session bootstrap for the default OTP (123456).
 * Sets a matching password so password login also works, then returns
 * either a magic-link token hash or password credentials for the client.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; mobile?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const otp = String(body.otp || '').trim();
  if (otp !== TEMP_DEFAULT_OTP) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() || '';
  const mobile = (body.mobile || '').replace(/\D/g, '').slice(-10);

  if (!email && !mobile) {
    return NextResponse.json({ error: 'Email or mobile number is required' }, { status: 400 });
  }

  let service;
  try {
    service = getServiceClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server auth is not configured' },
      { status: 500 }
    );
  }

  let query = service.from('users').select('id, email, mobile, full_name, role, status');
  if (email) query = query.eq('email', email);
  else query = query.eq('mobile', mobile);

  const { data: profile, error: profileError } = await query.maybeSingle();
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }
  if (!profile) {
    return NextResponse.json(
      { error: 'User profile not found. Contact your administrator to create your account.' },
      { status: 404 }
    );
  }
  if (profile.status !== 'active') {
    return NextResponse.json(
      { error: 'Your account is inactive. Contact your administrator.' },
      { status: 403 }
    );
  }

  const userEmail = profile.email?.trim().toLowerCase() || undefined;
  const phone = profile.mobile
    ? profile.mobile.startsWith('+')
      ? profile.mobile
      : `+91${profile.mobile}`
    : undefined;

  const { error: updateError } = await service.auth.admin.updateUserById(profile.id, {
    password: TEMP_DEFAULT_OTP,
    ...(userEmail ? { email: userEmail, email_confirm: true } : {}),
    ...(phone ? { phone, phone_confirm: true } : {}),
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (userEmail) {
    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    const tokenHash = linkData?.properties?.hashed_token;
    if (!linkError && tokenHash) {
      return NextResponse.json({
        mode: 'token_hash' as const,
        token_hash: tokenHash,
        type: 'email' as const,
      });
    }
  }

  if (!userEmail && !phone) {
    return NextResponse.json(
      { error: 'User has no email or mobile on file for sign-in.' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    mode: 'password' as const,
    email: userEmail || null,
    phone: phone || null,
    password: TEMP_DEFAULT_OTP,
  });
}
