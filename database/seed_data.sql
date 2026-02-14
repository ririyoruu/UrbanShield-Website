-- Seed Data for Incident Moderation System
-- This file contains sample data to test the moderation workflow

-- Insert sample users with different roles
INSERT INTO profiles (id, email, full_name, role, avatar_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@emergency.com', 'Admin User', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'responder@emergency.com', 'Fire Department', 'responder', 'https://api.dicebear.com/7.x/avataaars/svg?seed=responder'),
  ('550e8400-e29b-41d4-a716-446655440003', 'gov@emergency.com', 'Government Agency', 'government', 'https://api.dicebear.com/7.x/avataaars/svg?seed=gov'),
  ('550e8400-e29b-41d4-a716-446655440004', 'user1@example.com', 'John Citizen', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1'),
  ('550e8400-e29b-41d4-a716-446655440005', 'user2@example.com', 'Jane Smith', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2')
ON CONFLICT (email) DO NOTHING;

-- Insert sample incidents with different statuses
INSERT INTO incidents (
  id, title, description, category, severity, location, latitude, longitude, 
  status, reporter_id, created_at, updated_at
) VALUES
  -- Pending incidents
  ('660e8400-e29b-41d4-a716-446655440001', 
   'Fire on Main Street', 
   'Large fire visible from downtown area, smoke coming from commercial building', 
   'fire', 'high', '123 Main St, Downtown', 40.7128, -74.0060,
   'pending', '550e8400-e29b-41d4-a716-446655440004', 
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
   
  ('660e8400-e29b-41d4-a716-446655440002', 
   'Flooding on Highway 101', 
   'Road completely flooded after heavy rain, cars stuck in water', 
   'flood', 'medium', 'Highway 101 near Exit 5', 34.0522, -118.2437,
   'pending', '550e8400-e29b-41d4-a716-446655440005', 
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
   
  -- In Action incidents
  ('660e8400-e29b-41d4-a716-446655440003', 
   'Car Accident on Interstate', 
   'Multi-vehicle collision blocking all lanes', 
   'accident', 'high', 'I-95 North Mile 42', 42.3601, -71.0589,
   'in_action', '550e8400-e29b-41d4-a716-446655440004', 
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '3 hours'),
   
  ('660e8400-e29b-41d4-a716-446655440004', 
   'Gas Leak Detected', 
   'Strong smell of gas near residential area', 
   'hazard', 'critical', 'Oak Street Residential Area', 41.8781, -87.6298,
   'in_action', '550e8400-e29b-41d4-a716-446655440005', 
   NOW() - INTERVAL '8 hours', NOW() - INTERVAL '5 hours'),
   
  -- Resolved incidents
  ('660e8400-e29b-41d4-a716-446655440005', 
   'Power Outage in Suburb', 
   'Entire neighborhood without electricity', 
   'utility', 'medium', 'Pine Hills Subdivision', 33.7490, -84.3880,
   'resolved', '550e8400-e29b-41d4-a716-446655440004', 
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '10 hours'),
   
  ('660e8400-e29b-41d4-a716-446655440006', 
   'Tree Down on Road', 
   'Large fallen tree blocking traffic', 
   'obstacle', 'low', 'Elm Street', 39.7392, -104.9903,
   'resolved', '550e8400-e29b-41d4-a716-446655440005', 
   NOW() - INTERVAL '24 hours', NOW() - INTERVAL '20 hours'),
   
  -- Duplicate incidents (for testing duplicate detection)
  ('660e8400-e29b-41d4-a716-446655440007', 
   'Fire on Main Street', 
   'Building on fire with lots of smoke', 
   'fire', 'high', 'Main Street Downtown', 40.7128, -74.0060,
   'duplicate', '550e8400-e29b-41d4-a716-446655440005', 
   NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
   
  ('660e8400-e29b-41d4-a716-446655440008', 
   'Highway Flooding', 
   'Road underwater after storm', 
   'flood', 'medium', 'Highway 101', 34.0522, -118.2437,
   'duplicate', '550e8400-e29b-41d4-a716-446655440004', 
   NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Update resolved incidents with resolution details
UPDATE incidents 
SET 
  admin_notes = 'Power company dispatched and restored power to all affected homes',
  proof_url = 'https://example.com/proof/power_restored.jpg',
  resolved_at = updated_at,
  resolved_by = '550e8400-e29b-41d4-a716-446655440001'
WHERE id = '660e8400-e29b-41d4-a716-446655440005';

UPDATE incidents 
SET 
  admin_notes = 'Public works removed tree and cleared roadway',
  proof_url = 'https://example.com/proof/tree_removed.jpg',
  resolved_at = updated_at,
  resolved_by = '550e8400-e29b-41d4-a716-446655440001'
WHERE id = '660e8400-e29b-41d4-a716-446655440006';

-- Update in_action incidents with assigned responders
UPDATE incidents 
SET assigned_responder_id = '550e8400-e29b-41d4-a716-446655440002'
WHERE id IN ('660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004');

-- Insert sample incident images
INSERT INTO incident_images (incident_id, image_url, uploaded_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'https://picsum.photos/seed/fire1/800/600.jpg', NOW() - INTERVAL '2 hours'),
  ('660e8400-e29b-41d4-a716-446655440001', 'https://picsum.photos/seed/fire2/800/600.jpg', NOW() - INTERVAL '2 hours'),
  ('660e8400-e29b-41d4-a716-446655440002', 'https://picsum.photos/seed/flood1/800/600.jpg', NOW() - INTERVAL '4 hours'),
  ('660e8400-e29b-41d4-a716-446655440003', 'https://picsum.photos/seed/accident1/800/600.jpg', NOW() - INTERVAL '6 hours'),
  ('660e8400-e29b-41d4-a716-446655440003', 'https://picsum.photos/seed/accident2/800/600.jpg', NOW() - INTERVAL '6 hours'),
  ('660e8400-e29b-41d4-a716-446655440004', 'https://picsum.photos/seed/gasleak1/800/600.jpg', NOW() - INTERVAL '8 hours'),
  ('660e8400-e29b-41d4-a716-446655440005', 'https://picsum.photos/seed/power1/800/600.jpg', NOW() - INTERVAL '12 hours'),
  ('660e8400-e29b-41d4-a716-446655440006', 'https://picsum.photos/seed/tree1/800/600.jpg', NOW() - INTERVAL '24 hours')
ON CONFLICT DO NOTHING;

-- Insert activity log entries
INSERT INTO incident_activity_log (incident_id, action, performed_by, details, created_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'created', '550e8400-e29b-41d4-a716-446655440004', 
   jsonb_build_object('title', 'Fire on Main Street', 'category', 'fire'), NOW() - INTERVAL '2 hours'),
   
  ('660e8400-e29b-41d4-a716-446655440003', 'created', '550e8400-e29b-41d4-a716-446655440004', 
   jsonb_build_object('title', 'Car Accident on Interstate', 'category', 'accident'), NOW() - INTERVAL '6 hours'),
  ('660e8400-e29b-41d4-a716-446655440003', 'start_action', '550e8400-e29b-41d4-a716-446655440001', 
   jsonb_build_object('old_status', 'pending', 'new_status', 'in_action'), NOW() - INTERVAL '3 hours'),
   
  ('660e8400-e29b-41d4-a716-446655440005', 'created', '550e8400-e29b-41d4-a716-446655440004', 
   jsonb_build_object('title', 'Power Outage in Suburb', 'category', 'utility'), NOW() - INTERVAL '12 hours'),
  ('660e8400-e29b-41d4-a716-446655440005', 'start_action', '550e8400-e29b-41d4-a716-446655440001', 
   jsonb_build_object('old_status', 'pending', 'new_status', 'in_action'), NOW() - INTERVAL '11 hours'),
  ('660e8400-e29b-41d4-a716-446655440005', 'resolved', '550e8400-e29b-41d4-a716-446655440001', 
   jsonb_build_object('old_status', 'in_action', 'new_status', 'resolved', 'admin_notes', 'Power company dispatched'), NOW() - INTERVAL '10 hours'),
   
  ('660e8400-e29b-41d4-a716-446655440007', 'flagged_duplicate', NULL, 
   jsonb_build_object('duplicate_of', '660e8400-e29b-41d4-a716-446655440001', 'similarity_score', 0.85), NOW() - INTERVAL '1 hour'),
   
  ('660e8400-e29b-41d4-a716-446655440008', 'flagged_duplicate', NULL, 
   jsonb_build_object('duplicate_of', '660e8400-e29b-41d4-a716-446655440002', 'similarity_score', 0.72), NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- Insert duplicate candidates for testing
INSERT INTO duplicate_candidates (incident_id, duplicate_of_id, similarity_score, detection_method, created_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440001', 0.85, 'Title and Category Match', NOW() - INTERVAL '1 hour'),
  ('660e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440002', 0.72, 'Title and Location Match', NOW() - INTERVAL '3 hours')
ON CONFLICT (incident_id, duplicate_of_id) DO NOTHING;

-- Print summary
DO $$
DECLARE
  pending_count INTEGER;
  in_action_count INTEGER;
  resolved_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count FROM incidents WHERE status = 'pending';
  SELECT COUNT(*) INTO in_action_count FROM incidents WHERE status = 'in_action';
  SELECT COUNT(*) INTO resolved_count FROM incidents WHERE status = 'resolved';
  SELECT COUNT(*) INTO duplicate_count FROM incidents WHERE status = 'duplicate';
  
  RAISE NOTICE '=== Seed Data Summary ===';
  RAISE NOTICE 'Users created: 5';
  RAISE NOTICE 'Incidents created: 8';
  RAISE NOTICE '  - Pending: %', pending_count;
  RAISE NOTICE '  - In Action: %', in_action_count;
  RAISE NOTICE '  - Resolved: %', resolved_count;
  RAISE NOTICE '  - Duplicate: %', duplicate_count;
  RAISE NOTICE 'Images created: 8';
  RAISE NOTICE 'Activity log entries: 8';
  RAISE NOTICE 'Duplicate candidates: 2';
  RAISE NOTICE '========================';
END $$;
