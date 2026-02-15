import React, { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import { MapPin, AlertTriangle, Shield, Clock, Users, Info, X, Tag, User, Calendar, ChevronRight } from 'lucide-react';
import { MAPBOX_CONFIG } from '../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapComponent.css';

// Parse PostGIS WKB hex to lat/lng (little-endian)
const parsePostGISHex = (hex) => {
  try {
    if (!hex || typeof hex !== 'string') return null;
    const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
    let offset = 0;
    if (clean.startsWith('0101000020E6100000')) offset = 36;
    else if (clean.startsWith('0101000000')) offset = 10;
    else return null;
    if (clean.length < offset + 32) return null;
    const lonHex = clean.substring(offset, offset + 16);
    const latHex = clean.substring(offset + 16, offset + 32);
    const readLE = (h) => {
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      for (let i = 0; i < 16; i += 2) view.setUint8(i / 2, parseInt(h.substring(i, i + 2), 16));
      return view.getFloat64(0, true);
    };
    const lon = readLE(lonHex);
    const lat = readLE(latHex);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) return { lat, lng: lon };
  } catch (e) {}
  return null;
};

const MapComponent = ({ 
  incidents = [], 
  userType = 'tourist', 
  onIncidentClick,
  showHeatmap = false,
  selectedIncident = null,
  onMarkerClick 
}) => {
  const [viewState, setViewState] = useState(MAPBOX_CONFIG.DEFAULT_CENTER);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapStyle, setMapStyle] = useState(MAPBOX_CONFIG.DEFAULT_STYLE);

  const displayIncidents = useMemo(() => {
    const processed = incidents
      .map((incident) => {
        let coordinates = null;
        
        // Priority 1: latitude/longitude fields (already parsed from PostGIS in supabase.js)
        if (incident.latitude != null && incident.longitude != null) {
          const lat = parseFloat(incident.latitude);
          const lng = parseFloat(incident.longitude);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            coordinates = { lat, lng };
          }
        }
        
        // Priority 2: Parse PostGIS hex from location field directly
        if (!coordinates && incident.location && typeof incident.location === 'string') {
          const clean = incident.location.replace(/[^0-9A-Fa-f]/g, '');
          if (clean.startsWith('010100')) {
            coordinates = parsePostGISHex(incident.location);
          }
        }

        // Priority 3: coordinates field (JSON)
        if (!coordinates && incident.coordinates) {
          try {
            let coords = typeof incident.coordinates === 'string' ? JSON.parse(incident.coordinates) : incident.coordinates;
            if (coords) {
              const lat = parseFloat(coords.lat || coords.latitude);
              const lng = parseFloat(coords.lng || coords.longitude);
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                coordinates = { lat, lng };
              }
            }
          } catch (e) {}
        }

        // Skip incidents with no valid coordinates
        if (!coordinates) return null;
        
        return {
          ...incident,
          coordinates,
          type: incident.category || incident.type || 'General',
          severity: incident.severity || 'medium',
          status: incident.status || 'pending',
          displayAddress: incident.address || null,
          timestamp: incident.created_at ? new Date(incident.created_at).toLocaleString() : 'Unknown',
        };
      })
      .filter(Boolean);
    
    return processed;
  }, [incidents]);

  const getSeverityColor = useCallback((severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }, []);

  const getStatusInfo = useCallback((status) => {
    switch (status) {
      case 'pending': return { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'in_action': return { label: 'In Action', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'resolved': return { label: 'Resolved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'duplicate': return { label: 'Duplicate', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
      default: return { label: status || 'Unknown', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' };
    }
  }, []);

  const handleMarkerClick = useCallback((incident) => {
    setSelectedMarker(incident);
    if (onMarkerClick) onMarkerClick(incident);
  }, [onMarkerClick]);

  const handleClosePopup = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const mapStyles = MAPBOX_CONFIG.STYLES;

  return (
    <div className="map-container">
      <div className="map-controls">
        <div className="map-style-selector">
          {mapStyles.map((style) => (
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
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#dc2626' }}></div>
              <span>Critical</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#ef4444' }}></div>
              <span>High</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#f59e0b' }}></div>
              <span>Medium</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker" style={{ backgroundColor: '#10b981' }}></div>
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_CONFIG.ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" />

        {displayIncidents.map((incident) => (
          <Marker
            key={incident.id}
            longitude={incident.coordinates.lng}
            latitude={incident.coordinates.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(incident);
            }}
          >
            <div 
              className={`custom-marker ${incident.severity} ${selectedMarker?.id === incident.id ? 'selected' : ''}`}
              style={{ backgroundColor: getSeverityColor(incident.severity) }}
            >
              <AlertTriangle size={14} />
            </div>
          </Marker>
        ))}

        {selectedMarker && (
          <Popup
            longitude={selectedMarker.coordinates.lng}
            latitude={selectedMarker.coordinates.lat}
            anchor="top"
            onClose={handleClosePopup}
            closeButton={false}
            className="custom-popup"
            maxWidth="320px"
            offset={12}
          >
            <div className="popup-card">
              {/* Top accent bar */}
              <div className="popup-accent" style={{ background: getSeverityColor(selectedMarker.severity) }} />

              {/* Header */}
              <div className="popup-card-header">
                <div className="popup-card-title-row">
                  <h3 className="popup-card-title">{selectedMarker.title || 'Untitled Post'}</h3>
                  <button className="popup-card-close" onClick={handleClosePopup}>
                    <X size={14} />
                  </button>
                </div>
                <div className="popup-card-meta">
                  <span className="popup-card-time">
                    <Clock size={12} />
                    {formatTimeAgo(selectedMarker.created_at)}
                  </span>
                  <span className="popup-card-reporter">
                    <User size={12} />
                    {selectedMarker.reporter || 'Anonymous'}
                  </span>
                </div>
              </div>

              {/* Image preview if available */}
              {selectedMarker.images && selectedMarker.images.length > 0 && (
                <div className="popup-card-image">
                  <img 
                    src={selectedMarker.images[0]} 
                    alt="Incident" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Description */}
              {selectedMarker.description && (
                <p className="popup-card-desc">
                  {selectedMarker.description.length > 120 
                    ? selectedMarker.description.substring(0, 120) + '...' 
                    : selectedMarker.description}
                </p>
              )}

              {/* Info rows */}
              <div className="popup-card-info">
                <div className="popup-card-info-row">
                  <MapPin size={13} />
                  <span>{selectedMarker.displayAddress || selectedMarker.address || 'Location not specified'}</span>
                </div>
                <div className="popup-card-info-row">
                  <Tag size={13} />
                  <span>{selectedMarker.type}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="popup-card-tags">
                <span 
                  className="popup-tag severity-tag" 
                  style={{ 
                    color: getSeverityColor(selectedMarker.severity),
                    background: `${getSeverityColor(selectedMarker.severity)}20`,
                    borderColor: `${getSeverityColor(selectedMarker.severity)}40`
                  }}
                >
                  {selectedMarker.severity}
                </span>
                <span 
                  className="popup-tag status-tag" 
                  style={{ 
                    color: getStatusInfo(selectedMarker.status).color,
                    background: getStatusInfo(selectedMarker.status).bg,
                    borderColor: `${getStatusInfo(selectedMarker.status).color}40`
                  }}
                >
                  {getStatusInfo(selectedMarker.status).label}
                </span>
              </div>

              {/* View details button */}
              {onMarkerClick && (
                <button 
                  className="popup-card-btn"
                  onClick={() => onMarkerClick(selectedMarker)}
                >
                  View Details
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Map Statistics */}
      <div className="map-stats">
        <div className="stat-item">
          <span className="stat-label">Total Posts</span>
          <span className="stat-value">{displayIncidents.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>
            {displayIncidents.filter(i => i.status === 'pending').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">In Action</span>
          <span className="stat-value" style={{ color: '#3b82f6' }}>
            {displayIncidents.filter(i => i.status === 'in_action').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Resolved</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {displayIncidents.filter(i => i.status === 'resolved').length}
          </span>
        </div>
      </div>

      {displayIncidents.length === 0 && (
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

