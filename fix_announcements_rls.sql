  -- ============================================================
  -- FIX: Announcements RLS + grant full access to admins
  -- Run this in Supabase SQL Editor
  -- ============================================================

  -- 1. Drop all existing policies on announcements
  DROP POLICY IF EXISTS "Allow public read access to announcements" ON public.announcements;
  DROP POLICY IF EXISTS "Allow authenticated users to read announcements" ON public.announcements;
  DROP POLICY IF EXISTS "Allow admin full access to announcements" ON public.announcements;
  DROP POLICY IF EXISTS "Allow admins to manage announcements" ON public.announcements;
  DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

  -- 2. Enable RLS (safe to re-run)
  ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

  -- 3. Anyone can read announcements (public app needs this)
  CREATE POLICY "Public can read announcements"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (true);

  -- 4. Admins and super_admins can INSERT
  CREATE POLICY "Admins can create announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

  -- 5. Admins and super_admins can UPDATE
  CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

  -- 6. Admins and super_admins can DELETE
  CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

  -- 7. Grant table-level permissions
  GRANT ALL ON public.announcements TO authenticated;
  GRANT SELECT ON public.announcements TO anon;

  -- 8. Verify your user is actually super_admin
  SELECT id, email, user_type FROM public.profiles 
  WHERE email = 'urbanshield.ad@gmail.com';
