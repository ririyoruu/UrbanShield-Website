import React, { useState, useEffect } from 'react';
import { adminService } from '../config/supabase';
import UserDetailModal from './UserDetailModal';
import './VerificationManagement.css';
import { RefreshCw, UserCheck } from 'lucide-react';

const VerificationManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      // Only keep users that need verification and are pending
      const pendingUsers = data.filter(u => {
        const isPending = !u.verification_status || u.verification_status === 'pending';
        const isNotAdmin = u.user_type !== 'admin' && u.user_type !== 'superadmin';
        return isPending && isNotAdmin;
      }).map(u => ({
        ...u,
        full_name: u.full_name || u.name || 'Unknown User',
        verification_documents: u.verification_documents || u.documents || u.id_documents || []
      }));
      setUsers(pendingUsers);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => { setSelectedUser(user); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setSelectedUser(null); };

  const handleApprove = async (userId) => {
    try {
      setSaving(true);
      // Optimistic
      setUsers(prev => prev.filter(u => u.id !== userId));
      await adminService.updateUserVerification(userId, true, 'verified');
      handleCloseModal();
    } catch (err) {
      console.error('Error verifying user:', err);
      alert(`Failed to verify user: ${err?.message || 'Unknown error'}`);
      await loadUsers();
    } finally { setSaving(false); }
  };

  const handleReject = async (userId) => {
    try {
      setSaving(true);
      // Optimistic
      setUsers(prev => prev.filter(u => u.id !== userId));
      await adminService.updateUserVerification(userId, false, 'rejected');
      handleCloseModal();
    } catch (err) {
      console.error('Error rejecting user:', err);
      alert(`Failed to reject user: ${err?.message || 'Unknown error'}`);
      await loadUsers();
    } finally { setSaving(false); }
  };

  const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="vm-container">
      <div className="vm-header-text">
        {users.length} {users.length === 1 ? 'user' : 'users'} pending verification
      </div>

      {loading ? (
        <div className="vm-empty"><RefreshCw size={28} className="spinning" /><p>Loading...</p></div>
      ) : users.length === 0 ? (
        <div className="vm-empty"><UserCheck size={36} /><p>No users pending verification</p></div>
      ) : (
        <div className="vm-list">
          {users.map(user => {
            const initials = getInitials(user.full_name);
            const docs = user.verification_documents || [];
            
            return (
              <div key={user.id} className="vm-card" onClick={() => handleViewUser(user)}>
                
                {/* Left: Avatar + Info */}
                <div className="vm-user-info">
                  <div className="vm-avatar">{initials}</div>
                  <div className="vm-user-details">
                    <div className="vm-name">{user.full_name}</div>
                    <div className="vm-email">{user.email}</div>
                  </div>
                </div>

                {/* Middle: Documents previews */}
                <div className="vm-docs-preview">
                  {docs.slice(0, 3).map((docStr, i) => (
                    <img key={i} src={docStr} alt="" className="vm-doc-thumb" onError={(e) => e.target.style.display = 'none'} />
                  ))}
                  {docs.length > 3 && (
                    <div className="vm-doc-more">+{docs.length - 3}</div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="vm-actions">
                  <button 
                    className="vm-btn-reject" 
                    onClick={(e) => { e.stopPropagation(); handleReject(user.id); }}
                    disabled={saving}
                  >
                    Reject
                  </button>
                  <button 
                    className="vm-btn-verify" 
                    onClick={(e) => { e.stopPropagation(); handleApprove(user.id); }}
                    disabled={saving}
                  >
                    Verify
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
        isOpen={showModal}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={saving}
      />
    </div>
  );
};

export default VerificationManagement;
