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
import { supabase } from '../config/supabase';
import './ReportDetailModal.css';

const ReportDetailModal = ({ report, isOpen, onClose, onApprove, onReject, loading }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);

  // Get authenticated image URLs for Supabase storage
  const getAuthenticatedImageUrl = async (imagePath) => {
    try {
      if (imagePath.includes('supabase.co/storage/v1/')) {
        // Extract path from Supabase URL
        const urlParts = imagePath.split('/');
        const publicIndex = urlParts.indexOf('public');
        if (publicIndex !== -1) {
          const path = urlParts.slice(publicIndex + 1).join('/');
          const { data, error } = await supabase.storage
            .from('incident-media')
            .createSignedUrl(path, 3600); // 1 hour expiry
          
          if (error) {
            console.warn('Failed to create signed URL:', error);
            return imagePath; // Fallback to original URL
          }
          return data.signedUrl;
        }
      }
      return imagePath;
    } catch (error) {
      console.warn('Error getting authenticated image URL:', error);
      return imagePath;
    }
  };

  // Load authenticated URLs when images change
  useEffect(() => {
    if (isOpen && report?.images) {
      setIsImageLoading(true);
      const loadUrls = async () => {
        let images = Array.isArray(report.images) ? report.images : [report.images];
        
        // Filter out empty URLs but don't modify the URLs since they're already correct
        const validUrls = images.filter(img => img && img.trim() !== '');
        
        setImageUrls(validUrls);
        setIsImageLoading(false);
      };
      
      loadUrls();
    }
  }, [isOpen, report?.images]);

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

  const hasImages = imageUrls.length > 0;

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
                {isImageLoading ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '200px',
                    color: '#a1a1aa',
                    fontSize: '14px'
                  }}>
                    Loading image...
                  </div>
                ) : (
                  <>
                    <img
                      src={imageUrls[currentImageIndex]}
                      alt={`Photo ${currentImageIndex + 1}`}
                      className="post-image"
                      style={{ 
                        cursor: 'pointer',
                        minHeight: '200px',
                        width: '100%',
                        height: 'auto',
                        objectFit: 'cover'
                      }}
                      onClick={() => setShowFullImage(true)}
                      onError={(e) => { 
                        console.warn('Image failed to load:', imageUrls[currentImageIndex]);
                        e.target.src = 'https://placehold.co/600x400?text=Image+Not+Available'; 
                        setIsImageLoading(false);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', imageUrls[currentImageIndex]);
                        setIsImageLoading(false);
                      }}
                    />
                    {imageUrls.length > 1 && (
                      <>
                        <button className="post-img-nav prev" onClick={() => setCurrentImageIndex(i => (i > 0 ? i - 1 : imageUrls.length - 1))}>
                          <ChevronLeft size={18} />
                        </button>
                        <button className="post-img-nav next" onClick={() => setCurrentImageIndex(i => (i < imageUrls.length - 1 ? i + 1 : 0))}>
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
              <CheckCircle size={16} /> Verify & Dispatch
            </button>
          </div>
        )}
      </div>

      {/* Full Screen Image Viewer */}
      {showFullImage && (
        <div 
          className="fullscreen-image-viewer"
          onClick={() => setShowFullImage(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullImage(false);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000
            }}
          >
            <X size={20} />
          </button>
          
          <img
            src={imageUrls[currentImageIndex]}
            alt={`Photo ${currentImageIndex + 1}`}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              cursor: 'default'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(i => (i > 0 ? i - 1 : imageUrls.length - 1));
                }}
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(i => (i < imageUrls.length - 1 ? i + 1 : 0));
                }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={20} />
              </button>
              
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {currentImageIndex + 1} / {imageUrls.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ReportDetailModal;
