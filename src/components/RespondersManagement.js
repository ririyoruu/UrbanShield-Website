import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Phone, Mail, MapPin, Shield } from 'lucide-react';
import { adminService } from '../config/supabase';
import ResponderProfileModal from './ResponderProfileModal';
import DispatchModal from './DispatchModal';
import DispatchNotification from './DispatchNotification';
import './RespondersManagement.css';

const RespondersManagement = () => {
  const [responders, setResponders] = useState([]);
  const [filteredResponders, setFilteredResponders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResponder, setSelectedResponder] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchingResponder, setDispatchingResponder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadResponders();
  }, []);

  useEffect(() => {
    filterResponders();
  }, [searchTerm, statusFilter, responders]);

  const loadResponders = async () => {
    try {
      setLoading(true);
      let data = [];
      try {
        data = await adminService.getResponders();
        console.log('Raw responder data:', data);
      } catch (err) {
        console.log('Using sample responder data');
      }
      
      if (data.length === 0) {
        data = getSampleResponders();
      } else {
        // Map database data to component format
        data = data.map(responder => {
          const name = responder.full_name || responder.name || 'Not Available';
          const email = responder.email || 'Not Available';
          const initials = name !== 'Not Available' ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'NA';
          const colors = ['#2563eb', '#7c3aed', '#059669', '#ec4899', '#f97316', '#0ea5e9', '#8b5cf6'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return {
            id: responder.id,
            name: name,
            email: email,
            phone: responder.phone || 'Not Available',
            role: responder.role || 'Not Available',
            position: responder.position || 'Not Available',
            status: responder.status || null,
            station: responder.station || 'Not Available',
            badge: responder.badge || 'Not Available',
            yearsOfService: responder.years_of_service || null,
            avgResponseTime: responder.avg_response_time || null,
            incidentsHandled: responder.incidents_handled || null,
            rating: responder.rating || null,
            initials: initials,
            color: color,
            assignment: responder.assignment || null
          };
        });
      }
      
      setResponders(data);
    } catch (error) {
      console.error('Error loading responders:', error);
      setResponders(getSampleResponders());
    } finally {
      setLoading(false);
    }
  };

  const getSampleResponders = () => [
    {
      id: '1',
      name: 'Marcus Chen',
      email: 'm.chen@urbanshield.gov',
      phone: '+1 (555) 201-4832',
      role: 'Fire Department',
      position: 'Senior Firefighter',
      status: 'available',
      station: 'Station 7 – Downtown',
      badge: 'FD-7842',
      yearsOfService: 12,
      avgResponseTime: 4.3,
      incidentsHandled: 234,
      rating: 4.8,
      initials: 'MC',
      color: '#2563eb'
    },
    {
      id: '2',
      name: 'Aisha Williams',
      email: 'a.williams@urbanshield.gov',
      phone: '+1 (555) 203-9821',
      role: 'Medical Services',
      position: 'Paramedic',
      status: 'available',
      station: 'Medical Unit 3',
      badge: 'MS-4521',
      yearsOfService: 8,
      avgResponseTime: 3.8,
      incidentsHandled: 412,
      rating: 4.9,
      initials: 'AW',
      color: '#7c3aed'
    },
    {
      id: '3',
      name: 'James Ortega',
      email: 'j.ortega@urbanshield.gov',
      phone: '+1 (555) 204-1123',
      role: 'Police Department',
      position: 'Sergeant',
      status: 'on_duty',
      assignment: 'Traffic incident on Main St',
      station: 'Precinct 12',
      badge: 'PD-9012',
      yearsOfService: 15,
      avgResponseTime: 5.2,
      incidentsHandled: 567,
      rating: 4.7,
      initials: 'JO',
      color: '#059669'
    },
    {
      id: '4',
      name: 'Priya Sharma',
      email: 'p.sharma@urbanshield.gov',
      phone: '+1 (555) 205-7734',
      role: 'Emergency Management',
      position: 'Coordinator',
      status: 'available',
      station: 'Emergency Operations Center',
      badge: 'EM-3301',
      yearsOfService: 10,
      avgResponseTime: 6.1,
      incidentsHandled: 189,
      rating: 4.9,
      initials: 'PS',
      color: '#ec4899'
    },
    {
      id: '5',
      name: 'Derek Russo',
      email: 'd.russo@urbanshield.gov',
      phone: '+1 (555) 206-4456',
      role: 'Search & Rescue',
      position: 'Team Leader',
      status: 'off_duty',
      station: 'SAR Base Alpha',
      badge: 'SR-2187',
      yearsOfService: 14,
      avgResponseTime: 7.3,
      incidentsHandled: 156,
      rating: 4.6,
      initials: 'DR',
      color: '#f97316'
    }
  ];

  const filterResponders = () => {
    let filtered = responders;

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredResponders(filtered);
  };

  const getStatusDisplay = (status, assignment) => {
    switch (status) {
      case 'available':
        return { text: 'Available', color: '#10b981', icon: '●' };
      case 'on_duty':
        return { text: 'On Duty', color: '#f59e0b', icon: '●', subtitle: assignment };
      case 'off_duty':
        return { text: 'Off Duty', color: '#6b7280', icon: '●' };
      default:
        return { text: 'Not Available', color: '#94a3b8', icon: '●' };
    }
  };

  const handleDispatch = (responder) => {
    setDispatchingResponder(responder);
    setShowDispatchModal(true);
  };

  const handleReassign = (responder) => {
    setDispatchingResponder(responder);
    setShowDispatchModal(true);
  };

  const handleViewProfile = (responder) => {
    setSelectedResponder(responder);
    setShowProfileModal(true);
  };

  const handleDispatchConfirm = async (incident) => {
    // Update responder status
    const updatedResponders = responders.map(r => 
      r.id === dispatchingResponder.id 
        ? { ...r, status: 'on_duty', assignment: incident.title }
        : r
    );
    setResponders(updatedResponders);
    
    // Show notification
    setNotification({
      responder: dispatchingResponder,
      incident: incident
    });
    
    setShowDispatchModal(false);
    setDispatchingResponder(null);
  };

  if (loading) {
    return (
      <div className="responders-loading">
        <div className="loading-spinner"></div>
        <p>Loading responders...</p>
      </div>
    );
  }

  return (
    <div className="responders-management">
      <div className="responders-header">
        <div className="responders-controls">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <Filter size={18} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="on_duty">On Duty</option>
              <option value="off_duty">Off Duty</option>
            </select>
          </div>
        </div>
      </div>

      <div className="responders-table-container">
        <table className="responders-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredResponders.map(responder => {
              const statusInfo = getStatusDisplay(responder.status, responder.assignment);
              const canDispatch = responder.status === 'available';
              const canReassign = responder.status === 'on_duty';
              
              return (
                <tr key={responder.id} onClick={() => handleViewProfile(responder)} className="responder-row">
                  <td>
                    <div className="responder-name-cell">
                      <div className="responder-avatar" style={{ backgroundColor: responder.color }}>
                        {responder.initials}
                      </div>
                      <div className="responder-info">
                        <div className="responder-name">{responder.name}</div>
                        <div className="responder-email">{responder.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="responder-role-cell">
                      <div className="role-title">{responder.role}</div>
                      <div className="role-position">{responder.position}</div>
                    </div>
                  </td>
                  <td>
                    <div className="responder-status-cell">
                      <div className="status-badge">
                        <span className="status-dot" style={{ color: statusInfo.color }}>{statusInfo.icon}</span>
                        <span className="status-text">{statusInfo.text}</span>
                      </div>
                      {statusInfo.subtitle && (
                        <div className="status-assignment">
                          <span className="assignment-icon">⚠</span>
                          <span className="assignment-text">On assignment</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="responder-actions" onClick={(e) => e.stopPropagation()}>
                      {canDispatch && (
                        <button 
                          className="btn-dispatch"
                          onClick={() => handleDispatch(responder)}
                        >
                          Dispatch
                        </button>
                      )}
                      {canReassign && (
                        <button 
                          className="btn-reassign"
                          onClick={() => handleReassign(responder)}
                        >
                          Reassign
                        </button>
                      )}
                      {!canDispatch && !canReassign && (
                        <button className="btn-dispatch" disabled>
                          Dispatch
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredResponders.length === 0 && (
          <div className="no-responders">
            <Shield size={48} />
            <h3>No responders found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {showProfileModal && selectedResponder && (
        <ResponderProfileModal
          responder={selectedResponder}
          onClose={() => setShowProfileModal(false)}
          onDispatch={handleDispatch}
        />
      )}

      {showDispatchModal && dispatchingResponder && (
        <DispatchModal
          responder={dispatchingResponder}
          onClose={() => setShowDispatchModal(false)}
          onConfirm={handleDispatchConfirm}
        />
      )}

      {notification && (
        <DispatchNotification
          responder={notification.responder}
          incident={notification.incident}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default RespondersManagement;
