import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import { MapPin, AlertTriangle, Clock, X, Tag, User, ChevronRight } from 'lucide-react';
import { MAPBOX_CONFIG } from '../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapComponent.css';

/* ─────────────────────────────────────────
   Extract a {lat, lng} from ANY incident
   regardless of how the data is stored
   ───────────────────────────────────────── */
const extractCoords = (incident) => {
  // 1) Check if supabase.js already parsed the PostGIS location into lat/lng
  const lat = parseFloat(incident.latitude);
  const lng = parseFloat(incident.longitude);
  if (isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng };
  }

  // 2) coordinates field (JSON object or string)
  if (incident.coordinates) {
    try {
      const c = typeof incident.coordinates === 'string'
        ? JSON.parse(incident.coordinates)
        : incident.coordinates;
      const cLat = parseFloat(c.lat ?? c.latitude);
      const cLng = parseFloat(c.lng ?? c.lon ?? c.longitude);
      if (isFinite(cLat) && isFinite(cLng) && cLat >= -90 && cLat <= 90 && cLng >= -180 && cLng <= 180) {
        return { lat: cLat, lng: cLng };
      }
    } catch (_) { /* ignore */ }
  }

  console.log(`[extractCoords] No valid coords for incident ${incident.id}`);
  return null;
};

/* ─────────────────────────────────────────
   Map Component
   ───────────────────────────────────────── */
const MapComponent = ({
  incidents = [],
  userType = 'tourist',
  onMarkerClick
}) => {
  const [viewState, setViewState] = useState({
    longitude: 121.0,
    latitude: 14.5,
    zoom: 6
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapStyle, setMapStyle] = useState(MAPBOX_CONFIG.DEFAULT_STYLE);
  const [pins, setPins] = useState([]);

  // Process incidents into pins whenever incidents change
  useEffect(() => {
    const results = [];
    incidents.forEach((inc) => {
      const coords = extractCoords(inc);
      if (!coords) return;
      results.push({
        ...inc,
        _lat: coords.lat,
        _lng: coords.lng,
        _type: inc.category || inc.type || 'General',
        _severity: inc.severity || 'medium',
        _status: inc.status || 'pending',
        _address: inc.address || null,
      });
    });

    console.log(`[Map] ${incidents.length} incidents → ${results.length} pins`);
    setPins(results);

    // Auto-fit map to pin bounds
    if (results.length > 0) {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      results.forEach((p) => {
        if (p._lat < minLat) minLat = p._lat;
        if (p._lat > maxLat) maxLat = p._lat;
        if (p._lng < minLng) minLng = p._lng;
        if (p._lng > maxLng) maxLng = p._lng;
      });
      const cLat = (minLat + maxLat) / 2;
      const cLng = (minLng + maxLng) / 2;
      const spread = Math.max(maxLat - minLat, maxLng - minLng, 0.01);
      const zoom = Math.max(5, Math.min(15, 11 - Math.log2(spread)));
      setViewState({ latitude: cLat, longitude: cLng, zoom });
    }
  }, [incidents]);

  const severityColor = (s) => {
    const map = { critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
    return map[s] || '#6b7280';
  };

  const statusInfo = (s) => {
    const map = {
      pending:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
      in_action: { label: 'In Action', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
      resolved:  { label: 'Resolved',  color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
      duplicate: { label: 'Duplicate', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    };
    return map[s] || { label: s || 'Unknown', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' };
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  };

  const onClickMarker = useCallback((pin) => {
    setSelectedMarker(pin);
  }, []);

  const closePopup = useCallback(() => setSelectedMarker(null), []);

  return (
    <div className="map-container">
      {/* Style selector + legend */}
      <div className="map-controls">
        <div className="map-style-selector">
          {MAPBOX_CONFIG.STYLES.map((s) => (
            <button key={s.id} className={`style-btn ${mapStyle === s.style ? 'active' : ''}`} onClick={() => setMapStyle(s.style)}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="map-legend">
          <h4>Severity</h4>
          <div className="legend-items">
            {[['Critical','#dc2626'],['High','#ef4444'],['Medium','#f59e0b'],['Low','#10b981']].map(([l,c]) => (
              <div className="legend-item" key={l}>
                <div className="legend-marker" style={{ backgroundColor: c }} />
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mapbox Map */}
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

        {/* Pins */}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            longitude={pin._lng}
            latitude={pin._lat}
            anchor="bottom"
            onClick={(e) => { e.originalEvent.stopPropagation(); onClickMarker(pin); }}
          >
            <div
              className={`custom-marker ${pin._severity} ${selectedMarker?.id === pin.id ? 'selected' : ''}`}
              style={{ backgroundColor: severityColor(pin._severity) }}
            >
              <AlertTriangle size={14} />
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
                  <h3 className="popup-card-title">{selectedMarker.title || 'Untitled Post'}</h3>
                  <button className="popup-card-close" onClick={closePopup}><X size={14} /></button>
                </div>
                <div className="popup-card-meta">
                  <span className="popup-card-time"><Clock size={12} /> {timeAgo(selectedMarker.created_at)}</span>
                  <span className="popup-card-reporter"><User size={12} /> {selectedMarker.reporter || 'Anonymous'}</span>
                </div>
              </div>

              {selectedMarker.images && selectedMarker.images.length > 0 && (
                <div className="popup-card-image">
                  <img src={selectedMarker.images[0]} alt="Incident" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}

              {selectedMarker.description && (
                <p className="popup-card-desc">
                  {selectedMarker.description.length > 120 ? selectedMarker.description.substring(0, 120) + '...' : selectedMarker.description}
                </p>
              )}

              <div className="popup-card-info">
                <div className="popup-card-info-row"><MapPin size={13} /><span>{selectedMarker._address || 'Location not specified'}</span></div>
                <div className="popup-card-info-row"><Tag size={13} /><span>{selectedMarker._type}</span></div>
              </div>

              <div className="popup-card-tags">
                <span className="popup-tag" style={{ color: severityColor(selectedMarker._severity), background: `${severityColor(selectedMarker._severity)}20`, borderColor: `${severityColor(selectedMarker._severity)}40` }}>
                  {selectedMarker._severity}
                </span>
                <span className="popup-tag" style={{ color: statusInfo(selectedMarker._status).color, background: statusInfo(selectedMarker._status).bg, borderColor: `${statusInfo(selectedMarker._status).color}40` }}>
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

      {/* Stats bar */}
      <div className="map-stats">
        <div className="stat-item"><span className="stat-label">Total</span><span className="stat-value">{pins.length}</span></div>
        <div className="stat-item"><span className="stat-label">Pending</span><span className="stat-value" style={{ color: '#f59e0b' }}>{pins.filter(p => p._status === 'pending').length}</span></div>
        <div className="stat-item"><span className="stat-label">In Action</span><span className="stat-value" style={{ color: '#3b82f6' }}>{pins.filter(p => p._status === 'in_action').length}</span></div>
        <div className="stat-item"><span className="stat-label">Resolved</span><span className="stat-value" style={{ color: '#10b981' }}>{pins.filter(p => p._status === 'resolved').length}</span></div>
      </div>

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
