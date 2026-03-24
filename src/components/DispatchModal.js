import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { adminService } from '../config/supabase';
import './DispatchModal.css';

const DispatchModal = ({ responder, onClose, onConfirm }) => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [searchTerm, categoryFilter, priorityFilter, incidents]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      let data = [];
      try {
        data = await adminService.getAllReports();
        // Filter for active/pending incidents only
        data = data.filter(inc => inc.status === 'pending' || inc.status === 'active');
      } catch (err) {
        console.log('Using sample incident data');
      }
      
      if (data.length === 0) {
        data = getSampleIncidents();
      }
      
      setIncidents(data);
    } catch (error) {
      console.error('Error loading incidents:', error);
      setIncidents(getSampleIncidents());
    } finally {
      setLoading(false);
    }
  };

  const getSampleIncidents = () => [
    {
      id: '1',
      title: 'Multi-vehicle accident on I-95',
      location: 'I-95 Northbound, Mile 42',
      category: 'Traffic Accident',
      priority: 'critical',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      description: '3-car pile-up involving a semi-truck. Reports of injuries. Lane closure in effect.',
      respondersAssigned: 1
    },
    {
      id: '2',
      title: 'Protest escalation – City Hall',
      location: 'City Hall Plaza',
      category: 'Public Safety',
      priority: 'high',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      description: 'Large gathering becoming unruly. Police presence requested.',
      respondersAssigned: 0
    },
    {
      id: '3',
      title: 'Medical emergency at shopping center',
      location: 'Westfield Mall, Food Court',
      category: 'Medical',
      priority: 'high',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      description: 'Person collapsed, CPR in progress. Ambulance requested.',
      respondersAssigned: 0
    },
    {
      id: '4',
      title: 'Fire alarm at residential building',
      location: 'Oak Towers, 5th Avenue',
      category: 'Fire',
      priority: 'medium',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      description: 'Smoke detector activated on 12th floor. Residents evacuating.',
      respondersAssigned: 0
    },
    {
      id: '5',
      title: 'Suspicious package reported',
      location: 'Central Station, Platform 3',
      category: 'Security',
      priority: 'high',
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      description: 'Unattended bag reported. Area being cordoned off.',
      respondersAssigned: 0
    }
  ];

  const filterIncidents = () => {
    let filtered = incidents;

    if (searchTerm) {
      filtered = filtered.filter(inc => 
        inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(inc => inc.category === categoryFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(inc => inc.priority === priorityFilter);
    }

    setFilteredIncidents(filtered);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    if (!priority) return 'Not Available';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const incidentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - incidentTime) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return incidentTime.toLocaleDateString();
  };

  const handleIncidentSelect = (incident) => {
    setSelectedIncident(incident);
  };

  const handleConfirmDispatch = () => {
    if (selectedIncident) {
      onConfirm(selectedIncident);
    }
  };

  return (
    <div className="dispatch-modal-overlay" onClick={onClose}>
      <div className="dispatch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dispatch-header">
          <div className="dispatch-title-section">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            <div>
              <h2>Dispatch Responder</h2>
              <p className="dispatch-subtitle">
                Assigning <strong>{responder.name}</strong> — {responder.position}
              </p>
            </div>
          </div>
          <button className="dispatch-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="dispatch-body">
          <div className="dispatch-search">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search incidents by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dispatch-filters">
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="dispatch-filter"
            >
              <option value="all">All Categories</option>
              <option value="Traffic Accident">Traffic Accident</option>
              <option value="Medical">Medical</option>
              <option value="Fire">Fire</option>
              <option value="Public Safety">Public Safety</option>
              <option value="Security">Security</option>
            </select>

            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="dispatch-filter"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="incidents-list">
            {loading ? (
              <div className="dispatch-loading">
                <div className="loading-spinner"></div>
                <p>Loading incidents...</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="no-incidents">
                <AlertTriangle size={48} />
                <h3>No incidents found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredIncidents.map(incident => (
                <div 
                  key={incident.id} 
                  className={`incident-card ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
                  onClick={() => handleIncidentSelect(incident)}
                >
                  <div className="incident-header">
                    <div className="incident-priority-dot" style={{ backgroundColor: getPriorityColor(incident.priority) }} />
                    <h3 className="incident-title">{incident.title}</h3>
                    {selectedIncident?.id === incident.id && (
                      <CheckCircle size={20} className="incident-check" />
                    )}
                  </div>
                  
                  <div className="incident-meta">
                    <div className="incident-meta-item">
                      <MapPin size={14} />
                      <span>{incident.location}</span>
                    </div>
                    <div className="incident-meta-item">
                      <Clock size={14} />
                      <span>{formatTimestamp(incident.timestamp)}</span>
                    </div>
                  </div>

                  <p className="incident-description">{incident.description}</p>

                  <div className="incident-footer">
                    <span 
                      className="incident-priority-badge"
                      style={{ 
                        backgroundColor: `${getPriorityColor(incident.priority)}20`,
                        color: getPriorityColor(incident.priority)
                      }}
                    >
                      {getPriorityLabel(incident.priority)}
                    </span>
                    <span className="incident-category">{incident.category}</span>
                    {incident.respondersAssigned > 0 && (
                      <span className="incident-responders">
                        {incident.respondersAssigned} responder assigned
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedIncident && (
            <div className="dispatch-selection-notice">
              <CheckCircle size={16} />
              <span>Incident selected — ready to dispatch</span>
            </div>
          )}
        </div>

        <div className="dispatch-footer">
          <p className="dispatch-footer-text">
            Select an incident to dispatch this responder
          </p>
          <div className="dispatch-actions">
            <button className="btn-dispatch-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn-dispatch-confirm" 
              onClick={handleConfirmDispatch}
              disabled={!selectedIncident}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              Confirm Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchModal;
