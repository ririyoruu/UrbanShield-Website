import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import { MapPin, AlertTriangle, Clock, X, Tag, User, ChevronRight } from 'lucide-react';
import { MAPBOX_CONFIG } from '../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapComponent.css';

const MapComponent = ({
  incidents = [],
  userType = 'tourist',
  onMarkerClick
}) => {
  const [viewState, setViewState] = useState({
    longitude: 124.05, // Tubigon, Bohol
    latitude: 10.05,
    zoom: 12
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapStyle, setMapStyle] = useState(MAPBOX_CONFIG.DEFAULT_STYLE);
  const [pins, setPins] = useState([]);

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
      // First, handle incidents with existing coordinates
      const pinsWithCoords = incidents
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
      const incidentsToGeocode = incidents.filter(
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

  const severityColor = (severity) => {
    const colors = {
      critical: '#dc2626',
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  const statusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: '#f59e0b' },
      in_action: { label: 'In Action', color: '#3b82f6' },
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
    setSelectedMarker(pin);
  }, []);

  const closePopup = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  return (
    <div className="map-container">
      {/* Map Controls */}
      <div className="map-controls">
        <div className="map-style-selector">
          {MAPBOX_CONFIG.STYLES.map(style => (
            <button
              key={style.id}
              className={`style-btn ${mapStyle === style.style ? 'active' : ''}`}
              onClick={() => setMapStyle(style.style)}
            >
              {style.name}
            </button>
          ))}
        </div>
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
          >
            <div
              className={`custom-marker ${pin._severity} ${pin._geocoded ? 'geocoded' : ''} ${selectedMarker?.id === pin.id ? 'selected' : ''}`}
              style={{ backgroundColor: severityColor(pin._severity) }}
              title={pin._geocoded ? `Location geocoded from: ${pin._address}` : 'Exact coordinates'}
            >
              <AlertTriangle size={14} />
              {pin._geocoded && (
                <div className="geocode-indicator">
                  <MapPin size={8} />
                </div>
              )}
            </div>
          </Marker>
        ))}

        {/* Popup */}
        {selectedMarker && (
          <Popup
            longitude={selectedMarker._lng}
            latitude={selectedMarker._lat}
            anchor="top"
            onClose={closePopup}
            closeButton={false}
            className="custom-popup"
            maxWidth="320px"
            offset={12}
          >
            <div className="popup-card">
              <div className="popup-accent" style={{ background: severityColor(selectedMarker._severity) }} />
              
              <div className="popup-card-header">
                <div className="popup-card-title-row">
                  <h3 className="popup-card-title">
                    {selectedMarker.title || selectedMarker.description || 'Incident'}
                  </h3>
                  <button className="popup-card-close" onClick={closePopup}>
                    <X size={14} />
                  </button>
                </div>
                <div className="popup-card-meta">
                  <span className="popup-card-time">
                    <Clock size={12} /> {timeAgo(selectedMarker.created_at)}
                  </span>
                  <span className="popup-card-reporter">
                    <User size={12} /> {selectedMarker.reporter || 'Anonymous'}
                  </span>
                </div>
              </div>

              {selectedMarker.images && selectedMarker.images.length > 0 && (
                <div className="popup-card-image">
                  <img 
                    src={selectedMarker.images[0]} 
                    alt="Incident" 
                    onError={(e) => { e.target.style.display = 'none'; }} 
                  />
                </div>
              )}

              {selectedMarker.description && (
                <p className="popup-card-desc">
                  {selectedMarker.description.length > 120 
                    ? selectedMarker.description.substring(0, 120) + '...'
                    : selectedMarker.description}
                </p>
              )}

              <div className="popup-card-info">
                <div className="popup-card-info-row">
                  <MapPin size={13} />
                  <span>{selectedMarker._address || 'Location not specified'}</span>
                </div>
                {selectedMarker._geocoded && (
                  <div className="popup-card-info-row" style={{color: '#3b82f6'}}>
                    <MapPin size={13} />
                    <span>📍 Location geocoded from address</span>
                  </div>
                )}
                <div className="popup-card-info-row">
                  <Tag size={13} />
                  <span>{selectedMarker._type}</span>
                </div>
              </div>

              <div className="popup-card-tags">
                <span 
                  className="popup-tag" 
                  style={{ 
                    color: severityColor(selectedMarker._severity), 
                    background: `${severityColor(selectedMarker._severity)}20`,
                    borderColor: `${severityColor(selectedMarker._severity)}40`
                  }}
                >
                  {selectedMarker._severity}
                </span>
                <span 
                  className="popup-tag"
                  style={{
                    color: statusInfo(selectedMarker._status).color,
                    background: statusInfo(selectedMarker._status).bg,
                    borderColor: `${statusInfo(selectedMarker._status).color}40`
                  }}
                >
                  {statusInfo(selectedMarker._status).label}
                </span>
              </div>

              {onMarkerClick && (
                <button className="popup-card-btn" onClick={() => onMarkerClick(selectedMarker)}>
                  View Details <ChevronRight size={14} />
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
          <span className="stat-label">Pending</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>
            {pins.filter(p => p._status === 'pending').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">In Action</span>
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
          <h3>No Posts to Display</h3>
          <p>There are currently no posts with valid locations to display on the map.</p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
