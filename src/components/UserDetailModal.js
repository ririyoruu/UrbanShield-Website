import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Crown,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ZoomOut,
  Ban,
  RotateCcw
} from 'lucide-react';
import './UserDetailModal.css';

const UserDetailModal = ({ user, isOpen, onClose, onApprove, onReject, onSuspend, onRestore, loading }) => {
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [documentZoom, setDocumentZoom] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setCurrentDocumentIndex(0);
      setDocumentZoom(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  // Normalize documents
  let documents = [];
  if (user.verification_documents) documents = Array.isArray(user.verification_documents) ? user.verification_documents : [user.verification_documents];
  else if (user.documents) documents = Array.isArray(user.documents) ? user.documents : [user.documents];
  else if (user.id_documents) documents = Array.isArray(user.id_documents) ? user.id_documents : [user.id_documents];
  documents = documents.filter(d => d && d.trim() !== '');
  const hasDocuments = documents.length > 0;

  const canVerify = user.verification_status === 'pending' || user.verification_status === null || user.verification_status === undefined;
  const requiresApproval = (type) => !['admin'].includes(type);

  const formatDate = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Role config — 3 roles only
  const getRoleConfig = (type) => {
    switch (type) {
      case 'admin':
      case 'superadmin':
        return { label: 'Admin', color: '#dc2626', bg: 'rgba(220,38,38,.1)', border: 'rgba(220,38,38,.2)', icon: <Crown size={14} /> };
      case 'government_responder':
      case 'government_official':
        return { label: 'Gov / Responder', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)', border: 'rgba(139,92,246,.2)', icon: <Shield size={14} /> };
      default:
        return { label: 'Resident', color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.2)', icon: <User size={14} /> };
    }
  };

  const getStatusConfig = () => {
    if (user.verification_status === 'verified') return { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.2)', icon: <CheckCircle size={13} /> };
    if (user.verification_status === 'rejected') return { label: 'Unverified', color: '#ef4444', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.2)', icon: <XCircle size={13} /> };
    if (user.verification_status === 'suspended') return { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.2)', icon: <XCircle size={13} /> };
    if (user.user_type === 'admin') return { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.2)', icon: <CheckCircle size={13} /> };
    return { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.2)', icon: <AlertTriangle size={13} /> };
  };

  const role = getRoleConfig(user.user_type);
  const status = getStatusConfig();

  const initials = (user.full_name || user.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <div className="user-modal-backdrop" onClick={onClose} />
      <div className="user-modal-panel">

        {/* ── Header ── */}
        <div className="user-modal-header">
          <div className="user-modal-avatar" style={{ background: role.bg, border: `2px solid ${role.border}`, color: role.color }}>
            {initials}
          </div>
          <div className="user-modal-header-info">
            <span className="user-modal-eyebrow">User Profile</span>
            <h2 className="user-modal-title">{user.full_name || user.name || 'Unknown User'}</h2>
            <span className="user-modal-email">{user.email}</span>
          </div>
          <button className="user-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── Badges ── */}
        <div className="user-modal-badges">
          <span className="user-badge" style={{ color: role.color, background: role.bg, border: `1px solid ${role.border}` }}>
            {role.icon} {role.label}
          </span>
          <span className="user-badge" style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}>
            {status.icon} {status.label}
          </span>
          {hasDocuments && (
            <span className="user-badge user-badge-gray"><FileText size={11} /> {documents.length} doc{documents.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {/* ── Body ── */}
        <div className="user-modal-body">

          {/* Verification documents */}
          {hasDocuments ? (
            <div className="user-doc-block">
              <div className="user-doc-main">
                <img
                  src={documents[currentDocumentIndex]}
                  alt={`Document ${currentDocumentIndex + 1}`}
                  className={`user-doc-img ${documentZoom ? 'zoomed' : ''}`}
                  onClick={() => setDocumentZoom(!documentZoom)}
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Not+Available'; }}
                />
                {documentZoom && (
                  <button className="user-doc-zoom-out" onClick={() => setDocumentZoom(false)}><ZoomOut size={16} /></button>
                )}
                {documents.length > 1 && (
                  <>
                    <button className="user-doc-nav prev" onClick={() => setCurrentDocumentIndex(i => i > 0 ? i - 1 : documents.length - 1)}><ChevronLeft size={18} /></button>
                    <button className="user-doc-nav next" onClick={() => setCurrentDocumentIndex(i => i < documents.length - 1 ? i + 1 : 0)}><ChevronRight size={18} /></button>
                    <span className="user-doc-counter">{currentDocumentIndex + 1} / {documents.length}</span>
                  </>
                )}
              </div>
              {documents.length > 1 && (
                <div className="user-doc-thumbs">
                  {documents.map((doc, idx) => (
                    <img key={idx} src={doc} alt="" className={`user-doc-thumb ${idx === currentDocumentIndex ? 'active' : ''}`}
                      onClick={() => setCurrentDocumentIndex(idx)}
                      onError={(e) => { e.target.src = 'https://placehold.co/80x60'; }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="user-no-docs">
              <AlertTriangle size={18} />
              <span>No verification documents submitted</span>
            </div>
          )}

          {/* Info grid */}
          <div className="user-info-grid">
            <div className="user-info-item">
              <Mail size={13} className="user-info-icon" />
              <div>
                <span className="user-info-label">Email</span>
                <span className="user-info-value">{user.email || '—'}</span>
              </div>
            </div>
            <div className="user-info-item">
              <Phone size={13} className="user-info-icon" />
              <div>
                <span className="user-info-label">Phone</span>
                <span className="user-info-value">{user.phone || user.phone_number || '—'}</span>
              </div>
            </div>
            <div className="user-info-item">
              <Calendar size={13} className="user-info-icon" />
              <div>
                <span className="user-info-label">Joined</span>
                <span className="user-info-value">{formatDate(user.created_at)}</span>
              </div>
            </div>
            <div className="user-info-item">
              <Clock size={13} className="user-info-icon" />
              <div>
                <span className="user-info-label">Last Updated</span>
                <span className="user-info-value">{formatDate(user.updated_at)}</span>
              </div>
            </div>
            {user.address && user.address !== 'Not provided' && (
              <div className="user-info-item" style={{ gridColumn: '1 / -1' }}>
                <MapPin size={13} className="user-info-icon" />
                <div>
                  <span className="user-info-label">Address</span>
                  <span className="user-info-value">{user.address}</span>
                </div>
              </div>
            )}
            {user.department && (
              <div className="user-info-item" style={{ gridColumn: '1 / -1' }}>
                <Shield size={13} className="user-info-icon" />
                <div>
                  <span className="user-info-label">Department</span>
                  <span className="user-info-value">{user.department}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="user-modal-footer">
          {/* PENDING — show Reject + Verify */}
          {canVerify && requiresApproval(user.user_type) && (
            <>
              {!hasDocuments && (
                <div className="user-warn">
                  <AlertTriangle size={14} />
                  <span>No documents — verify identity before approving</span>
                </div>
              )}
              <div className="user-modal-actions">
                <button className="user-action-btn reject" onClick={() => { const r = window.prompt('Rejection reason (optional):'); onReject(user.id, r); }} disabled={loading}>
                  <XCircle size={15} /> Reject
                </button>
                <button className="user-action-btn approve" onClick={() => {
                  if (!hasDocuments && !window.confirm('No documents found. Approve anyway?')) return;
                  onApprove(user.id);
                }} disabled={loading}>
                  <CheckCircle size={15} /> Verify User
                </button>
              </div>
            </>
          )}

          {/* VERIFIED — show Suspend */}
          {user.verification_status === 'verified' && requiresApproval(user.user_type) && onSuspend && (
            <div className="user-modal-actions">
              <button className="user-action-btn close-btn" onClick={onClose}>Close</button>
              <button className="user-action-btn suspend" onClick={() => {
                if (window.confirm('Suspend this account? The user will lose access.')) onSuspend(user.id);
              }} disabled={loading}>
                <Ban size={15} /> Suspend Account
              </button>
            </div>
          )}

          {/* SUSPENDED — show Restore */}
          {user.verification_status === 'suspended' && requiresApproval(user.user_type) && onRestore && (
            <div className="user-modal-actions">
              <button className="user-action-btn close-btn" onClick={onClose}>Close</button>
              <button className="user-action-btn restore" onClick={() => onRestore(user.id)} disabled={loading}>
                <RotateCcw size={15} /> Restore Access
              </button>
            </div>
          )}

          {/* ADMIN / no action needed */}
          {(!requiresApproval(user.user_type) || (!canVerify && user.verification_status !== 'verified' && user.verification_status !== 'suspended')) && (
            <div className="user-modal-actions">
              <button className="user-action-btn close-btn" onClick={onClose}>Close</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserDetailModal;
