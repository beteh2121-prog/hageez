-- Auto-creates a `profiles` row whenever a new auth user is created —
-- whether they signed up through the app's /signup page, were invited via
-- Supabase Dashboard → Authentication → Users → Invite user, or (in the
-- future) signed in via an OAuth provider. Without this, admin accounts
-- created via dashboard invite never get a profiles row, and
-- "UPDATE profiles SET role = 'admin' WHERE email = '...'" silently
-- updates 0 rows.
--
-- Run this once in Supabase Dashboard → SQL Editor, after the main
-- migration from the blueprint.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
