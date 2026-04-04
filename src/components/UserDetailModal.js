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
  Edit,
  Save,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { adminService, supabase } from '../config/supabase';
import { superAdminService } from '../services/superAdminService';
import ModernConfirmationModal from './ModernConfirmationModal';
import './UserDetailModal.css';

const UserDetailModal = ({ user, isOpen, onClose, onApprove, onReject, onSuspend, onRestore, loading, isSuperAdmin: propIsSuperAdmin }) => {
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [docZoom, setDocZoom] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    department: ''
  });
  const [saving, setSaving] = useState(false);
  const [resetModal, setResetModal] = useState({ isOpen: false, email: '', userId: null, generatedPass: null });
  const [resolvedDocuments, setResolvedDocuments] = useState([]);

  useEffect(() => {
    if (!isOpen || !user) return;

    const resolveDocs = async () => {
      let rawDocs = [];
      if (user.verification_documents) rawDocs = Array.isArray(user.verification_documents) ? user.verification_documents : [user.verification_documents];
      else if (user.documents) rawDocs = Array.isArray(user.documents) ? user.documents : [user.documents];
      else if (user.id_documents) rawDocs = Array.isArray(user.id_documents) ? user.id_documents : [user.id_documents];
      
      const filtered = rawDocs.filter(d => d && (typeof d === 'string' ? d.trim() !== '' : true));
      if (filtered.length === 0) {
        setResolvedDocuments([]);
        return;
      }

      setResolvedDocuments(filtered.map(() => 'loading')); 

      const resolved = await Promise.all(filtered.map(async (doc) => {
        if (typeof doc === 'string' && !doc.startsWith('http')) {
          try {
            const path = doc.includes(user.id) ? doc : `${user.id}/${doc}`;
            // Use createSignedUrl for private documents
            const { data, error } = await supabase.storage
              .from('verification-documents')
              .createSignedUrl(path, 3600);
            
            if (error) throw error;
            return data.signedUrl;
          } catch (err) {
            const { data } = supabase.storage.from('verification-documents').getPublicUrl(doc);
            return data?.publicUrl || doc;
          }
        }
        return doc;
      }));
      setResolvedDocuments(resolved);
    };

    resolveDocs();
  }, [isOpen, user?.id]); 

  useEffect(() => {
    if (isOpen && user) {
      setCurrentDocIndex(0);
      setDocZoom(false);
      setIsEditMode(false);
      setEditForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || user.phone_number || '',
        address: user.address || '',
        department: user.department || ''
      });
      document.body.style.overflow = 'hidden';
      
      if (propIsSuperAdmin !== undefined) {
        setIsSuperAdmin(propIsSuperAdmin);
      } else {
        checkSuperAdmin();
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, user?.id, propIsSuperAdmin]);

  const checkSuperAdmin = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', authUser.id)
          .single();
        setIsSuperAdmin(profile?.user_type === 'super_admin');
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset form
      setEditForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || user.phone_number || '',
        address: user.address || '',
        department: user.department || ''
      });
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveEdit = async () => {
    try {
      const digitsOnly = editForm.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 11) {
        alert('Phone number must be exactly 11 digits (e.g., 09123456789)');
        return;
      }
      
      setSaving(true);
      await adminService.updateUserProfile(user.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: digitsOnly,
        address: editForm.address,
        department: editForm.department
      });
      setIsEditMode(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user details');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !user.email) return;
    
    setResetModal({ isOpen: true, email: user.email, generatedPass: null });
  };

  const confirmResetPassword = async () => {
    const { email, userId } = resetModal;
    
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setSaving(true);
    try {
      await superAdminService.resetUserPassword(email, generated, userId || user.id);
      
      setResetModal(prev => ({ ...prev, generatedPass: generated }));
      
      try {
        await navigator.clipboard.writeText(generated);
      } catch (err) {}
    } catch (error) {
      console.error('Password reset failed:', error);
      alert(error.message || 'Failed to reset password');
      setResetModal({ ...resetModal, isOpen: false });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  /* ── Documents ── */
  const documents = resolvedDocuments;
  const hasDocuments = documents.length > 0;

  /* ── Status ── */
  const vs = user.verification_status;
  const isAdmin = user.user_type === 'admin';
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
        return { label: 'Administrator', icon: <Crown size={13} /> };
      case 'responder':
        return { label: 'Responder', icon: <Shield size={13} /> };
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

  const formatDateTime = (ds) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const docLabels = ['Front Side ID', 'Back Side ID', 'Supporting Document', 'Additional Proof'];

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
            {isSuperAdmin && (
              <button 
                className={`udm-edit-toggle ${isEditMode ? 'active' : ''}`}
                onClick={handleEditToggle}
              >
                {isEditMode ? (
                  <><X size={14} /> Cancel Edit</>
                ) : (
                  <><Edit size={14} /> Edit Details</>
                )}
              </button>
            )}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="udm-section-label" style={{ marginBottom: 0 }}>Documents</span>
                <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 500 }}>
                  Uploaded: {formatDateTime(user.updated_at || user.created_at)}
                </span>
              </div>
              <div className="udm-doc-viewer">
                <div className="udm-doc-main">
                  {documents[currentDocIndex] === 'loading' ? (
                    <div className="udm-doc-spinner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#fff' }}>
                      <RefreshCw size={24} className="spinning" />
                      <span style={{ fontSize: '11px' }}>Fetching secure link...</span>
                    </div>
                  ) : (
                    <img
                      src={documents[currentDocIndex]}
                      alt={`Document ${currentDocIndex + 1}`}
                      className={`udm-doc-img ${docZoom ? 'zoomed' : ''}`}
                      onClick={() => setDocZoom(!docZoom)}
                      onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Reloading...'; }}
                    />
                  )}
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
          {isEditMode ? (
            <div className="udm-edit-form">
              <div className="udm-edit-stack">
                <div className="udm-edit-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="udm-edit-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
                <div className="udm-edit-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setEditForm({...editForm, phone: val});
                    }}
                    placeholder="e.g. 09123456789"
                    maxLength={11}
                  />
                </div>
                <div className="udm-edit-group">
                  <label>Home Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Enter address"
                  />
                </div>
                <div className="udm-edit-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    placeholder="Enter department"
                  />
                </div>
              </div>
              <div className="udm-edit-actions">
                <button className="udm-btn-save" onClick={handleSaveEdit} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="udm-btn-cancel" onClick={handleEditToggle}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="udm-section-label" style={{ marginTop: 4 }}>Details</div>
              <div className="udm-details-stack">
                <div className="udm-detail-row">
                  <span className="udm-detail-label">Full Name</span>
                  <span className="udm-detail-value">{user.full_name || 'Not provided'}</span>
                </div>
                <div className="udm-detail-row">
                  <span className="udm-detail-label">Email Address</span>
                  <span className="udm-detail-value">{user.email || 'Not provided'}</span>
                </div>
                <div className="udm-detail-row">
                  <span className="udm-detail-label">Phone Number</span>
                  <span className="udm-detail-value">{user.phone || user.phone_number || 'Not provided'}</span>
                </div>
                <div className="udm-detail-row">
                  <span className="udm-detail-label">Joined On</span>
                  <span className="udm-detail-value">{formatDate(user.created_at)}</span>
                </div>
                {user.address && (
                  <div className="udm-detail-row">
                    <span className="udm-detail-label">Home Address</span>
                    <span className="udm-detail-value">{user.address}</span>
                  </div>
                )}
                {user.department && (
                  <div className="udm-detail-row">
                    <span className="udm-detail-label">Department</span>
                    <span className="udm-detail-value">{user.department}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer — context-sensitive buttons ── */}
        <div className="udm-footer">
          {/* Save button for edit mode - moved to form, remove from footer */}
          
          {/* PENDING → Reject + Verify user */}
          {!isEditMode && isPending && !isAdmin && (
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
                  onClick={() => onReject(user.id)}
                  disabled={loading}
                >
                  Reject
                </button>
                <button
                  className="udm-btn udm-btn-verify"
                  onClick={() => onApprove(user.id)}
                  disabled={loading}
                >
                  Verify user
                </button>
              </div>
            </div>
          )}

          {/* VERIFIED → Suspend account (Super Admin Only) */}
          {!isEditMode && isVerified && !isAdmin && !isPending && isSuperAdmin && (
            <div className="udm-footer-actions">
              <button
                className="udm-btn udm-btn-suspend"
                onClick={() => onSuspend(user.id)}
                disabled={loading}
              >
                <XCircle size={14} />
                Suspend account
              </button>
              <button
                className="udm-btn udm-btn-reset-pass"
                onClick={handleResetPassword}
                disabled={loading || saving}
              >
                <Lock size={14} />
                Reset Password
              </button>
            </div>
          )}

          {/* SUSPENDED → Restore access (Super Admin Only) */}
          {!isEditMode && isSuspended && !isAdmin && isSuperAdmin && (
            <div className="udm-footer-actions">
              <button
                className="udm-btn udm-btn-restore"
                onClick={() => onRestore(user.id)}
                disabled={loading}
              >
                <CheckCircle size={14} />
                Restore access
              </button>
              <button
                className="udm-btn udm-btn-reset-pass"
                onClick={handleResetPassword}
                disabled={loading || saving}
              >
                <Lock size={14} />
                Reset Password
              </button>
            </div>
          )}

          {/* UNVERIFIED (REJECTED) → Restore access */}
          {!isEditMode && isRejected && !isAdmin && (
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
          {!isEditMode && isAdmin && (
            <div className="udm-footer-actions">
              <button className="udm-btn udm-btn-close" onClick={onClose}>Close</button>
            </div>
          )}

        </div>

        <ModernConfirmationModal
          isOpen={resetModal.isOpen}
          onClose={() => setResetModal({ ...resetModal, isOpen: false })}
          onConfirm={confirmResetPassword}
          title="Reset Password"
          message={`Are you sure you want to reset the password for ${user.full_name || user.email}?`}
          confirmLabel={saving ? "Resetting..." : "Reset Now"}
          type="warning"
          generatedPassword={resetModal.generatedPass}
          onCopy={(txt) => {
            alert("Password copied to clipboard!");
          }}
        />
      </div>
    </>
  );
};

export default UserDetailModal;
