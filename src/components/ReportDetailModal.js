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
  Download,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import './ReportDetailModal.css';

const ReportDetailModal = ({ report, isOpen, onClose, onApprove, onReject, loading }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoom, setImageZoom] = useState(false);

  // Reset image index when modal opens or report changes
  useEffect(() => {
    if (isOpen && report) {
      setCurrentImageIndex(0);
      setImageZoom(false);
    }
  }, [isOpen, report?.id]);

  if (!isOpen || !report) return null;

  // Handle different image data formats
  let images = [];
  if (report.images) {
    images = Array.isArray(report.images) ? report.images : [report.images];
  } else if (report.photo_urls) {
    images = Array.isArray(report.photo_urls) ? report.photo_urls : [report.photo_urls];
  }
  // Filter out null/undefined/empty strings
  images = images.filter(img => img && img.trim() !== '');
  const hasImages = images.length > 0;
  const canVerify = report.status !== 'resolved';

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleImageClick = () => {
    setImageZoom(!imageZoom);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (report.status === 'resolved') {
      return { text: 'Resolved', color: '#10b981', icon: <CheckCircle size={16} /> };
    } else if (report.status === 'in_action') {
      return { text: 'In Action', color: '#3b82f6', icon: <Clock size={16} /> };
    }
    return { text: 'Pending', color: '#f59e0b', icon: <AlertTriangle size={16} /> };
  };

  const statusBadge = getStatusBadge();

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="report-modal-header">
          <div className="report-modal-title-section">
            <h2 className="report-modal-title">{report.title || 'Untitled Report'}</h2>
            <div className="report-modal-badges">
              <span 
                className="status-badge-modal" 
                style={{ backgroundColor: statusBadge.color }}
              >
                {statusBadge.icon}
                {statusBadge.text}
              </span>
              {report.priority && (
                <span 
                  className="priority-badge-modal" 
                  style={{ backgroundColor: getPriorityColor(report.priority) }}
                >
                  {report.priority?.toUpperCase()}
                </span>
              )}
              {report.type && (
                <span className="type-badge-modal">
                  {report.type}
                </span>
              )}
            </div>
          </div>
          <button className="report-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="report-modal-body">
          {/* Images Section */}
          {hasImages ? (
            <div className="report-images-section">
              <div className="images-header">
                <div className="images-title">
                  <ImageIcon size={20} />
                  <span>Evidence Photos ({images.length})</span>
                </div>
                {images.length > 1 && (
                  <div className="image-navigation">
                    <button 
                      className="nav-image-btn" 
                      onClick={handlePreviousImage}
                      disabled={loading}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="image-counter">
                      {currentImageIndex + 1} / {images.length}
                    </span>
                    <button 
                      className="nav-image-btn" 
                      onClick={handleNextImage}
                      disabled={loading}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className={`image-container ${imageZoom ? 'zoomed' : ''}`}>
                <img 
                  src={images[currentImageIndex]} 
                  alt={`Evidence ${currentImageIndex + 1}`}
                  className="report-image"
                  onClick={handleImageClick}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Available';
                  }}
                />
                {imageZoom && (
                  <div className="image-zoom-controls">
                    <button 
                      className="zoom-btn" 
                      onClick={() => setImageZoom(false)}
                      title="Zoom Out"
                    >
                      <ZoomOut size={18} />
                    </button>
                  </div>
                )}
                {images.length > 1 && (
                  <div className="image-thumbnails">
                    {images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className={`thumbnail ${idx === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80x60?text=Error';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-images-warning">
              <AlertTriangle size={24} />
              <div>
                <h3>No Photos Available</h3>
                <p>This report does not contain any evidence photos. Verification may require additional information.</p>
              </div>
            </div>
          )}

          {/* Report Details */}
          <div className="report-details-section">
            <h3 className="section-title">Report Details</h3>
            
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">
                  <MapPin size={18} />
                  <span>Location</span>
                </div>
                <div className="detail-value">{report.location || 'Not specified'}</div>
                {(report.latitude && report.longitude) && (
                  <div className="detail-coords">
                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </div>
                )}
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <User size={18} />
                  <span>Reporter</span>
                </div>
                <div className="detail-value">{report.reporter || 'Unknown'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <Clock size={18} />
                  <span>Reported At</span>
                </div>
                <div className="detail-value">{formatDate(report.created_at)}</div>
              </div>

              {report.category && (
                <div className="detail-item">
                  <div className="detail-label">
                    <AlertTriangle size={18} />
                    <span>Category</span>
                  </div>
                  <div className="detail-value">{report.category}</div>
                </div>
              )}

              {report.severity && (
                <div className="detail-item">
                  <div className="detail-label">
                    <span>Severity</span>
                  </div>
                  <div className="detail-value">
                    <span 
                      className="severity-badge" 
                      style={{ backgroundColor: getPriorityColor(report.severity) }}
                    >
                      {report.severity?.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {report.description && (
              <div className="description-section">
                <h4 className="description-title">Description</h4>
                <p className="description-text">{report.description}</p>
              </div>
            )}

            {report.admin_notes && (
              <div className="admin-notes-section">
                <h4 className="admin-notes-title">Admin Notes</h4>
                <p className="admin-notes-text">{report.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Resolution Status */}
          {report.status === 'resolved' && (
            <div className="verification-status-section">
              <div className="verification-status approved">
                <CheckCircle size={24} />
                <div>
                  <h4>Incident Resolved</h4>
                  <p>{report.admin_notes || 'This incident has been resolved by a responder.'}</p>
                </div>
              </div>
            </div>
          )}
          {report.status === 'in_action' && (
            <div className="verification-status-section">
              <div className="verification-status" style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }}>
                <Clock size={24} style={{ color: '#3b82f6' }} />
                <div>
                  <h4>Action In Progress</h4>
                  <p>A responder is currently handling this incident.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="report-modal-footer">
          {report.status !== 'resolved' && report.status !== 'in_action' && (
            <div className="modal-actions">
              <button 
                className="btn-approve-modal"
                onClick={() => onApprove(report.id)}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '20px' }}
              >
                <CheckCircle size={18} />
                Start Action
              </button>
              <button 
                className="btn-reject-modal"
                onClick={() => onReject(report.id)}
                disabled={loading}
                style={{ background: '#10b981', borderRadius: '20px' }}
              >
                <CheckCircle size={18} />
                Mark as Resolved
              </button>
            </div>
          )}
          {report.status === 'in_action' && (
            <div className="modal-actions">
              <button 
                className="btn-reject-modal"
                onClick={() => onReject(report.id)}
                disabled={loading}
                style={{ background: '#10b981', borderRadius: '20px' }}
              >
                <CheckCircle size={18} />
                Mark as Resolved
              </button>
            </div>
          )}
          {report.status === 'resolved' && (
            <div className="modal-actions">
              <button 
                className="btn-close-modal"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;

