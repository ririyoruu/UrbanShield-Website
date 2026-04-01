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
  ExternalLink,
  Search,
  Copy,
  RotateCcw,
  Trash2,
  Activity,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../config/supabase';
import AssignResponderModal from './AssignResponderModal';
import './ReportDetailModal.css';
import './ZenithReportModal.css';

const ReportDetailModal = ({
  report,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onStartAction,
  onMarkResolved,
  onMarkDuplicate,
  onRevertPending,
  onDeleteReport,
  onSaveNote,
  onAssignResponder,
  loading,
  isSuperAdmin = false,
  isSidePanel = false
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Debug: Log if onAssignResponder is available
  useEffect(() => {
    if (isOpen) {
      console.log('ReportDetailModal opened with onAssignResponder:', !!onAssignResponder, typeof onAssignResponder);
    }
  }, [isOpen, onAssignResponder]);

  // Load authenticated URLs when images change
  useEffect(() => {
    if (isOpen && report?.images) {
      setIsImageLoading(true);
      const images = Array.isArray(report.images) ? report.images : [report.images];
      const validUrls = images.filter(img => img && img.trim() !== '');
      setImageUrls(validUrls);
      setIsImageLoading(false);
    }
  }, [isOpen, report?.images]);

  useEffect(() => {
    if (isOpen && report) {
      setCurrentImageIndex(0);
      if (!isSidePanel) document.body.style.overflow = 'hidden';
      setNoteDraft(report.admin_notes || '');
    } else {
      if (!isSidePanel) document.body.style.overflow = '';
    }
    return () => { if (!isSidePanel) document.body.style.overflow = ''; };
  }, [isOpen, report?.id, report?.admin_notes, isSidePanel]);

  if (!isOpen || !report) return null;

  const hasImages = imageUrls.length > 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown time';
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusConfig = () => {
    if (report.status === 'duplicate') return { label: 'Duplicate', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)', border: 'rgba(139,92,246,.25)', icon: <Copy size={14} /> };
    if (report.status === 'resolved') return { label: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.25)', icon: <CheckCircle size={14} /> };
    if (report.status === 'in_action') return { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,.1)', border: 'rgba(59,130,246,.25)', icon: <Clock size={14} /> };
    return { label: 'Open', color: '#f59e0b', bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)', icon: <AlertTriangle size={14} /> };
  };

  const statusConfig = getStatusConfig();

  // Normalize raw DB status to canonical values for button logic
  const currentStatus =
    report.status === 'in_action' ? 'in_action' :
    report.status === 'resolved'  ? 'resolved'  :
    report.status === 'duplicate' ? 'duplicate' :
    'pending'; // handles null, undefined, 'pending', or anything else

  const getSeverityColor = (s) => ({
    critical: '#e11d48', high: '#ef4444', medium: '#f59e0b', low: '#10b981'
  })[s?.toLowerCase()] || '#71717a';

  const handleStatusChange = async (nextStatus) => {
    if (!report?.id || nextStatus === report.status) return;
    try {
      setIsStatusUpdating(true);
      if (nextStatus === 'pending' && onRevertPending) {
        await onRevertPending(report.id);
      } else if (nextStatus === 'in_action' && onStartAction) {
        await onStartAction(report.id);
      } else if (nextStatus === 'resolved' && onMarkResolved) {
        onMarkResolved(report);
      } else if (nextStatus === 'duplicate' && onMarkDuplicate) {
        onMarkDuplicate(report.id);
      }
    } finally {
      setIsStatusUpdating(false);
      setIsStatusDropdownOpen(false);
    }
  };

  const handleSaveNoteClick = () => {
    if (!onSaveNote || noteDraft.trim() === (report.admin_notes || '').trim()) return;
    onSaveNote(report.id, noteDraft.trim());
  };

  const activityLog = [];
  if (report.updated_at) {
    activityLog.push({ label: `Status updated to ${statusConfig.label}`, time: report.updated_at, color: '#22c55e' });
  }
  if (report.assigned_officer) {
    activityLog.push({ label: `Assigned to ${report.assigned_officer}`, time: report.assigned_at || report.updated_at, color: '#3b82f6' });
  }
  activityLog.push({ label: `Report submitted by ${report.reporter || report.reporter_name || 'Citizen'}`, time: report.created_at, color: '#0ea5e9' });

  const renderContent = () => (
    <div className={`post-modal-card ${isSidePanel ? 'side-panel-mode' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="post-modal-top">
        <div className="post-modal-header-inline">
          <span className="post-modal-header-id">#{report.id || 'INC'}</span>
          <span className="post-modal-header-dot">·</span>
          <h2 className="post-modal-header-title">{report.title || 'Untitled Post'}</h2>
          <div className="post-modal-header-badges">
            <span
              className="post-badge badge-status"
              style={{ color: statusConfig.color, background: statusConfig.bg }}
            >
              {statusConfig.label.toUpperCase()}
            </span>
            {report.category && (
              <span className="post-badge badge-category">
                {report.category}
              </span>
            )}
          </div>
        </div>
        <button className="post-modal-close" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="post-modal-main">
        <div className="post-modal-left">
          {hasImages ? (
            <div className="post-image-block">
              <div className="post-image-main">
                {isImageLoading ? (
                  <div className="post-image-loading">Loading image...</div>
                ) : (
                  <>
                    <img
                      src={imageUrls[currentImageIndex]}
                      alt={`Photo ${currentImageIndex + 1}`}
                      className="post-image"
                      onClick={() => setShowFullImage(true)}
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/600x400?text=Image+Not+Available';
                        setIsImageLoading(false);
                      }}
                      onLoad={() => setIsImageLoading(false)}
                    />
                    {imageUrls.length > 1 && (
                      <>
                        <button className="post-img-nav prev" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i > 0 ? i - 1 : imageUrls.length - 1)); }}>
                          <ChevronLeft size={18} />
                        </button>
                        <button className="post-img-nav next" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i < imageUrls.length - 1 ? i + 1 : 0)); }}>
                          <ChevronRight size={18} />
                        </button>
                        <span className="post-img-counter">{currentImageIndex + 1} / {imageUrls.length}</span>
                      </>
                    )}
                  </>
                )}
              </div>
              {imageUrls.length > 1 && (
                <div className="post-thumbnails">
                  {imageUrls.map((img, idx) => (
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
              <span>No media attached</span>
            </div>
          )}

          <div className="post-body-content">
            <div className="post-meta-list">
              <div className="post-meta-list-item">
                <MapPin size={15} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Location</span>
                  <span className="meta-value">{report.address || report.location || 'Not specified'}</span>
                </div>
              </div>
              <div className="post-meta-list-item">
                <User size={15} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Reported by</span>
                  <span className="meta-value">{report.reporter || report.reporter_name || 'Anonymous'}</span>
                </div>
              </div>
              <div className="post-meta-list-item">
                <Clock size={15} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Date filed</span>
                  <span className="meta-value">{formatDate(report.created_at)}</span>
                </div>
              </div>
              <div className="post-meta-list-item">
                <Shield size={15} className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Assigned to</span>
                  <span className="meta-value" style={{ color: report.assigned_officer ? '#3b82f6' : '#6b7280', fontStyle: report.assigned_officer ? 'normal' : 'italic' }}>
                    {report.assigned_officer || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {report.description && (
              <>
                <hr className="post-divider" />
                <p className="description-label">Description</p>
                <p className="post-description-text">{report.description}</p>
              </>
            )}
          </div>
        </div>

        <aside className="post-modal-aside">
          <div className="aside-card">
            <p className="aside-label">Actions</p>
            {onAssignResponder ? (
              <button
                className={`aside-btn ${currentStatus === 'pending' ? 'dark' : 'gray-solid'}`}
                onClick={() => setShowAssignModal(true)}
                disabled={loading || currentStatus !== 'pending'}
              >
                <Activity size={20} /> Start Action
              </button>
            ) : (
              <button
                className={`aside-btn ${currentStatus === 'pending' ? 'dark' : 'gray-solid'}`}
                onClick={() => onStartAction?.(report.id)}
                disabled={loading || currentStatus !== 'pending'}
              >
                <Activity size={20} /> Start Action
              </button>
            )}
            <button
              className={`aside-btn ${currentStatus === 'in_action' ? 'dark' : 'gray-solid'}`}
              onClick={() => onMarkResolved?.(report)}
              disabled={loading || currentStatus !== 'in_action'}
              title={currentStatus === 'pending' ? 'Assign a responder first' : ''}
            >
              <CheckCircle size={20} /> Mark Resolved
            </button>
            <button 
              className={`aside-btn ${currentStatus === 'duplicate' ? 'gray-solid' : 'outline'}`}
              onClick={() => onMarkDuplicate?.(report.id)} 
              disabled={loading || currentStatus === 'duplicate' || currentStatus === 'resolved'}
            >
              <Copy size={20} /> Mark Duplicate
            </button>
            <button 
              className={`aside-btn ${['in_action', 'resolved', 'duplicate'].includes(currentStatus) ? 'outline' : 'gray-solid'}`}
              onClick={() => onRevertPending?.(report.id)} 
              disabled={loading || !['in_action', 'resolved', 'duplicate'].includes(currentStatus)}
            >
              <RotateCcw size={20} /> {currentStatus === 'duplicate' ? 'Remove Duplicate' : 'Revert to Open'}
            </button>
            {isSuperAdmin && (
              <button className="aside-btn outline danger-outline" onClick={() => onDeleteReport?.(report.id)} disabled={loading}>
                <Trash2 size={20} /> Delete
              </button>
            )}
          </div>

          <div className="activity-log-section">
            <p className="activity-log-label">Activity Log</p>
            <div className="activity-log-list">
              {report.admin_notes ? (
                report.admin_notes.split('\n').filter(l => l.trim()).map((line, idx) => (
                  <div key={idx} className="activity-log-entry">
                    <span className="activity-log-dot" />
                    <span className="activity-log-text">{line}</span>
                  </div>
                ))
              ) : (
                <div className="activity-log-empty">No activity yet</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  if (isSidePanel) return renderContent();

  return (
    <>
      <div className="post-modal-backdrop" onClick={onClose} />
      <div className="post-modal-wrapper" onClick={onClose}>
        {renderContent()}
      </div>
      {showFullImage && (
        <div 
          className="fullscreen-image-viewer"
          onClick={() => setShowFullImage(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowFullImage(false); }}
            style={{
              position: 'absolute',
              top: '20px', right: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none', borderRadius: '50%',
              width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10000
            }}
          >
            <X size={20} />
          </button>
          
          <img
            src={imageUrls[currentImageIndex]}
            alt={`Photo ${currentImageIndex + 1}`}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', cursor: 'default' }}
            onClick={(e) => e.stopPropagation()}
          />
          
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i > 0 ? i - 1 : imageUrls.length - 1)); }}
                style={{
                  position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%',
                  width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i < imageUrls.length - 1 ? i + 1 : 0)); }}
                style={{
                  position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%',
                  width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <ChevronRight size={20} />
              </button>
              <div
                style={{
                  position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '8px 16px', borderRadius: '20px',
                  fontSize: '14px', fontWeight: '600'
                }}
              >
                {currentImageIndex + 1} / {imageUrls.length}
              </div>
            </>
          )}
        </div>
      )}
      {onAssignResponder && (
        <AssignResponderModal
          incident={report}
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssignResponder}
          loading={loading}
        />
      )}
    </>
  );
};

export default ReportDetailModal;
