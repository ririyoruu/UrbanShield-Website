import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  User, 
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react';
import { adminService } from '../config/supabase';
import './NotificationDropdown.css';

const NotificationDropdown = ({ user, isOpen, onClose, onNavigateToIncidents }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Get all incidents and create notifications
      const incidents = await adminService.getAllReports();
      console.log('Loaded incidents for notifications:', incidents.length);
      
      // Helper to get status from is_verified
      const getStatus = (incident) => {
        if (incident.is_verified === true) return 'approved';
        if (incident.is_verified === false) return 'rejected';
        return 'pending';
      };
      
      // Helper to clean hex strings from location and use fallbacks
      const cleanLocation = (incident) => {
        // Get the original location data
        const originalLoc = incident.location;
        const cityAddress = `${incident.city || ''} ${incident.address || ''}`.trim();
        const loc = originalLoc || cityAddress || 'Unknown location';
        
        // If location is not a string, use city/address or return unknown
        if (typeof loc !== 'string') {
          return cityAddress || 'Unknown location';
        }
        
        // Filter out PostGIS hex strings (geometry data)
        // These are long alphanumeric strings that start with "0101000020E6100000" or similar patterns
        // and are typically 40+ characters of hex characters
        if (loc && (
          loc.startsWith('0101000020E6100000') ||
          (loc.length > 40 && /^[0-9A-Fa-f]+$/.test(loc)) ||
          /^01010000[0-9A-Fa-f]{32,}$/.test(loc)
        )) {
          return cityAddress || 'Location not specified';
        }
        
        // Clean any hex strings that might be embedded in the text
        let cleaned = loc
          .replace(/\s+in\s+01010000[0-9A-Fa-f]{32,}/gi, '')
          .replace(/0101000020E6100000[0-9A-Fa-f]{32,}/gi, '')
          .replace(/01010000[0-9A-Fa-f]{32,}/gi, '')
          .replace(/\b[0-9A-Fa-f]{40,}\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // If cleaning removed everything, use city/address fallback
        if (!cleaned || cleaned.length < 2) {
          return cityAddress || 'Location not specified';
        }
        
        return cleaned;
      };
      
      // Filter only pending incidents
      const pendingIncidents = incidents.filter(incident => getStatus(incident) === 'pending');
      
      // Create notifications from pending incidents only
      const incidentNotifications = pendingIncidents
        .slice(0, 10) // Show up to 10 pending incidents
        .map(incident => ({
          id: `incident-${incident.id}`,
          title: 'Incident Report',
          message: `${incident.title || incident.category || 'Incident'} in ${cleanLocation(incident)}`,
          type: 'incident',
          priority: incident.severity || 'medium',
          time: incident.created_at,
          status: getStatus(incident),
          incidentId: incident.id
        }));

      // Add system notifications based on incident data
      const systemNotifications = [];
      
      const pendingCount = pendingIncidents.length;
      if (pendingCount > 0) {
        systemNotifications.push({
          id: 'pending-reports',
          title: 'Pending Reports',
          message: `${pendingCount} incidents are pending review`,
          type: 'system',
          priority: 'high',
          time: new Date().toISOString(),
          actionUrl: '/admin/reports'
        });
      }


      // Combine all notifications
      const allNotifications = [...incidentNotifications, ...systemNotifications]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10); // Show max 10 notifications

      console.log('Total notifications created:', allNotifications.length);
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Set some mock notifications if there's an error
      setNotifications([
        {
          id: 'error-notification',
          title: 'System Error',
          message: 'Unable to load notifications. Please refresh the page.',
          type: 'system',
          priority: 'high',
          time: new Date().toISOString(),
          actionUrl: '/admin/reports'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconClass = `notification-icon ${priority}`;
    
    switch (type) {
      case 'incident':
        return <AlertTriangle className={iconClass} size={16} />;
      case 'system':
        return <Shield className={iconClass} size={16} />;
      case 'user':
        return <User className={iconClass} size={16} />;
      default:
        return <Bell className={iconClass} size={16} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleNotificationClick = (notification) => {
    if (notification.incidentId && onNavigateToIncidents) {
      // Navigate to incidents tab
      onNavigateToIncidents();
    } else if (notification.actionUrl) {
      // Navigate to the relevant page
      window.location.hash = notification.actionUrl;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Recent Activity</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="loading-notifications">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <Bell size={24} />
            <p>No recent activity</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className="notification-item"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon-wrapper">
                {getNotificationIcon(notification.type, notification.priority)}
              </div>
              
              <div className="notification-content">
                <div className="notification-title-row">
                  <h4>{notification.title}</h4>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(notification.priority) }}
                  >
                    {notification.priority}
                  </span>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                <div className="notification-meta">
                  <span className="time-ago">
                    <Clock size={12} />
                    {formatTimeAgo(notification.time)}
                  </span>
                  {notification.status && (
                    <span className={`status-badge ${notification.status}`}>
                      {notification.status}
                    </span>
                  )}
                </div>
              </div>

              {notification.actionUrl && (
                <div className="notification-action">
                  <ExternalLink size={14} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="notification-footer">
        <button 
          className="view-all-btn"
          onClick={() => {
            if (onNavigateToIncidents) {
              onNavigateToIncidents();
            }
            onClose();
          }}
        >
          View All Incidents
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
