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
  Building2,
} from 'lucide-react';
import './UserDetailModal.css';

const UserDetailModal = ({ user, isOpen, onClose, onApprove, onReject, onSuspend, onRestore, loading }) => {
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [docZoom, setDocZoom] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setCurrentDocIndex(0);
      setDocZoom(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  /* ── Documents ── */
  let documents = [];
  if (user.verification_documents) documents = Array.isArray(user.verification_documents) ? user.verification_documents : [user.verification_documents];
  else if (user.documents) documents = Array.isArray(user.documents) ? user.documents : [user.documents];
  else if (user.id_documents) documents = Array.isArray(user.id_documents) ? user.id_documents : [user.id_documents];
  documents = documents.filter(d => d && d.trim() !== '');
  const hasDocuments = documents.length > 0;

  /* ── Status ── */
  const vs = user.verification_status;
  const isAdmin = user.user_type === 'admin' || user.user_type === 'superadmin';
  const isPending = !vs || vs === 'pending';
  const isVerified = vs === 'verified' || isAdmin;
  const isSuspended = vs === 'suspended';
  const isRejected = vs === 'rejected';

  /* ── Status config ── */
  const getStatusConfig = () => {
    if (isAdmin) return { label: 'Verified', color: '#10b981', icon: <CheckCircle size={12} /> };
    if (isVerified) return { label: 'Verified', color: '#10b981', icon: <CheckCircle size={12} /> };
    if (isSuspended) return { label: 'Suspended', color: '#ef4444', icon: <XCircle size={12} /> };
    if (vs === 'rejected') return { label: 'Unverified', color: '#ef4444', icon: <XCircle size={12} /> };
    return { label: 'Pending review', color: '#f59e0b', icon: <AlertTriangle size={12} /> };
  };

  const statusCfg = getStatusConfig();

  /* ── Role config ── */
  const getRoleConfig = (type) => {
    switch (type) {
      case 'admin':
      case 'superadmin':
        return { label: 'Administrator', icon: <Crown size={13} /> };
      case 'government':
      case 'government_responder':
      case 'government_official':
      case 'responder':
        return { label: 'Official/Responder', icon: <Shield size={13} /> };
      default:
        return { label: 'Resident', icon: <User size={13} /> };
    }
  };
  const role = getRoleConfig(user.user_type);

  /* ── Helpers ── */
  const initials = (user.full_name || user.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const formatDate = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const docLabels = ['National ID', 'Passport', 'Document 3', 'Document 4'];

  return (
    <>
      <div className="udm-backdrop" onClick={onClose} />
      <div className="udm-panel">

        {/* ── Header ── */}
        <div className="udm-header">
          <div className="udm-avatar">{initials}</div>
          <div className="udm-header-info">
            <h2 className="udm-name">{user.full_name || user.name || 'Unknown User'}</h2>
            <span className="udm-email">{user.email}</span>
          </div>
          <button className="udm-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── Status strip ── */}
        <div className="udm-status-strip">
          <span className="udm-status-item" style={{ color: statusCfg.color }}>
            <span className="udm-status-dot" style={{ background: statusCfg.color }} />
            {statusCfg.label}
          </span>
          <span className="udm-sep">·</span>
          <span className="udm-status-item udm-role-item">
            {role.icon} {role.label}
          </span>
          {hasDocuments && (
            <>
              <span className="udm-sep">·</span>
              <span className="udm-status-item udm-docs-count">
                <FileText size={12} /> {documents.length} document{documents.length > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        {/* ── Body ── */}
        <div className="udm-body">

          {/* Documents */}
          {hasDocuments ? (
            <div className="udm-doc-section">
              <span className="udm-section-label">Documents</span>
              <div className="udm-doc-viewer">
                <div className="udm-doc-main">
                  <img
                    src={documents[currentDocIndex]}
                    alt={`Document ${currentDocIndex + 1}`}
                    className={`udm-doc-img ${docZoom ? 'zoomed' : ''}`}
                    onClick={() => setDocZoom(!docZoom)}
                    onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Not+Available'; }}
                  />
                  <span className="udm-doc-label">{docLabels[currentDocIndex] || `Document ${currentDocIndex + 1}`}</span>
                  {docZoom && (
                    <button className="udm-doc-zoom-out" onClick={() => setDocZoom(false)}><ZoomOut size={14} /></button>
                  )}
                </div>
                {documents.length > 1 && (
                  <div className="udm-doc-thumbs-row">
                    <button
                      className="udm-thumb-nav"
                      onClick={() => setCurrentDocIndex(i => i > 0 ? i - 1 : documents.length - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {documents.map((doc, idx) => (
                      <img
                        key={idx}
                        src={doc}
                        alt=""
                        className={`udm-doc-thumb ${idx === currentDocIndex ? 'active' : ''}`}
                        onClick={() => setCurrentDocIndex(idx)}
                        onError={(e) => { e.target.src = 'https://placehold.co/80x60'; }}
                      />
                    ))}
                    <button
                      className="udm-thumb-nav"
                      onClick={() => setCurrentDocIndex(i => i < documents.length - 1 ? i + 1 : 0)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="udm-no-docs">
              <AlertTriangle size={16} />
              <span>No verification documents submitted</span>
            </div>
          )}

          {/* Details */}
          <div className="udm-section-label" style={{ marginTop: 4 }}>Details</div>
          <div className="udm-details-grid">
            <div className="udm-detail-item">
              <span className="udm-detail-label">Email</span>
              <span className="udm-detail-value">{user.email || '—'}</span>
            </div>
            <div className="udm-detail-item">
              <span className="udm-detail-label">Phone</span>
              <span className="udm-detail-value">{user.phone || user.phone_number || '—'}</span>
            </div>
            <div className="udm-detail-item">
              <span className="udm-detail-label">Joined</span>
              <span className="udm-detail-value">{formatDate(user.created_at)}</span>
            </div>
            <div className="udm-detail-item">
              <span className="udm-detail-label">Updated</span>
              <span className="udm-detail-value">{formatDate(user.updated_at)}</span>
            </div>
            {user.address && user.address !== 'Not provided' && (
              <div className="udm-detail-item udm-detail-full">
                <span className="udm-detail-label">Address</span>
                <span className="udm-detail-value">{user.address}</span>
              </div>
            )}
            {user.department && (
              <div className="udm-detail-item udm-detail-full">
                <span className="udm-detail-label">Department</span>
                <span className="udm-detail-value">{user.department}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer — context-sensitive buttons ── */}
        <div className="udm-footer">
          {/* PENDING → Reject + Verify user */}
          {isPending && !isAdmin && (
            <div className="udm-footer-actions">
              {!hasDocuments && (
                <div className="udm-warn">
                  <AlertTriangle size={13} />
                  <span>No documents — verify identity before approving</span>
                </div>
              )}
              <div className="udm-btn-row">
                <button
                  className="udm-btn udm-btn-reject"
                  onClick={() => {
                    const r = window.prompt('Rejection reason (optional):');
                    onReject(user.id, r);
                  }}
                  disabled={loading}
                >
                  Reject
                </button>
                <button
                  className="udm-btn udm-btn-verify"
                  onClick={() => {
                    if (!hasDocuments && !window.confirm('No documents found. Verify anyway?')) return;
                    onApprove(user.id);
                  }}
                  disabled={loading}
                >
                  Verify user
                </button>
              </div>
            </div>
          )}

          {/* VERIFIED → Suspend account */}
          {isVerified && !isAdmin && !isPending && (
            <div className="udm-footer-actions">
              <button
                className="udm-btn udm-btn-suspend"
                onClick={() => {
                  if (window.confirm('Suspend this account? The user will lose access.')) onSuspend(user.id);
                }}
                disabled={loading}
              >
                Suspend account
              </button>
            </div>
          )}

          {/* SUSPENDED → Restore access */}
          {isSuspended && !isAdmin && (
            <div className="udm-footer-actions">
              <button
                className="udm-btn udm-btn-restore"
                onClick={() => onRestore(user.id)}
                disabled={loading}
              >
                Restore access
              </button>
            </div>
          )}

          {/* UNVERIFIED (REJECTED) → Restore access */}
          {isRejected && !isAdmin && (
            <div className="udm-footer-actions">
              <button
                className="udm-btn udm-btn-restore"
                onClick={() => onRestore(user.id)}
                disabled={loading}
              >
                Restore access
              </button>
            </div>
          )}

          {/* ADMIN → just close */}
          {isAdmin && (
            <div className="udm-footer-actions">
              <button className="udm-btn udm-btn-close" onClick={onClose}>Close</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default UserDetailModal;
