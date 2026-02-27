import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  Tag,
  Calendar,
  Shield,
  Info,
  ExternalLink
} from 'lucide-react';
import './ReportDetailModal.css';

const ReportDetailModal = ({ report, isOpen, onClose, onApprove, onReject, loading }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && report) {
      setCurrentImageIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, report?.id]);

  if (!isOpen || !report) return null;

  // Normalize images
  let images = [];
  if (report.images) images = Array.isArray(report.images) ? report.images : [report.images];
  else if (report.photo_urls) images = Array.isArray(report.photo_urls) ? report.photo_urls : [report.photo_urls];
  images = images.filter(img => img && img.trim() !== '');
  const hasImages = images.length > 0;

  const canVerify = report.status !== 'resolved' && report.is_verified !== true && report.is_verified !== false;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusConfig = () => {
    if (report.is_verified === true) return { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.25)', icon: <CheckCircle size={14} /> };
    if (report.is_verified === false) return { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.25)', icon: <XCircle size={14} /> };
    if (report.status === 'resolved') return { label: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.25)', icon: <CheckCircle size={14} /> };
    if (report.status === 'in_action') return { label: 'In Action', color: '#3b82f6', bg: 'rgba(59,130,246,.1)', border: 'rgba(59,130,246,.25)', icon: <Clock size={14} /> };
    return { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)', icon: <AlertTriangle size={14} /> };
  };

  const getSeverityColor = (s) => ({
    critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#10b981'
  })[s?.toLowerCase()] || '#71717a';

  const statusConfig = getStatusConfig();

  return (
    <>
      {/* Backdrop */}
      <div className="post-modal-backdrop" onClick={onClose} />

      {/* Drawer panel */}
      <div className="post-modal-panel">

        {/* ── Panel Header ── */}
        <div className="post-modal-header">
          <div className="post-modal-header-left">
            <span className="post-modal-eyebrow">Post Detail</span>
            <h2 className="post-modal-title">{report.title || 'Untitled Post'}</h2>
          </div>
          <button className="post-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── Status + Badges ── */}
        <div className="post-modal-badges">
          <span
            className="post-badge"
            style={{ color: statusConfig.color, background: statusConfig.bg, border: `1px solid ${statusConfig.border}` }}
          >
            {statusConfig.icon} {statusConfig.label}
          </span>
          {report.severity && (
            <span
              className="post-badge"
              style={{ color: '#fff', background: getSeverityColor(report.severity) }}
            >
              {report.severity}
            </span>
          )}
          {report.category && (
            <span className="post-badge post-badge-gray">
              <Tag size={11} /> {report.category}
            </span>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="post-modal-body">

          {/* Image gallery */}
          {hasImages ? (
            <div className="post-image-block">
              <div className="post-image-main">
                <img
                  src={images[currentImageIndex]}
                  alt={`Photo ${currentImageIndex + 1}`}
                  className="post-image"
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=No+Image'; }}
                />
                {images.length > 1 && (
                  <>
                    <button className="post-img-nav prev" onClick={() => setCurrentImageIndex(i => (i > 0 ? i - 1 : images.length - 1))}>
                      <ChevronLeft size={18} />
                    </button>
                    <button className="post-img-nav next" onClick={() => setCurrentImageIndex(i => (i < images.length - 1 ? i + 1 : 0))}>
                      <ChevronRight size={18} />
                    </button>
                    <span className="post-img-counter">{currentImageIndex + 1} / {images.length}</span>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="post-thumbnails">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`thumb-${idx}`}
                      className={`post-thumb ${idx === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(idx)}
                      onError={(e) => { e.target.src = 'https://placehold.co/80x60'; }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="post-no-image">
              <ImageIcon size={32} />
              <span>No photos attached</span>
            </div>
          )}

          {/* Meta info grid */}
          <div className="post-meta-grid">
            <div className="post-meta-item">
              <MapPin size={14} className="post-meta-icon" />
              <div>
                <span className="post-meta-label">Location</span>
                <span className="post-meta-value">{report.location || report.address || 'Not specified'}</span>
                {report.latitude && report.longitude && (
                  <span className="post-meta-coords">{parseFloat(report.latitude).toFixed(5)}, {parseFloat(report.longitude).toFixed(5)}</span>
                )}
              </div>
            </div>
            <div className="post-meta-item">
              <User size={14} className="post-meta-icon" />
              <div>
                <span className="post-meta-label">Reported by</span>
                <span className="post-meta-value">{report.reporter || report.reporter_name || 'Anonymous'}</span>
              </div>
            </div>
            <div className="post-meta-item">
              <Calendar size={14} className="post-meta-icon" />
              <div>
                <span className="post-meta-label">Date & Time</span>
                <span className="post-meta-value">{formatDate(report.created_at)}</span>
              </div>
            </div>
            <div className="post-meta-item">
              <Shield size={14} className="post-meta-icon" />
              <div>
                <span className="post-meta-label">Post ID</span>
                <span className="post-meta-value">#{report.id}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div className="post-section">
              <h4 className="post-section-label"><FileText size={13} /> Description</h4>
              <p className="post-description">{report.description}</p>
            </div>
          )}

          {/* Admin notes */}
          {report.admin_notes && (
            <div className="post-section post-section-notes">
              <h4 className="post-section-label"><Info size={13} /> Admin Notes</h4>
              <p className="post-description">{report.admin_notes}</p>
            </div>
          )}
        </div>

        {/* ── Action footer ── */}
        {canVerify && (
          <div className="post-modal-footer">
            <button
              className="post-action-btn reject"
              onClick={() => onReject(report.id)}
              disabled={loading}
            >
              <XCircle size={16} /> Reject Post
            </button>
            <button
              className="post-action-btn approve"
              onClick={() => onApprove(report.id)}
              disabled={loading}
            >
              <CheckCircle size={16} /> Approve & Dispatch
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportDetailModal;
