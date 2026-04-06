import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  RefreshCw,
  Search,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Check,
  XCircle,
  AlertTriangle,
  SlidersHorizontal,
  Upload
} from 'lucide-react';
import { adminService } from '../config/supabase';
import UserDetailModal from './UserDetailModal';
import './UserManagement.css';
import './ZenithIncidentModeration.css';
import './ZenithTableModeration.css';

const UserManagement = ({ isSuperAdmin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '', onConfirm: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const formatDisplayId = useCallback((index, total, prefix = 'USR') => {
    const padded = (total - index).toString().padStart(4, '0');
    return `${prefix}-${padded}`;
  }, []);

  const formatDate = (ds) => {
    if (!ds) return '—';
    return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => { loadUsers(); }, []);

  const showMessage = (type, message, title = '') => {
    setModal({
      show: true,
      type,
      title: title || (type === 'success' ? 'Completed' : type === 'error' ? 'Error' : 'Notification'),
      message,
      onConfirm: null
    });
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      const transformedUsers = data
        .filter(user => user.user_type === 'resident' || user.user_type === 'general_user' || !user.user_type)
        .map(user => ({
          id: user.id,
          full_name: user.full_name || user.name || 'Unknown User',
          email: user.email,
          phone: user.phone || user.phone_number || '',
          user_type: user.user_type || 'resident',
          is_verified: user.is_verified,
          verification_status: user.verification_status,
          created_at: user.created_at,
          address: user.address || '',
          department: user.department || null,
          is_active: user.is_active !== false,
          updated_at: user.updated_at || user.created_at,
          verification_documents: user.verification_documents || user.documents || user.id_documents || [],
          documents: user.verification_documents || user.documents || user.id_documents || [],
          id_documents: user.verification_documents || user.documents || user.id_documents || [],
        }));
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (!selectedUsers.size) return;
    const count = selectedUsers.size;

    setModal({
      show: true,
      type: 'confirm',
      title: 'Delete Residents?',
      message: `Are you sure you want to permanently delete ${count} selected profile(s)? This action cannot be undone.`,
      confirmLabel: 'Delete rows',
      cancelLabel: 'Keep them',
      onConfirm: executeBulkDelete
    });
  };

  const executeBulkDelete = async () => {
    const count = selectedUsers.size;
    const oldUsers = [...users];
    const userIds = Array.from(selectedUsers);

    setModal({ show: false }); // Close confirm modal
    setUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
    setSelectedUsers(new Set());

    try {
      setSaving(true);
      await adminService.deleteUsers(userIds);
      showMessage('success', `${count} profile(s) deleted successfully`);
      await loadUsers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showMessage('error', `Failed to delete on server: ${error.message || 'Check RLS'}`);
      setUsers(oldUsers);
    } finally {
      setSaving(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  /* ── Actions (optimistic + reload) ── */
  const applyUserUpdate = (userId, updates) => {
    if (!userId || !updates) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    setSelectedUser(prev => (prev && prev.id === userId ? { ...prev, ...updates } : prev));
  };

  const handleUserStatusChange = async (userId, { isVerified, status, successMessage }) => {
    try {
      setSaving(true);
      setActionUserId(userId);
      console.log('🔄 Updating user verification:', { userId, isVerified, status });
      const response = await adminService.updateUserVerification(userId, isVerified, status);
      console.log('✅ DB response:', response);
      const updated = Array.isArray(response) ? response[0] : response;
      if (updated) {
        console.log('✅ Applying optimistic update:', updated);
        applyUserUpdate(userId, {
          verification_status: updated.verification_status,
          is_verified: updated.is_verified,
          updated_at: updated.updated_at
        });
      }
      console.log('🔄 Reloading all users from DB...');
      await loadUsers();
      if (successMessage) {
        showMessage('success', successMessage);
      }
      handleCloseModal();
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      showMessage('error', `Failed to update user: ${error.message || 'Unknown error'}`);
      await loadUsers();
    } finally {
      setActionUserId(null);
      setSaving(false);
    }
  };

  const handleApproveUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setModal({
      show: true,
      type: 'confirm',
      title: 'Approve Resident?',
      message: `Are you sure you want to verify ${user?.full_name || 'this user'}? This will give them full access to the platform.`,
      confirmLabel: 'Verify Resident',
      cancelLabel: 'Not now',
      onConfirm: () => handleUserStatusChange(userId, {
        isVerified: true,
        status: 'verified',
        successMessage: 'User verified successfully'
      })
    });
  };

  const handleRejectUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setModal({
      show: true,
      type: 'confirm',
      title: 'Reject Resident?',
      message: `Are you sure you want to reject ${user?.full_name || 'this user'}'s registration?`,
      confirmLabel: 'Reject Registration',
      cancelLabel: 'Go back',
      onConfirm: () => handleUserStatusChange(userId, {
        isVerified: false,
        status: 'rejected',
        successMessage: 'User rejected successfully'
      })
    });
  };

  const handleSuspendUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setModal({
      show: true,
      type: 'confirm',
      title: 'Suspend Account?',
      message: `Are you sure you want to suspend access for ${user?.full_name || 'this user'}? They will lose all permissions.`,
      confirmLabel: 'Suspend User',
      cancelLabel: 'Cancel',
      onConfirm: () => handleUserStatusChange(userId, {
        isVerified: false,
        status: 'suspended',
        successMessage: 'User suspended successfully'
      })
    });
  };

  const handleRestoreUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setModal({
      show: true,
      type: 'confirm',
      title: 'Restore Access?',
      message: `Restore access for ${user?.full_name || 'this user'}? Status will return to pending review.`,
      confirmLabel: 'Restore Access',
      cancelLabel: 'Cancel',
      onConfirm: () => handleUserStatusChange(userId, {
        isVerified: null,
        status: 'pending',
        successMessage: 'User access restored — now pending review'
      })
    });
  };

  /* ── Status helpers ── */
  const getStatusInfo = (user) => {
    const vs = user.verification_status;
    if (user.user_type === 'admin') {
      return { label: 'Verified', color: '#10b981', key: 'verified' };
    }
    if (vs === 'verified') return { label: 'Verified', color: '#10b981', key: 'verified' };
    if (vs === 'suspended') return { label: 'Suspended', color: '#ef4444', key: 'suspended' };
    if (vs === 'rejected') return { label: 'Unverified', color: '#ef4444', key: 'rejected' };
    return { label: 'Pending', color: '#f59e0b', key: 'pending' };
  };

  const getRoleLabel = (userType) => {
    switch (userType) {
      case 'admin': return 'Admin';
      case 'responder': return 'Responder';
      case 'resident': return 'Resident';
      default: return userType || 'Resident';
    }
  };

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* ── Filters ── */
  const filteredUsers = useMemo(() => {
    let result = users.filter(user => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s ||
        user.full_name.toLowerCase().includes(s) ||
        user.email.toLowerCase().includes(s);

      const statusKey = getStatusInfo(user).key;
      const matchesStatus = filterStatus === 'all' || statusKey === filterStatus;

      // Document Filter
      const docs = Array.isArray(user.verification_documents) ? user.verification_documents :
        (user.documents ? (Array.isArray(user.documents) ? user.documents : [user.documents]) : []);
      const hasDocs = docs.filter(d => d && (typeof d === 'string' ? d.trim() : true)).length > 0;
      const matchesDocs = filterRole === 'all' ||
        (filterRole === 'with_docs' && hasDocs) ||
        (filterRole === 'no_docs' && !hasDocs);

      return matchesSearch && matchesStatus && matchesDocs;
    });

    // Sort By Newest/Oldest (using sortingState if you want, but simple for now)
    if (filterRole === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [users, searchTerm, filterRole, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      pending: users.filter(u => getStatusInfo(u).key === 'pending').length,
      verified: users.filter(u => getStatusInfo(u).key === 'verified').length,
      suspended: users.filter(u => getStatusInfo(u).key === 'suspended').length,
      rejected: users.filter(u => getStatusInfo(u).key === 'rejected').length,
    };
  }, [users]);

  /* ── Checkbox Selection ── */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (e, userId) => {
    e.stopPropagation();
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length;
  const isIndeterminate = selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length;

  return (
    <div className="zenith-table-moderation user-management-module">
      {/* Zenith Status Modal (Replacement for Alerts/Confirms) */}
      {modal.show && (
        <div className="zenith-status-modal-overlay">
          <div className={`zenith-status-modal ${modal.type}`}>
            <div className={`status-icon-glow ${modal.type}`}>
              {modal.type === 'success' && <CheckCircle size={40} className="status-checkmark" />}
              {modal.type === 'error' && <XCircle size={40} className="status-error" />}
              {modal.type === 'confirm' && <AlertTriangle size={40} className="status-warning" />}
            </div>
            <h3>{modal.title}</h3>
            <p>{modal.message}</p>

            {modal.type === 'confirm' ? (
              <div className="zenith-modal-actions">
                <button className="zenith-modal-btn cancel" onClick={() => setModal({ show: false })}>
                  {modal.cancelLabel || 'Cancel'}
                </button>
                <button className={`zenith-modal-btn ${modal.confirmLabel?.toLowerCase().includes('delete') ? 'confirm-delete' : 'confirm-submit'}`} onClick={modal.onConfirm}>
                  {modal.confirmLabel || 'Confirm'}
                </button>
              </div>
            ) : (
              <button className="status-close-btn" onClick={() => setModal({ show: false })}>Done</button>
            )}
          </div>
        </div>
      )}

      <div className="zenith-tabs">
        <button className={`zenith-tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          All <span>{stats.total}</span>
        </button>
        <button className={`zenith-tab ${filterStatus === 'verified' ? 'active' : ''}`} onClick={() => setFilterStatus('verified')}>
          Verified <span>{stats.verified}</span>
        </button>
        <button className={`zenith-tab ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>
          Pending <span>{stats.pending}</span>
        </button>
        <button className={`zenith-tab ${filterStatus === 'suspended' ? 'active' : ''}`} onClick={() => setFilterStatus('suspended')}>
          Suspended <span>{stats.suspended}</span>
        </button>
        <button className={`zenith-tab ${filterStatus === 'rejected' ? 'active' : ''}`} onClick={() => setFilterStatus('rejected')}>
          Unverified <span>{stats.rejected}</span>
        </button>
      </div>

      {/* Bulk Action Bar (Supabase Style) — Super Admin Only */}
      {isSuperAdmin && selectedUsers.size > 0 && (
        <div className="zenith-selection-bar active">
          <div className="selection-info">
            <span className="selection-count">{selectedUsers.size}</span>
            <span className="selection-text">Resident{selectedUsers.size > 1 ? 's' : ''} selected</span>
          </div>
          <div className="selection-actions">
            <button className="selection-btn cancel" onClick={() => setSelectedUsers(new Set())}>
              Clear selection
            </button>
            <button className="selection-btn delete" onClick={handleBulkDelete} disabled={saving}>
              <Trash2 size={16} />
              {saving ? 'Deleting...' : 'Delete rows'}
            </button>
          </div>
        </div>
      )}

      <div className="zenith-toolbar">
        <div className="zenith-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search residents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="zenith-toolbar-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Document Filter */}
          <select
            className="zenith-toolbar-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Recent (Newest)</option>
            <option value="oldest">Oldest First</option>
            <option value="with_docs">Has Documents</option>
            <option value="no_docs">No Documents</option>
          </select>
        </div>
      </div>

      <div className="zenith-table-container">
        {loading ? (
          <div className="zenith-loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="zenith-empty-state">
            <Users size={48} />
            <h3>No users found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="zenith-table-wrapper">
            <table className="zenith-data-table">
              <thead>
                <tr>
                  <th className="zenith-checkbox-cell">
                    <input
                      type="checkbox"
                      className="zenith-checkbox"
                      checked={isAllSelected}
                      ref={el => el && (el.indeterminate = isIndeterminate)}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>User ID</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Documents</th>
                  <th>Joined</th>
                  <th className="zenith-actions-cell"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const statusInfo = getStatusInfo(user);
                  const docs = Array.isArray(user.verification_documents) ? user.verification_documents :
                    (user.documents ? (Array.isArray(user.documents) ? user.documents : [user.documents]) : []);
                  const docCount = docs.filter(d => d && (typeof d === 'string' ? d.trim() : true)).length;
                  const initials = getInitials(user.full_name);
                  const statusClass = `status-${statusInfo.key}`;
                  return (
                    <tr key={user.id} onClick={() => handleViewUser(user)}>
                      <td className="zenith-checkbox-cell" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="zenith-checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => handleSelectUser(e, user.id)}
                        />
                      </td>
                      <td className="zenith-order-cell">
                        {formatDisplayId(index, filteredUsers.length)}
                      </td>
                      <td>
                        <div className="zenith-customer-cell">
                          <div className="zenith-avatar">{initials}</div>
                          <div className="zenith-customer-info">
                            <div className="zenith-customer-name">{user.full_name}</div>
                            <div className="zenith-customer-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="zenith-role-pill">{getRoleLabel(user.user_type)}</span>
                      </td>
                      <td>
                        <span className={`zenith-status-badge ${statusClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>{docCount > 0 ? `${docCount} file${docCount > 1 ? 's' : ''}` : '—'}</td>
                      <td className="zenith-date-cell">{formatDate(user.created_at)}</td>
                      <td className="zenith-actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button className="zenith-actions-btn" onClick={() => handleViewUser(user)}>
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserDetailModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={handleCloseModal}
        onApprove={handleApproveUser}
        onReject={handleRejectUser}
        onSuspend={handleSuspendUser}
        onRestore={handleRestoreUser}
        isSuperAdmin={isSuperAdmin}
        loading={saving && selectedUser?.id === actionUserId}
      />
    </div>
  );
}
  ;

export default UserManagement;
