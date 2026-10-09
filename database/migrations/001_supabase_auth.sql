-- Link public.users to Supabase Auth. Additive: legacy bcrypt rows keep working until the cutover PR removes them.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- NOT VALID: enforced for new rows, legacy rows with no auth.users entry are tolerated.
ALTER TABLE users
  ADD CONSTRAINT users_id_fkey_auth FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base TEXT := regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'user'),
    '[^a-zA-Z0-9_]', '', 'g');
BEGIN
  IF length(base) < 3 THEN base := 'user'; END IF;
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, left(base, 40) || '_' || substr(md5(random()::text), 1, 5))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
