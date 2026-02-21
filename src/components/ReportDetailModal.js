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
  ZoomOut,
  FileText,
  Calendar,
  Tag,
  Info
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
    <div className="report-detail-container">
      {/* Main Content Card */}
      <div className="report-content-card">
        {/* Sidebar - Image Gallery */}
        <div className="report-sidebar">
        {hasImages ? (
          <div className="image-gallery">
            <div className="gallery-header">
              <h3 className="gallery-title">
                <ImageIcon size={20} />
                Evidence Photos
              </h3>
              <span className="image-count">{images.length} photos</span>
            </div>
            
            <div className="main-image-container">
              <img 
                src={images[currentImageIndex]} 
                alt={`Evidence ${currentImageIndex + 1}`}
                className="main-image"
                onClick={handleImageClick}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Available';
                }}
              />
              
              {images.length > 1 && (
                <div className="image-controls">
                  <button 
                    type="button"
                    className="image-nav-btn prev" 
                    onClick={handlePreviousImage}
                    disabled={loading}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    type="button"
                    className="image-nav-btn next" 
                    onClick={handleNextImage}
                    disabled={loading}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
              
              <div className="image-indicator">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {images.length > 1 && (
              <div className="thumbnail-strip">
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
        ) : (
          <div className="no-images-container">
            <div className="no-images-content">
              <ImageIcon size={48} />
              <h3>No Evidence Photos</h3>
              <p>This report doesn't contain any photos</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="report-main-content">
        {/* Header */}
        <div className="report-header">
          <div className="report-title-section">
            <h1 className="report-title">{report.title || 'Untitled Report'}</h1>
            <div className="report-badges">
              <span className="status-badge" style={{ backgroundColor: statusBadge.color }}>
                {statusBadge.icon}
                {statusBadge.text}
              </span>
              {report.priority && (
                <span 
                  className="priority-badge" 
                  style={{ backgroundColor: getPriorityColor(report.priority) }}
                >
                  {report.priority?.toUpperCase()}
                </span>
              )}
              {report.type && (
                <span className="type-badge">
                  <Tag size={14} />
                  {report.type}
                </span>
              )}
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content Grid */}
        <div className="report-content-grid">
          {/* Left Column - Details */}
          <div className="report-details-column">
            <div className="detail-section">
              <h2 className="section-title">
                <FileText size={20} />
                Incident Details
              </h2>
              
              <div className="detail-cards">
                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3><MapPin size={16} /> Location</h3>
                  </div>
                  <div className="detail-card-body">
                    <div className="detail-card-value">{report.location || 'Not specified'}</div>
                    {(report.latitude && report.longitude) && (
                      <div className="detail-card-meta">
                        {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3><User size={16} /> Reporter</h3>
                  </div>
                  <div className="detail-card-body">
                    <div className="detail-card-value">{report.reporter || 'Unknown'}</div>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-card-header">
                    <h3><Clock size={16} /> Date & Time</h3>
                  </div>
                  <div className="detail-card-body">
                    <div className="detail-card-value">{formatDate(report.created_at)}</div>
                  </div>
                </div>

                {report.category && (
                  <div className="detail-card">
                    <div className="detail-card-header">
                      <h3><AlertTriangle size={16} /> Category</h3>
                    </div>
                    <div className="detail-card-body">
                      <div className="detail-card-value">{report.category}</div>
                    </div>
                  </div>
                )}

                {report.severity && (
                  <div className="detail-card">
                    <div className="detail-card-header">
                      <h3><AlertTriangle size={16} /> Severity</h3>
                    </div>
                    <div className="detail-card-body">
                      <div className="detail-card-value">{report.severity}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {report.description && (
              <div className="description-section">
                <h2 className="section-title">
                  <FileText size={20} />
                  Description
                </h2>
                <div className="description-card">
                  <p>{report.description}</p>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {report.admin_notes && (
              <div className="admin-notes-section">
                <h2 className="section-title">
                  <Info size={20} />
                  Admin Notes
                </h2>
                <div className="admin-notes-card">
                  <p>{report.admin_notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status & Actions */}
          <div className="report-actions-column">
            {/* Status Display */}
            <div className="status-display">
              {report.status === 'resolved' && (
                <div className="status-card resolved">
                  <div className="status-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div className="status-content">
                    <h3>Incident Resolved</h3>
                    <p>{report.admin_notes || 'This incident has been successfully resolved.'}</p>
                  </div>
                </div>
              )}
              
              {report.status === 'in_action' && (
                <div className="status-card in-action">
                  <div className="status-icon">
                    <AlertTriangle size={32} />
                  </div>
                  <div className="status-content">
                    <h3>Action in Progress</h3>
                    <p>Response team is currently addressing this incident.</p>
                  </div>
                </div>
              )}
              
              {report.status === 'pending' && (
                <div className="status-card pending">
                  <div className="status-icon">
                    <Clock size={32} />
                  </div>
                  <div className="status-content">
                    <h3>Awaiting Review</h3>
                    <p>This incident is pending admin review and action.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {canVerify && (
              <div className="action-section">
                <h3 className="action-title">Take Action</h3>
                <div className="action-buttons">
                  <button 
                    type="button"
                    className="action-btn reject" 
                    onClick={() => onReject(report.id)}
                    disabled={loading}
                  >
                    <XCircle size={20} />
                    <span>Reject Report</span>
                  </button>
                  <button 
                    type="button"
                    className="action-btn approve" 
                    onClick={() => onApprove(report.id)}
                    disabled={loading}
                  >
                    <CheckCircle size={20} />
                    <span>Approve & Dispatch</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="quick-info">
              <h3 className="info-title">Quick Info</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Report ID</span>
                  <span className="info-value">#{report.id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value">{statusBadge.text}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Priority</span>
                  <span className="info-value">{report.priority || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Images</span>
                  <span className="info-value">{images.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;

