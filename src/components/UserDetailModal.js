import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  Image as ImageIcon
} from 'lucide-react';
import './UserDetailModal.css';

const UserDetailModal = ({ user, isOpen, onClose, onApprove, onReject, loading }) => {
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [documentZoom, setDocumentZoom] = useState(false);

  // Reset document index when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setCurrentDocumentIndex(0);
      setDocumentZoom(false);
    }
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  // Handle different document data formats
  let documents = [];
  if (user.verification_documents) {
    documents = Array.isArray(user.verification_documents) ? user.verification_documents : [user.verification_documents];
  } else if (user.documents) {
    documents = Array.isArray(user.documents) ? user.documents : [user.documents];
  } else if (user.id_documents) {
    documents = Array.isArray(user.id_documents) ? user.id_documents : [user.id_documents];
  }
  // Filter out null/undefined/empty strings
  documents = documents.filter(doc => doc && doc.trim() !== '');
  const hasDocuments = documents.length > 0;

  const canVerify = user.verification_status === 'pending' || user.verification_status === null || user.verification_status === undefined;

  const handlePreviousDocument = () => {
    setCurrentDocumentIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1));
  };

  const handleNextDocument = () => {
    setCurrentDocumentIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0));
  };

  const handleDocumentClick = () => {
    setDocumentZoom(!documentZoom);
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
    if (user.verification_status === 'verified') {
      return { text: 'Verified', color: '#10b981', icon: <CheckCircle size={16} /> };
    } else if (user.verification_status === 'rejected') {
      return { text: 'Rejected', color: '#ef4444', icon: <XCircle size={16} /> };
    } else if (user.verification_status === 'suspended') {
      return { text: 'Suspended', color: '#ef4444', icon: <XCircle size={16} /> };
    }
    return { text: 'Pending Verification', color: '#f59e0b', icon: <AlertTriangle size={16} /> };
  };

  const statusBadge = getStatusBadge();

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin': return '#dc2626';
      case 'tourist': return '#3b82f6';
      case 'verified_resident': return '#10b981';
      case 'business_owner': return '#3b82f6';
      case 'government_official': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getUserTypeDisplayName = (userType) => {
    switch (userType) {
      case 'admin': return 'Admin';
      case 'tourist': return 'Tourist';
      case 'verified_resident': return 'Verified Resident';
      case 'business_owner': return 'Business Owner';
      case 'government_official': return 'Government Official';
      default: return userType;
    }
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'admin': return <Shield size={20} />;
      case 'tourist': return <User size={20} />;
      case 'verified_resident': return <User size={20} />;
      case 'business_owner': return <Building size={20} />;
      case 'government_official': return <Shield size={20} />;
      default: return <User size={20} />;
    }
  };

  const requiresApproval = (userType) => {
    const noApprovalNeeded = ['admin', 'tourist'];
    return !noApprovalNeeded.includes(userType);
  };

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="user-modal-header">
          <div className="user-modal-title-section">
            <div className="user-header-info">
              <div 
                className="user-avatar-large" 
                style={{ backgroundColor: getUserTypeColor(user.user_type) + '20' }}
              >
                {getUserTypeIcon(user.user_type)}
              </div>
              <div>
                <h2 className="user-modal-title">{user.full_name || user.name || 'Unknown User'}</h2>
                <p className="user-modal-subtitle">{user.email}</p>
              </div>
            </div>
            <div className="user-modal-badges">
              <span 
                className="status-badge-modal" 
                style={{ backgroundColor: statusBadge.color }}
              >
                {statusBadge.icon}
                {statusBadge.text}
              </span>
              <span 
                className="user-type-badge-modal" 
                style={{ color: getUserTypeColor(user.user_type) }}
              >
                {getUserTypeIcon(user.user_type)}
                {getUserTypeDisplayName(user.user_type)}
              </span>
            </div>
          </div>
          <button className="user-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="user-modal-body">
          {/* Documents Section */}
          {hasDocuments ? (
            <div className="user-documents-section">
              <div className="documents-header">
                <div className="documents-title">
                  <FileText size={20} />
                  <span>Verification Documents ({documents.length})</span>
                </div>
                {documents.length > 1 && (
                  <div className="document-navigation">
                    <button 
                      className="nav-document-btn" 
                      onClick={handlePreviousDocument}
                      disabled={loading}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="document-counter">
                      {currentDocumentIndex + 1} / {documents.length}
                    </span>
                    <button 
                      className="nav-document-btn" 
                      onClick={handleNextDocument}
                      disabled={loading}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className={`document-container ${documentZoom ? 'zoomed' : ''}`}>
                <img 
                  src={documents[currentDocumentIndex]} 
                  alt={`Verification Document ${currentDocumentIndex + 1}`}
                  className="user-document"
                  onClick={handleDocumentClick}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=Document+Not+Available';
                  }}
                />
                {documentZoom && (
                  <div className="document-zoom-controls">
                    <button 
                      className="zoom-btn" 
                      onClick={() => setDocumentZoom(false)}
                      title="Zoom Out"
                    >
                      <ZoomOut size={18} />
                    </button>
                  </div>
                )}
                {documents.length > 1 && (
                  <div className="document-thumbnails">
                    {documents.map((doc, idx) => (
                      <img
                        key={idx}
                        src={doc}
                        alt={`Thumbnail ${idx + 1}`}
                        className={`thumbnail ${idx === currentDocumentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentDocumentIndex(idx)}
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
            <div className="no-documents-warning">
              <AlertTriangle size={24} />
              <div>
                <h3>No Verification Documents Available</h3>
                <p>This user has not submitted any verification documents. Verification may require additional information.</p>
              </div>
            </div>
          )}

          {/* User Details */}
          <div className="user-details-section">
            <h3 className="section-title">User Information</h3>
            
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">
                  <Mail size={18} />
                  <span>Email</span>
                </div>
                <div className="detail-value">{user.email || 'Not provided'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <Phone size={18} />
                  <span>Phone</span>
                </div>
                <div className="detail-value">{user.phone || user.phone_number || 'Not provided'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <Calendar size={18} />
                  <span>Joined</span>
                </div>
                <div className="detail-value">{formatDate(user.created_at)}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">
                  <Clock size={18} />
                  <span>Last Updated</span>
                </div>
                <div className="detail-value">{formatDate(user.updated_at)}</div>
              </div>

              {user.address && (
                <div className="detail-item">
                  <div className="detail-label">
                    <MapPin size={18} />
                    <span>Address</span>
                  </div>
                  <div className="detail-value">{user.address}</div>
                </div>
              )}

              {user.business_name && (
                <div className="detail-item">
                  <div className="detail-label">
                    <Building size={18} />
                    <span>Business Name</span>
                  </div>
                  <div className="detail-value">{user.business_name}</div>
                </div>
              )}

              {user.department && (
                <div className="detail-item">
                  <div className="detail-label">
                    <Building size={18} />
                    <span>Department</span>
                  </div>
                  <div className="detail-value">{user.department}</div>
                </div>
              )}

              <div className="detail-item">
                <div className="detail-label">
                  <Shield size={18} />
                  <span>Account Status</span>
                </div>
                <div className="detail-value">
                  <span 
                    className="status-badge-inline" 
                    style={{ 
                      backgroundColor: user.is_active ? '#10b981' : '#ef4444',
                      color: 'white'
                    }}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          {!canVerify && (
            <div className="verification-status-section">
              <div className={`verification-status ${user.is_verified ? 'approved' : 'rejected'}`}>
                {user.is_verified ? (
                  <>
                    <CheckCircle size={24} />
                    <div>
                      <h4>User Verified</h4>
                      <p>This user has been verified and approved by an administrator.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={24} />
                    <div>
                      <h4>User Not Verified</h4>
                      <p>This user has been reviewed and is not verified.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="user-modal-footer">
          {canVerify && requiresApproval(user.user_type) && (
            <>
              {!hasDocuments && (
                <div className="verification-warning">
                  <AlertTriangle size={18} />
                  <span>Warning: This user has no verification documents. Verify authenticity before approval.</span>
                </div>
              )}
              <div className="modal-actions">
                <button 
                  className="btn-approve-modal"
                  onClick={() => {
                    if (!hasDocuments) {
                      if (!window.confirm('This user has no verification documents. Are you sure you want to approve them without documents?')) {
                        return;
                      }
                    }
                    onApprove(user.id);
                  }}
                  disabled={loading}
                >
                  <CheckCircle size={18} />
                  Approve User
                </button>
                <button 
                  className="btn-reject-modal"
                  onClick={() => {
                    const reason = window.prompt('Please provide a reason for rejection (optional):');
                    onReject(user.id, reason);
                  }}
                  disabled={loading}
                >
                  <XCircle size={18} />
                  Reject User
                </button>
              </div>
            </>
          )}
          {(!canVerify || !requiresApproval(user.user_type)) && (
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

export default UserDetailModal;



