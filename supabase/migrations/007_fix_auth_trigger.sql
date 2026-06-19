-- Fix auth trigger: handle email-only signups and normalize phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  normalized_mobile TEXT;
BEGIN
  normalized_mobile := REPLACE(COALESCE(NEW.phone, ''), '+91', '');
  normalized_mobile := REPLACE(normalized_mobile, '+', '');

  IF normalized_mobile = '' OR normalized_mobile IS NULL THEN
    normalized_mobile := 'u' || LEFT(REPLACE(NEW.id::text, '-', ''), 9);
  END IF;

  INSERT INTO public.users (id, mobile, email, full_name, role, status)
  VALUES (
    NEW.id,
    normalized_mobile,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'organisation_employee'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    mobile = EXCLUDED.mobile,
    email = COALESCE(EXCLUDED.email, public.users.email),
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_auth_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
