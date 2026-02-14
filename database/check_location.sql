-- Check location data with proper PostGIS geography functions

SELECT 
  id, 
  title, 
  ST_AsText(location::geometry) as readable_location,
  ST_X(location::geometry) as longitude,
  ST_Y(location::geometry) as latitude
FROM incidents 
LIMIT 5;
