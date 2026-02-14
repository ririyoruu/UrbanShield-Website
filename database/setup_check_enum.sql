-- First, check what ENUM values already exist
SELECT 
  unnest(enumlabel) as enum_value
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'incident_status'
);
