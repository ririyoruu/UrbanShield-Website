import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  RefreshCw,
  Search,
  MoreHorizontal,
} from 'lucide-react';
import { adminService } from '../config/supabase';
import UserDetailModal from './UserDetailModal';
import './UserManagement.css';
import './ZenithIncidentModeration.css';
import './ZenithTableModeration.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      const transformedUsers = data.map(user => ({
        id: user.id,
        full_name: user.full_name || user.name || 'Unknown User',
        email: user.email,
        phone: user.phone || user.phone_number || '',
        user_type: user.user_type || 'general_user',
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

  const handleApproveUser = (userId) => handleUserStatusChange(userId, {
    isVerified: true,
    status: 'verified',
    successMessage: 'User verified successfully'
  });

  const handleRejectUser = (userId) => handleUserStatusChange(userId, {
    isVerified: false,
    status: 'rejected',
    successMessage: 'User rejected successfully'
  });

  const handleSuspendUser = (userId) => handleUserStatusChange(userId, {
    isVerified: false,
    status: 'suspended',
    successMessage: 'User suspended successfully'
  });

  const handleRestoreUser = (userId) => handleUserStatusChange(userId, {
    isVerified: null,
    status: 'pending',
    successMessage: 'User access restored — now pending review'
  });

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
    return users.filter(user => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s ||
        user.full_name.toLowerCase().includes(s) ||
        user.email.toLowerCase().includes(s);
      const matchesRole = filterRole === 'all' ||
        user.user_type === filterRole;
      const statusKey = getStatusInfo(user).key;
      const matchesStatus = filterStatus === 'all' || statusKey === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
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
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
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

      <div className="zenith-toolbar">
        <div className="zenith-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="zenith-toolbar-actions">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="zenith-filter-select um-role-select">
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="responder">Responders</option>
            <option value="resident">Residents</option>
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
                  const docs = user.verification_documents || user.documents || [];
                  const docCount = Array.isArray(docs) ? docs.filter(d => d && d.trim()).length : 0;
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
        loading={saving && selectedUser?.id === actionUserId}
      />
    </div>
  );
}
;

export default UserManagement;
