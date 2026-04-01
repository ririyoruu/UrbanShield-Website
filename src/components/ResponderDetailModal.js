import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import './ResponderDetailModal.css';

const ResponderDetailModal = ({ responder, isOpen, onClose, onDeactivate, loading }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen || !responder) return null;

  const initials = (responder.full_name || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formatDate = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isVerified = responder.verification_status === 'verified';
  const isActive = responder.is_active !== false;

  const handleDeactivate = () => {
    onDeactivate(responder.id, responder.full_name, responder.is_active);
    onClose();
  };

  return (
    <>
      <div className="rdm-backdrop" onClick={onClose} />
      <div className="rdm-panel">
        
        {/* Header */}
        <div className="rdm-header">
          <div className="rdm-avatar" style={{ backgroundColor: '#3b82f6' }}>
            {initials}
          </div>
          <div className="rdm-header-info">
            <h2 className="rdm-name">{responder.full_name}</h2>
            <span className="rdm-email">{responder.email}</span>
          </div>
          <button className="rdm-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Status Strip */}
        <div className="rdm-status-strip">
          <span className="rdm-status-item" style={{ color: !isActive ? '#ef4444' : (isVerified ? '#10b981' : '#f59e0b') }}>
            <span className="rdm-status-dot" style={{ background: !isActive ? '#ef4444' : (isVerified ? '#10b981' : '#f59e0b') }} />
            {!isActive ? 'Deactivated' : (isVerified ? 'Verified' : 'Pending')}
          </span>
          <span className="rdm-sep">·</span>
          <span className="rdm-status-item rdm-role-item">
            <Shield size={12} /> Responder
          </span>
          {responder.department && (
            <>
              <span className="rdm-sep">·</span>
              <span className="rdm-status-item">
                <Building2 size={12} /> {responder.department}
              </span>
            </>
          )}
        </div>

        {/* Body */}
        <div className="rdm-body">
          <div className="rdm-section-label">Details</div>
          <div className="rdm-details-grid">
            <div className="rdm-detail-item">
              <span className="rdm-detail-label">Username</span>
              <span className="rdm-detail-value">{responder.username || '—'}</span>
            </div>
            <div className="rdm-detail-item">
              <span className="rdm-detail-label">Email</span>
              <span className="rdm-detail-value">{responder.email || '—'}</span>
            </div>
            <div className="rdm-detail-item">
              <span className="rdm-detail-label">Phone</span>
              <span className="rdm-detail-value">{responder.phone || responder.phone_number || '—'}</span>
            </div>
            <div className="rdm-detail-item">
              <span className="rdm-detail-label">Department</span>
              <span className="rdm-detail-value">{responder.department || '—'}</span>
            </div>
            <div className="rdm-detail-item">
              <span className="rdm-detail-label">Status</span>
              <span className="rdm-detail-value" style={{ color: !isActive ? '#ef4444' : '#10b981' }}>
                {isActive ? 'Active' : 'Deactivated'}
              </span>
            </div>
            <div className="rdm-detail-item">
              <span className="rdm-detail-label">Created</span>
              <span className="rdm-detail-value">{formatDate(responder.created_at)}</span>
            </div>
            <div className="rdm-detail-item">
              <span className="rdm-detail-label">Updated</span>
              <span className="rdm-detail-value">{formatDate(responder.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="rdm-footer">
          <div className="rdm-footer-actions">
            {isActive ? (
              <button
                className="rdm-btn rdm-btn-deactivate"
                onClick={handleDeactivate}
                disabled={loading}
              >
                <AlertCircle size={16} />
                Deactivate Responder
              </button>
            ) : (
              <button
                className="rdm-btn rdm-btn-activate"
                onClick={handleDeactivate}
                disabled={loading}
              >
                <CheckCircle size={16} />
                Activate Responder
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResponderDetailModal;
