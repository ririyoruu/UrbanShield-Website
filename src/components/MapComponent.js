import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import { MapPin, AlertTriangle, Clock, X, Tag, User, ChevronRight, Moon, Sun, Map as MapIcon, Flame, Droplets, Car, Zap, ShieldAlert, HelpCircle, Search } from 'lucide-react';
import { MAPBOX_CONFIG } from '../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapComponent.css';

const MapComponent = ({
  incidents = [],
  userType = 'tourist',
  onMarkerClick,
  isDark = false
}) => {
  const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
  const LIGHT_STYLE = 'mapbox://styles/mapbox/light-v11';
  const STREET_STYLE = 'mapbox://styles/mapbox/streets-v12';
  const [viewState, setViewState] = useState({
    longitude: 124.05, // Tubigon, Bohol
    latitude: 10.05,
    zoom: 12
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [highlightedMarker, setHighlightedMarker] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [mapStyle, setMapStyle] = useState(MAPBOX_CONFIG.DEFAULT_STYLE);
  const [pins, setPins] = useState([]);
  const [incidentSearch, setIncidentSearch] = useState('');
  const mapRef = useRef(null);

  // Sync map style with site theme
  useEffect(() => {
    setMapStyle((prev) => {
      const isThemeStyle = prev === DARK_STYLE || prev === STREET_STYLE;
      const themeStyle = isDark ? DARK_STYLE : STREET_STYLE;
      if (isThemeStyle && prev !== themeStyle) {
        return themeStyle;
      }
      if (!isThemeStyle && !prev) {
        return themeStyle;
      }
      return prev;
    });
  }, [isDark]);

  // Geocode address to coordinates using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address) => {
    if (!address) return null;

    try {
      // Add "Bohol, Philippines" to improve geocoding accuracy for local addresses
      const query = `${address}, Bohol, Philippines`;
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

  // Extract coordinates from incident (database already parses PostGIS)
  const extractCoordinates = (incident) => {
    // First check if latitude/longitude are already parsed
    if (incident.latitude && incident.longitude) {
      const lat = parseFloat(incident.latitude);
      const lng = parseFloat(incident.longitude);
      if (isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    // If no coordinates but has address, we'll geocode it later
    if (incident.address) {
      return null; // Will be handled in geocoding step
    }

    return null;
  };

  // Process incidents into pins
  useEffect(() => {
    const processIncidents = async () => {
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const now = Date.now();
      
      // Keep resolved posts for 1 week before removing from map
      const activeIncidents = incidents.filter(incident => {
        if (incident.status !== 'resolved') {
          return true; // Keep non-resolved incidents
        }
        // For resolved incidents, check if resolved within last week
        // Use resolved_at, updated_at, or created_at as fallback
        const resolvedTime = new Date(incident.resolved_at || incident.updated_at || incident.created_at).getTime();
        return (now - resolvedTime) < ONE_WEEK_MS;
      });
      
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
              _status: incident.status || 'pending',
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
            _status: incident.status || 'pending',
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
      pending: '#f59e0b',    // Orange for open
      in_action: '#3b82f6',  // Blue for in progress
      resolved: '#10b981',   // Green for resolved
      duplicate: '#8b5cf6'   // Purple for duplicate
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
      pending: { label: 'Open', color: '#f59e0b' },
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
      {/* Map Controls */}
      <div className="map-controls">
        {/* Map Style Switcher - Horizontal Icon Only */}
        <div className="map-style-switcher">
          <button
            className={`style-icon-btn ${mapStyle === 'mapbox://styles/mapbox/dark-v11' ? 'active' : ''}`}
            onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
            title="Dark"
          >
            <Moon size={14} />
          </button>
          <button
            className={`style-icon-btn ${mapStyle === 'mapbox://styles/mapbox/light-v11' ? 'active' : ''}`}
            onClick={() => setMapStyle('mapbox://styles/mapbox/light-v11')}
            title="Light"
          >
            <Sun size={14} />
          </button>
          <button
            className={`style-icon-btn ${mapStyle === STREET_STYLE ? 'active' : ''}`}
            onClick={() => setMapStyle(STREET_STYLE)}
            title="Street"
          >
            <MapIcon size={14} />
          </button>
        </div>
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

        {/* Markers */}
        {pins.map(pin => (
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
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{pins.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Open</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>
            {pins.filter(p => p._status === 'pending').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">In Progress</span>
          <span className="stat-value" style={{ color: '#3b82f6' }}>
            {pins.filter(p => p._status === 'in_action').length}
          </span>
        </div>
        <div className="stat-item">
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
