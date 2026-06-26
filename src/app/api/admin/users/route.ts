import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Admin access required', status: 403 };
  return { user };
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { full_name, mobile, email, role, status, avatar_url } = body;

  if (!full_name || !mobile || !role) {
    return NextResponse.json({ error: 'Name, mobile, and role are required' }, { status: 400 });
  }

  const service = getServiceClient();

  const { data: authUser, error: authErr } = await service.auth.admin.createUser({
    phone: mobile.startsWith('+') ? mobile : `+91${mobile}`,
    phone_confirm: true,
    ...(email ? { email, email_confirm: true } : {}),
    user_metadata: { full_name, role },
  });

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  const { error: profileErr } = await service.from('users').upsert({
    id: authUser.user.id,
    mobile: mobile.replace(/^\+91/, ''),
    email: email || null,
    full_name,
    role,
    status: status || 'active',
    avatar_url: avatar_url || null,
  });

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: authUser.user.id });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { id, full_name, mobile, email, role, status, avatar_url } = body;

  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  const service = getServiceClient();

  const { error: profileErr } = await service
    .from('users')
    .update({ full_name, mobile, email, role, status, avatar_url: avatar_url ?? null })
    .eq('id', id);

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }

  await service.auth.admin.updateUserById(id, {
    ...(email ? { email } : {}),
    user_metadata: { full_name, role },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  const service = getServiceClient();

  const { error } = await service.from('users').update({ status: 'inactive' }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
