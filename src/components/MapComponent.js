import React, { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import { MapPin, AlertTriangle, Shield, Clock, Users, Info, X } from 'lucide-react';
import { MAPBOX_CONFIG } from '../config/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapComponent.css';

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

  // Process incidents from database to ensure they have coordinates
  const displayIncidents = useMemo(() => {
    console.log('Processing incidents for map. Total incidents:', incidents.length);
    console.log('Sample incident structure:', incidents[0]);
    
    const processed = incidents
      .map((incident, index) => {
        let coordinates = null;
        
        // Priority 1: Check if incident has latitude and longitude fields (most common)
        if (incident.latitude != null && incident.longitude != null) {
          const lat = parseFloat(incident.latitude);
          const lng = parseFloat(incident.longitude);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            coordinates = { lat, lng };
            console.log(`Incident ${index} (${incident.id}): Using latitude/longitude fields:`, coordinates);
          }
        }
        
        // Priority 2: Check if incident has coordinates field (JSON format)
        if (!coordinates && incident.coordinates) {
          try {
            let coords = incident.coordinates;
            if (typeof coords === 'string') {
              coords = JSON.parse(coords);
            }
            if (coords && (coords.lat != null || coords.latitude != null) && (coords.lng != null || coords.longitude != null)) {
              const lat = parseFloat(coords.lat || coords.latitude);
              const lng = parseFloat(coords.lng || coords.longitude);
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                coordinates = { lat, lng };
                console.log(`Incident ${index} (${incident.id}): Using coordinates field:`, coordinates);
              }
            }
          } catch (e) {
            console.error(`Error parsing coordinates for incident ${incident.id}:`, e);
          }
        }
        
        // Priority 3: Try to extract coordinates from location string if it contains lat/lng
        if (!coordinates && incident.location) {
          const latMatch = incident.location.match(/lat[:\s]*([0-9.-]+)/i);
          const lngMatch = incident.location.match(/lng[:\s]*([0-9.-]+)/i);
          if (latMatch && lngMatch) {
            const lat = parseFloat(latMatch[1]);
            const lng = parseFloat(lngMatch[1]);
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              coordinates = { lat, lng };
              console.log(`Incident ${index} (${incident.id}): Extracted coordinates from location:`, coordinates);
            }
          }
        }
        
        // If no coordinates found at all, use default center location as fallback
        // This ensures ALL incidents are displayed on the map, even without exact coordinates
        if (!coordinates) {
          console.warn(`⚠️ Incident ${index} (${incident.id}) "${incident.title || 'Untitled'}" has no valid coordinates. Using default location.`, {
            hasLatitude: incident.latitude != null,
            hasLongitude: incident.longitude != null,
            hasCoordinates: incident.coordinates != null,
            latitude: incident.latitude,
            longitude: incident.longitude,
            coordinates: incident.coordinates,
            location: incident.location
          });
          
          // Use default map center with slight variation to avoid overlapping markers
          // Each incident without coordinates gets a slightly different position
          const defaultLat = MAPBOX_CONFIG.DEFAULT_CENTER.latitude + (Math.random() - 0.5) * 0.01;
          const defaultLng = MAPBOX_CONFIG.DEFAULT_CENTER.longitude + (Math.random() - 0.5) * 0.01;
          coordinates = { 
            lat: defaultLat, 
            lng: defaultLng,
            isFallback: true // Flag to indicate this is a fallback location
          };
        }
        
        const processedIncident = {
          ...incident,
          coordinates,
          // Map database fields to display fields
          type: incident.category || incident.type || 'General',
          severity: incident.severity || 'medium',
          status: incident.status || 'pending',
          timestamp: incident.created_at ? new Date(incident.created_at).toLocaleString() : 'Unknown',
          safetyScore: incident.safety_score || 75
        };
        
        return processedIncident;
      });
      // All incidents are now displayed - those without exact coordinates use fallback location
    
    // Calculate summary statistics
    const withExactCoords = processed.filter(i => i?.coordinates && !i.coordinates.isFallback).length;
    const withFallbackCoords = processed.filter(i => i?.coordinates?.isFallback).length;
    
    console.log(`🗺️ Map Display Summary:`);
    console.log(`   Total incidents received: ${incidents.length}`);
    console.log(`   Incidents displayed: ${processed.length}`);
    console.log(`   With exact coordinates: ${withExactCoords}`);
    console.log(`   With fallback coordinates: ${withFallbackCoords}`);
    
    return processed;
  }, [incidents]);

  const getSeverityColor = useCallback((severity) => {
    switch (severity) {
      case 'critical': return '#dc2626'; // Dark red
      case 'high': return '#ef4444';     // Red
      case 'medium': return '#f59e0b';   // Orange
      case 'low': return '#10b981';      // Green
      default: return '#6b7280';         // Gray
    }
  }, []);

  const getIncidentIcon = useCallback((type) => {
    switch (type) {
      case 'Traffic': return <AlertTriangle size={16} />;
      case 'Infrastructure': return <MapPin size={16} />;
      case 'Construction': return <Users size={16} />;
      case 'Weather': return <Shield size={16} />;
      case 'Event': return <Info size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  }, []);

  const handleMarkerClick = useCallback((incident) => {
    setSelectedMarker(incident);
    if (onMarkerClick) {
      onMarkerClick(incident);
    }
  }, [onMarkerClick]);

  const handleClosePopup = useCallback(() => {
    setSelectedMarker(null);
  }, []);

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
          <h4>Severity Levels</h4>
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
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" />

        {/* Incident Markers */}
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
              className={`custom-marker ${incident.severity}`}
              style={{ 
                backgroundColor: getSeverityColor(incident.severity),
                border: selectedMarker?.id === incident.id ? '3px solid white' : 'none'
              }}
            >
              {getIncidentIcon(incident.type)}
            </div>
          </Marker>
        ))}

        {/* Popup for selected marker */}
        {selectedMarker && (
          <Popup
            longitude={selectedMarker.coordinates.lng}
            latitude={selectedMarker.coordinates.lat}
            anchor="top"
            onClose={handleClosePopup}
            closeButton={false}
            className="custom-popup"
          >
            <div className="popup-content">
              <div className="popup-header">
                <div className="popup-title">
                  <div className="popup-icon" style={{ color: getSeverityColor(selectedMarker.severity) }}>
                    {getIncidentIcon(selectedMarker.type)}
                  </div>
                  <h3>{selectedMarker.title}</h3>
                </div>
                <button className="popup-close" onClick={handleClosePopup}>
                  <X size={16} />
                </button>
              </div>
              
              <div className="popup-body">
                <p className="popup-description">{selectedMarker.description}</p>
                
                {selectedMarker.coordinates?.isFallback && (
                  <div className="popup-warning" style={{ 
                    backgroundColor: '#fef3c7', 
                    color: '#92400e', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    marginBottom: '12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={14} />
                    <span>Approximate location - exact coordinates not available</span>
                  </div>
                )}
                
                <div className="popup-details">
                  <div className="popup-detail">
                    <MapPin size={14} />
                    <span>{selectedMarker.address || selectedMarker.location || 'Location not specified'}</span>
                  </div>
                  <div className="popup-detail">
                    <Clock size={14} />
                    <span>{selectedMarker.timestamp}</span>
                  </div>
                  {selectedMarker.safetyScore && (
                    <div className="popup-detail">
                      <Shield size={14} />
                      <span>Safety: {selectedMarker.safetyScore}%</span>
                    </div>
                  )}
                </div>

                <div className="popup-badges">
                  <span 
                    className="severity-badge" 
                    style={{ backgroundColor: getSeverityColor(selectedMarker.severity) }}
                  >
                    {selectedMarker.severity}
                  </span>
                  <span className="type-badge">{selectedMarker.type}</span>
                  <span className={`status-badge ${selectedMarker.status}`}>
                    {selectedMarker.status}
                  </span>
                </div>

                {userType === 'admin' && selectedMarker.status === 'active' && (
                  <div className="popup-actions">
                    <button className="btn-approve">Approve</button>
                    <button className="btn-reject">Reject</button>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map Statistics */}
      <div className="map-stats">
        <div className="stat-item">
          <span className="stat-label">Total Incidents</span>
          <span className="stat-value">{displayIncidents.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value">
            {displayIncidents.filter(i => i.status === 'pending').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">In Action</span>
          <span className="stat-value">
            {displayIncidents.filter(i => i.status === 'in_action').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Resolved</span>
          <span className="stat-value">
            {displayIncidents.filter(i => i.status === 'resolved').length}
          </span>
        </div>
      </div>

      {/* No Data Message */}
      {displayIncidents.length === 0 && (
        <div className="no-data-message">
          <MapPin size={48} />
          <h3>No Incidents Reported</h3>
          <p>There are currently no incidents to display on the map. Check back later for updates.</p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;

