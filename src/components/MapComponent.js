import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import { MapPin, AlertTriangle, Clock, X, Tag, User, ChevronRight, Flame, Droplets, Car, Zap, ShieldAlert, HelpCircle, Search } from 'lucide-react';
import { MAPBOX_CONFIG } from '../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapComponent.css';

const MapComponent = ({
  incidents = [],
  userType = 'tourist',
  onMarkerClick,
  isDark = false,
  statusFilter = 'all', 
  setStatusFilter = () => {}
}) => {
  const STREET_STYLE = 'mapbox://styles/mapbox/streets-v12';
  const [viewState, setViewState] = useState({
    longitude: 124.05, // Tubigon, Bohol
    latitude: 10.05,
    zoom: 12
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [highlightedMarker, setHighlightedMarker] = useState(null);
  const [mapStyle] = useState(STREET_STYLE);
  const [pins, setPins] = useState([]);
  const [incidentSearch, setIncidentSearch] = useState('');
  const mapRef = useRef(null);

  // Geocode address to coordinates using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address) => {
    if (!address) return null;

    try {
      // Add "Tubigon, Bohol" to improve geocoding accuracy for local addresses
      const query = `${address}, Tubigon, Bohol, Philippines`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  // Helper: parse PostGIS WKB hex or WKT → {lat, lng}
  const parsePostGISLocation = (hex) => {
    try {
      if (!hex || typeof hex !== 'string') return null;
      console.log('🗺️ Parsing location data:', hex.substring(0, 30) + '...');

      // Handle WKT (Well-known Text) format: POINT(lng lat)
      if (hex.startsWith('POINT(')) {
        const match = hex.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
          const x = parseFloat(match[1]); // Longitude
          const y = parseFloat(match[2]); // Latitude
          console.log(`🗺️ Parsed WKT: lng=${x}, lat=${y}`);
          // Philippines bounds check for auto-correction
          if (y >= 4 && y <= 21 && x >= 116 && x <= 127) return { lat: y, lng: x };
          if (x >= 4 && x <= 21 && y >= 116 && y <= 127) return { lat: x, lng: y };
          return { lat: y, lng: x };
        }
      }

      const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
      
      let offset = -1;
      // Handle the different PostGIS EWKB/WKB headers
      if (clean.includes('0101000020E6100000')) offset = clean.indexOf('0101000020E6100000') + 18;
      else if (clean.startsWith('0101000020')) offset = 18;
      else if (clean.startsWith('0101000000')) offset = 10;
      else if (clean.includes('01010000')) offset = clean.indexOf('01010000') + 10;
      
      if (offset < 0 || clean.length < offset + 32) return null;
      
      const readLE = (h) => {
        const buf = new ArrayBuffer(8);
        const dv = new DataView(buf);
        for (let i = 0; i < 8; i++) {
          dv.setUint8(i, parseInt(h.substring(i * 2, i * 2 + 2), 16));
        }
        return dv.getFloat64(0, true);
      };
      
      const x = readLE(clean.substring(offset, offset + 16));
      const y = readLE(clean.substring(offset + 16, offset + 32));
      
      // Standard WKB 4326 is Longitude (X), Latitude (Y)
      if (y >= -90 && y <= 90 && x >= -180 && x <= 180) {
        // Double check for Philippines bounds (~4-21 lat, ~116-127 lng)
        if (y >= 4 && y <= 21 && x >= 116 && x <= 127) return { lat: y, lng: x };
        // If not in PH, check if X is lat and Y is lng (sometimes swapped)
        if (x >= 4 && x <= 21 && y >= 116 && y <= 127) return { lat: x, lng: y };
        // Fallback to whatever is valid lat
        return { lat: y, lng: x };
      }
    } catch (e) {
      console.error('Map parser error:', e);
    }
    return null;
  };

  // Extract coordinates from incident (database already parses PostGIS)
  const extractCoordinates = (incident) => {
    // 1. Check latitude/longitude fields (already parsed by AdminDashboard/supabase.js)
    if (incident.latitude !== undefined && incident.latitude !== null &&
        incident.longitude !== undefined && incident.longitude !== null) {
      const lat = parseFloat(incident.latitude);
      const lng = parseFloat(incident.longitude);
      if (isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) {
        return { lat, lng };
      }
    }

    // 2. Check all possible location hex fields
    const hex = incident.raw_location || incident.location || incident.coordinates;
    if (hex) {
      const coords = parsePostGISLocation(hex);
      if (coords) return coords;
    }

    return null;
  };

  // Process incidents into pins
  useEffect(() => {
    const processIncidents = async () => {
      if (!incidents || incidents.length === 0) {
        console.log('🗺️ No incidents to process in MapComponent');
        setPins([]);
        return;
      }

      console.log(`🗺️ Processing ${incidents.length} incidents for the map...`);
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      const activeIncidents = incidents.filter(incident => {
        if (!incident) return false;
        if (incident.status !== 'resolved') return true;
        const resolvedTime = new Date(incident.resolved_at || incident.updated_at || incident.created_at).getTime();
        return (now - resolvedTime) < ONE_WEEK_MS;
      });
      
      console.log(`🗺️ ${activeIncidents.length} incidents passed the 'active' filter`);
      
      // First, handle incidents with existing coordinates
      const pinsWithCoords = activeIncidents
        .map(incident => {
          const coords = extractCoordinates(incident);
          if (coords) {
            return {
              ...incident,
              _lat: coords.lat,
              _lng: coords.lng,
              _type: incident.category || 'General',
              _severity: incident.severity || 'medium',
              _status: (incident.status === 'open' || incident.status === 'pending') ? 'open' : (incident.status === 'in_action' ? 'in_progress' : (incident.status || 'open')),
              _address: incident.address || null,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Then, geocode incidents with addresses but no coordinates
      const incidentsToGeocode = activeIncidents.filter(
        incident => !incident.latitude && !incident.longitude && incident.address
      );

      const geocodedPins = [];
      for (const incident of incidentsToGeocode) {
        const coords = await geocodeAddress(incident.address);
        if (coords) {
          geocodedPins.push({
            ...incident,
            _lat: coords.lat,
            _lng: coords.lng,
            _type: incident.category || 'General',
            _severity: incident.severity || 'medium',
            _status: (incident.status === 'open' || incident.status === 'pending') ? 'open' : (incident.status === 'in_action' ? 'in_progress' : (incident.status || 'open')),
            _address: incident.address,
            _geocoded: true, // Mark as geocoded
          });
        }
      }

      // Combine and sort by newest first (created_at descending)
      const allPins = [...pinsWithCoords, ...geocodedPins].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Newest first
      });
      
      setPins(allPins);

      // Auto-fit map to pins if we have any
      if (allPins.length > 0) {
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        allPins.forEach(pin => {
          minLat = Math.min(minLat, pin._lat);
          maxLat = Math.max(maxLat, pin._lat);
          minLng = Math.min(minLng, pin._lng);
          maxLng = Math.max(maxLng, pin._lng);
        });

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const zoom = 12; // Fixed zoom for Tubigon area

        setViewState({
          latitude: centerLat,
          longitude: centerLng,
          zoom
        });
      }
    };

    processIncidents();
  }, [incidents]);

  const getMarkerColor = (status) => {
    // Color based on status only
    const statusColors = {
      open: '#f59e0b',       // Orange
      pending: '#f59e0b',    // Orange
      in_progress: '#3b82f6', // Blue
      in_action: '#3b82f6',  // Blue
      resolved: '#10b981',   // Green
      duplicate: '#8b5cf6'   // Purple
    };
    return statusColors[status] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('fire')) return <Flame size={14} />;
    if (cat.includes('flood') || cat.includes('water')) return <Droplets size={14} />;
    if (cat.includes('traffic') || cat.includes('accident') || cat.includes('vehic')) return <Car size={14} />;
    if (cat.includes('power') || cat.includes('electric')) return <Zap size={14} />;
    if (cat.includes('crime') || cat.includes('theft') || cat.includes('security')) return <ShieldAlert size={14} />;
    return <AlertTriangle size={14} />;
  };

  const statusInfo = (status) => {
    const statusMap = {
      open: { label: 'Open', color: '#f59e0b' },
      pending: { label: 'Open', color: '#f59e0b' },
      in_progress: { label: 'In Progress', color: '#3b82f6' },
      in_action: { label: 'In Progress', color: '#3b82f6' },
      resolved: { label: 'Resolved', color: '#10b981' },
      duplicate: { label: 'Duplicate', color: '#8b5cf6' }
    };
    return statusMap[status] || { label: status || 'Unknown', color: '#6b7280' };
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const ms = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const onClickMarker = useCallback((pin) => {
    // Call onMarkerClick to open the post modal
    if (onMarkerClick) {
      onMarkerClick(pin);
    }
  }, [onMarkerClick]);

  const closePopup = useCallback(() => {
    setSelectedMarker(null);
    setHighlightedMarker(null);
  }, []);

  const onMarkerHover = useCallback((pin) => {
    // Hover preview removed - do nothing
  }, []);

  const onMarkerLeave = useCallback(() => {
    // Hover preview removed - do nothing
  }, []);

  const handleIncidentClick = useCallback((incident) => {
    if (incident._lat && incident._lng) {
      // Use flyTo for smooth animated zoom
      const map = mapRef.current;
      if (map && map.flyTo) {
        map.flyTo({
          center: [incident._lng, incident._lat],
          zoom: 16,
          duration: 1500,
          essential: true
        });
      }
      // Just highlight the marker, don't show popup
      setHighlightedMarker(incident);
    }
  }, []);

  return (
    <div className="map-container">
      {/* Map Controls - Removed style switcher, always uses street view */}
      <div className="map-controls">
        {/* Placeholder for future controls */}
      </div>

      {/* Posts Panel - Right Side */}
      <div className="map-incidents-panel">
        <div className="map-incidents-header">
          <h3>POSTS</h3>
        </div>
        <div className="map-incidents-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={incidentSearch}
            onChange={(e) => setIncidentSearch(e.target.value)}
          />
        </div>
        <div className="map-incidents-list">
          {pins
            .filter(pin => {
              // Filter by status
              if (statusFilter !== 'all' && pin._status !== statusFilter) return false;
              // Filter by search
              if (!incidentSearch) return true;
              const search = incidentSearch.toLowerCase();
              return (
                pin.title?.toLowerCase().includes(search) ||
                pin.address?.toLowerCase().includes(search) ||
                pin.location?.toLowerCase().includes(search) ||
                pin._type?.toLowerCase().includes(search)
              );
            })
            .map((incident, index) => {
              const statusConfig = statusInfo(incident._status);
              const postId = `POST ${String(index + 1).padStart(4, '0')}`;
              return (
                <div
                  key={incident.id}
                  className={`map-incident-card ${highlightedMarker?.id === incident.id ? 'selected' : ''}`}
                  onClick={() => handleIncidentClick(incident)}
                >
                  <div className="map-incident-header-row">
                    <div className="map-incident-id">{postId}</div>
                    <span className="map-incident-status" style={{ backgroundColor: statusConfig.color }}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="map-incident-meta">{incident._type} • {timeAgo(incident.created_at)}</div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        onClick={closePopup}
        mapboxAccessToken={MAPBOX_CONFIG.ACCESS_TOKEN}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" />

        {/* Markers filtered by status */}
        {pins
          .filter(pin => statusFilter === 'all' || pin._status === statusFilter)
          .map(pin => (
          <Marker
            key={pin.id}
            longitude={pin._lng}
            latitude={pin._lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onClickMarker(pin);
            }}
            onMouseEnter={() => onMarkerHover(pin)}
            onMouseLeave={onMarkerLeave}
          >
            <div
              className={`custom-marker ${pin._status} ${pin._geocoded ? 'geocoded' : ''} ${highlightedMarker?.id === pin.id ? 'selected' : ''}`}
              style={{ backgroundColor: getMarkerColor(pin._status) }}
              title={`${pin.title || pin._type} - ${pin._status}`}
            >
              {getCategoryIcon(pin._type)}
            </div>
          </Marker>
        ))}

      </Map>

      {/* Stats Bar */}
      <div className="map-stats">
        <div 
          className={`stat-item ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">Total</span>
          <span className="stat-value">{pins.length}</span>
        </div>
        <div 
          className={`stat-item ${(statusFilter === 'open' || statusFilter === 'pending') ? 'active' : ''}`}
          onClick={() => setStatusFilter('open')}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">Open</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>
            {pins.filter(p => p._status === 'open' || p._status === 'pending').length}
          </span>
        </div>
        <div 
          className={`stat-item ${(statusFilter === 'in_progress' || statusFilter === 'in_action') ? 'active' : ''}`}
          onClick={() => setStatusFilter('in_progress')}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">In Progress</span>
          <span className="stat-value" style={{ color: '#3b82f6' }}>
            {pins.filter(p => p._status === 'in_progress' || p._status === 'in_action').length}
          </span>
        </div>
        <div 
          className={`stat-item ${statusFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('resolved')}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">Resolved</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {pins.filter(p => p._status === 'resolved').length}
          </span>
        </div>
      </div>

      {/* No Data Message */}
      {pins.length === 0 && (
        <div className="no-data-message">
          <MapPin size={48} />
          <h3>No Reports to Display</h3>
          <p>There are currently no reports with valid locations to display on the map.</p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
