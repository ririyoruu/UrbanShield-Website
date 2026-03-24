import React from 'react';
import { X, Phone, Mail, MapPin, Shield, Clock, Star, TrendingUp } from 'lucide-react';
import './ResponderProfileModal.css';

const ResponderProfileModal = ({ responder, onClose, onDispatch }) => {
  const handleDispatchClick = () => {
    onClose();
    onDispatch(responder);
  };

  return (
    <div className="responder-profile-overlay" onClick={onClose}>
      <div className="responder-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>Responder Profile</h2>
          <button className="profile-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="profile-body">
          <div className="profile-top">
            <div className="profile-avatar-large" style={{ backgroundColor: responder.color }}>
              {responder.initials}
            </div>
            <div className="profile-main-info">
              <h3>{responder.name}</h3>
              <p className="profile-position">{responder.position}</p>
              <div className="profile-department">
                <Shield size={16} />
                <span>{responder.role}</span>
              </div>
              <div className="profile-status-badge">
                <span 
                  className="status-indicator" 
                  style={{ 
                    backgroundColor: responder.status === 'available' ? '#10b981' : 
                                    responder.status === 'on_duty' ? '#f59e0b' : '#6b7280' 
                  }}
                />
                <span className="status-label">
                  {responder.status === 'available' ? 'Available' : 
                   responder.status === 'on_duty' ? 'On Duty' : 'Off Duty'}
                </span>
                {responder.yearsOfService && (
                  <>
                    <span className="status-separator">•</span>
                    <span className="years-service">{responder.yearsOfService} yrs service</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h4>CONTACT</h4>
            <div className="contact-list">
              <div className="contact-item">
                <Phone size={18} />
                <span>{responder.phone}</span>
              </div>
              <div className="contact-item">
                <Mail size={18} />
                <span>{responder.email}</span>
              </div>
              <div className="contact-item">
                <MapPin size={18} />
                <span>{responder.station}</span>
              </div>
              <div className="contact-item">
                <Shield size={18} />
                <span>Badge #{responder.badge}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h4>PERFORMANCE</h4>
            <div className="performance-grid">
              <div className="performance-card">
                <div className="performance-icon">
                  <Clock size={20} />
                </div>
                <div className="performance-value">
                  {responder.avgResponseTime ? `${responder.avgResponseTime} min` : 'N/A'}
                </div>
                <div className="performance-label">Avg Response</div>
              </div>
              <div className="performance-card">
                <div className="performance-icon">
                  <TrendingUp size={20} />
                </div>
                <div className="performance-value">
                  {responder.incidentsHandled || 'N/A'}
                </div>
                <div className="performance-label">Incidents</div>
              </div>
              <div className="performance-card">
                <div className="performance-icon">
                  <Star size={20} />
                </div>
                <div className="performance-value">
                  {responder.rating ? `${responder.rating}/5` : 'N/A'}
                </div>
                <div className="performance-label">Rating</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-footer">
          <button className="btn-profile-call" onClick={() => window.location.href = `tel:${responder.phone}`}>
            <Phone size={18} />
            Call
          </button>
          <button className="btn-profile-email" onClick={() => window.location.href = `mailto:${responder.email}`}>
            <Mail size={18} />
            Email
          </button>
          <button 
            className="btn-profile-dispatch" 
            onClick={handleDispatchClick}
            disabled={responder.status !== 'available'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            Dispatch
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponderProfileModal;
