-- SQL script to create the announcements table and RLS policies
-- Run this in your Supabase SQL Editor if the table doesn't exist

-- Create announcements table from scratch with proper alignment
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    alert_level text DEFAULT 'info' CHECK (alert_level IN ('critical', 'warning', 'info', 'notice')),
    alert_type text, -- e.g., "Health Advisory", "Typhoon Warning"
    areas text, -- e.g., "Barangay Tubigon, Bohol"
    action_items text[], -- array of steps to take
    is_pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for citizens and residents)
CREATE POLICY "Allow public read access to announcements"
ON public.announcements FOR SELECT
TO anon, authenticated
USING (true);

-- Allow Admins and Super Admins full access
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_announcements_alert_level ON announcements(alert_level);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned) WHERE is_pinned = true;
