CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    invited_email text,
    expires_at timestamptz NOT NULL,
    is_used boolean DEFAULT false,
    used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invitation codes"
  ON public.invitation_codes FOR ALL
  USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name text,
    email text,
    phone text,
    department text,
    position text,
    avatar_url text,
    security jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own profile"
  ON public.admin_profiles FOR ALL
  USING (admin_id = auth.uid());
