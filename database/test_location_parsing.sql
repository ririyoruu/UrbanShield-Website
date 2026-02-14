-- Test location parsing - check if coordinates are being extracted correctly

-- 1. Check raw location data vs extracted coordinates
SELECT 
  id,
  title,
  location as raw_location,
  CASE 
    WHEN location IS NOT NULL THEN 'Has location data'
    ELSE 'No location data'
  END as location_status,
  -- Try to extract coordinates using PostGIS functions
  CASE 
    WHEN location IS NOT NULL THEN ST_AsText(location::geometry)
    ELSE 'NULL'
  END as readable_point,
  -- Extract lat/lng
  CASE 
    WHEN location IS NOT NULL THEN ST_Y(location::geometry)::text
    ELSE 'NULL'
  END as latitude,
  CASE 
    WHEN location IS NOT NULL THEN ST_X(location::geometry)::text
    ELSE 'NULL'
  END as longitude
FROM incidents 
LIMIT 3;
