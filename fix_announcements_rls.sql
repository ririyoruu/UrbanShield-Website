-- RLS fix for announcements table
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow public read access to announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to read announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admin full access to announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admins to manage announcements" ON announcements;

-- 3. Create Public Read Access
CREATE POLICY "Allow public read access to announcements"
ON public.announcements FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Create Admin/SuperAdmin Write Access
CREATE POLICY "Allow admins to manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
);

-- 5. Grant permissions (just in case)
GRANT ALL ON public.announcements TO authenticated;
GRANT SELECT ON public.announcements TO anon;
