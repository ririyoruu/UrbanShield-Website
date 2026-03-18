import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import { MapPin, AlertTriangle, Clock, X, Tag, User, ChevronRight, Moon, Sun, Map as MapIcon, Flame, Droplets, Car, Zap, ShieldAlert, HelpCircle } from 'lucide-react';
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
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [mapStyle, setMapStyle] = useState(MAPBOX_CONFIG.DEFAULT_STYLE);
  const [pins, setPins] = useState([]);

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
      const activeIncidents = incidents.filter(incident => incident.status !== 'resolved');
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

      const allPins = [...pinsWithCoords, ...geocodedPins];
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

  const getMarkerColor = (severity, status) => {
    // Status takes priority - resolved incidents are always green
    if (status === 'resolved') {
      return '#10b981'; // Green for resolved
    }

    // For non-resolved, use severity colors
    const severityColors = {
      critical: '#dc2626',
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return severityColors[severity] || '#6b7280';
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
      pending: { label: 'Unconfirmed', color: '#f59e0b' },
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
    // Open post detail modal instead of showing popup
    if (onMarkerClick) {
      onMarkerClick(pin);
    } else {
      setSelectedMarker(pin);
    }
  }, [onMarkerClick]);

  const closePopup = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const onMarkerHover = useCallback((pin) => {
    setHoveredMarker(pin);
  }, []);

  const onMarkerLeave = useCallback(() => {
    setHoveredMarker(null);
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

        {/* Severity Legend */}
        <div className="map-legend">
          <h4>Severity</h4>
          <div className="legend-items">
            {[
              ['Critical', '#dc2626'],
              ['High', '#ef4444'],
              ['Medium', '#f59e0b'],
              ['Low', '#10b981']
            ].map(([label, color]) => (
              <div key={label} className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <Map
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
              className={`custom-marker ${pin._severity} ${pin._status} ${pin._geocoded ? 'geocoded' : ''} ${selectedMarker?.id === pin.id ? 'selected' : ''} ${hoveredMarker?.id === pin.id ? 'hovered' : ''}`}
              style={{ backgroundColor: getMarkerColor(pin._severity, pin._status) }}
              title={`${pin.title || pin._type} - ${pin._status}`}
            >
              {getCategoryIcon(pin._type)}
            </div>
          </Marker>
        ))}

        {/* Hover Preview Modal */}
        {hoveredMarker && !selectedMarker && (
          <div 
            className="hover-preview-modal"
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              pointerEvents: 'none',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start'
            }}
          >
            <div className="hover-preview-modal-content">
              <div className="hover-preview-modal-header">
                <div className="hover-preview-modal-title-section">
                  <h3>{hoveredMarker.title || 'Incident Report'}</h3>
                  <span className="hover-preview-modal-time">{timeAgo(hoveredMarker.created_at)}</span>
                </div>
                <div className="hover-preview-modal-tags">
                  <span className="hover-preview-modal-tag" style={{ background: getMarkerColor(hoveredMarker._severity, hoveredMarker._status) }}>
                    {hoveredMarker._severity || 'unknown'}
                  </span>
                  <span className="hover-preview-modal-tag" style={{ background: statusInfo(hoveredMarker._status).color }}>
                    {statusInfo(hoveredMarker._status).label}
                  </span>
                </div>
              </div>
              
              <div className="hover-preview-modal-body">
                <div className="hover-preview-modal-description">
                  {hoveredMarker.description && hoveredMarker.description.length > 150 
                    ? hoveredMarker.description.substring(0, 150) + '...' 
                    : hoveredMarker.description || 'No description available'}
                </div>
                
                <div className="hover-preview-meta-grid">
                  <div className="hover-preview-meta-item">
                    <MapPin size={14} />
                    <span>{hoveredMarker._address || 'Location not specified'}</span>
                  </div>
                  {hoveredMarker.reporter_name && (
                    <div className="hover-preview-meta-item">
                      <User size={14} />
                      <span>Reported by {hoveredMarker.reporter_name}</span>
                    </div>
                  )}
                  <div className="hover-preview-meta-item">
                    <AlertTriangle size={14} />
                    <span>{hoveredMarker._type || 'General'}</span>
                  </div>
                </div>
              </div>
              
              <div className="hover-preview-modal-footer">
                <div className="hover-preview-hint">
                  <span>📍 Click pin for full details</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popup */}
        {selectedMarker && (
          <Popup
            longitude={selectedMarker._lng}
            latitude={selectedMarker._lat}
            anchor="bottom"
            onClose={closePopup}
            closeButton={false}
            className="modern-popup"
            maxWidth="320px"
            offset={28}
            closeOnClick={false}
          >
            <div className="modern-popup-content">
              {/* Colored accent bar */}
              <div
                className="popup-accent-bar"
                style={{ background: getMarkerColor(selectedMarker._severity, selectedMarker._status) }}
              />

              {/* Header */}
              <div className="popup-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 className="popup-title">{selectedMarker.title || 'Incident Report'}</h4>
                </div>
                <span className="popup-time">{timeAgo(selectedMarker.created_at)}</span>
              </div>

              {/* Tags */}
              <div className="popup-tags">
                <span className="popup-severity-tag" style={{ background: getMarkerColor(selectedMarker._severity, selectedMarker._status) }}>
                  {selectedMarker._severity || 'unknown'}
                </span>
                <span className="popup-status-tag" style={{ background: statusInfo(selectedMarker._status).color }}>
                  {statusInfo(selectedMarker._status).label}
                </span>
                {selectedMarker._type && (
                  <span className="popup-status-tag" style={{ background: '#71717a' }}>
                    {selectedMarker._type}
                  </span>
                )}
              </div>

              <div className="popup-divider" />

              {/* Body */}
              <div className="popup-body">
                <div className="popup-row">
                  <MapPin size={13} />
                  <span>{selectedMarker._address || 'Location not specified'}</span>
                </div>
                {selectedMarker.reporter_name && (
                  <div className="popup-row">
                    <User size={13} />
                    <span>Reported by {selectedMarker.reporter_name}</span>
                  </div>
                )}
                {selectedMarker.created_at && (
                  <div className="popup-row">
                    <Clock size={13} />
                    <span>{new Date(selectedMarker.created_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedMarker.description && (
                  <div className="popup-description">{selectedMarker.description}</div>
                )}
              </div>

              {/* CTA */}
              {onMarkerClick && (
                <button className="popup-action-btn" onClick={() => onMarkerClick(selectedMarker)}>
                  View Full Post <ChevronRight size={14} />
                </button>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Stats Bar */}
      <div className="map-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{pins.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Unconfirmed</span>
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
