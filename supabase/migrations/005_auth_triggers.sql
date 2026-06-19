-- Auto-create user profile when auth user signs up via phone OTP
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, mobile, full_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(REPLACE(NEW.phone, '+91', ''), NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'organisation_employee'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Update last login timestamp
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET last_login_at = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
