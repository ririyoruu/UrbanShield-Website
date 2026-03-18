import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  RefreshCw,
  Search,
} from 'lucide-react';
import { adminService } from '../config/supabase';
import UserDetailModal from './UserDetailModal';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

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
  const handleApproveUser = async (userId) => {
    try {
      setSaving(true);
      // Optimistic update
      setSelectedUser(prev => prev && prev.id === userId ? { ...prev, verification_status: 'verified', is_verified: true } : prev);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verification_status: 'verified', is_verified: true } : u));
      await adminService.updateUserVerification(userId, true, 'verified');
      await loadUsers();
      showMessage('success', 'User verified successfully');
    } catch (error) {
      console.error('Error verifying user:', error);
      showMessage('error', `Failed to verify user: ${error.message}`);
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      setSaving(true);
      setSelectedUser(prev => prev && prev.id === userId ? { ...prev, verification_status: 'rejected', is_verified: false } : prev);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verification_status: 'rejected', is_verified: false } : u));
      await adminService.updateUserVerification(userId, false, 'rejected');
      await loadUsers();
      showMessage('success', 'User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      showMessage('error', `Failed to reject user: ${error.message}`);
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      setSaving(true);
      setSelectedUser(prev => prev && prev.id === userId ? { ...prev, verification_status: 'suspended', is_verified: false } : prev);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verification_status: 'suspended', is_verified: false } : u));
      await adminService.updateUserVerification(userId, false, 'suspended');
      await loadUsers();
      showMessage('success', 'User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      showMessage('error', `Failed to suspend user: ${error.message}`);
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  // Restore resets to pending so admin can re-verify
  const handleRestoreUser = async (userId) => {
    try {
      setSaving(true);
      setSelectedUser(prev => prev && prev.id === userId ? { ...prev, verification_status: 'pending', is_verified: null } : prev);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verification_status: 'pending', is_verified: null } : u));
      // Reset to pending so verify flow restarts
      await adminService.updateUserVerification(userId, null, 'pending');
      await loadUsers();
      showMessage('success', 'User access restored — now pending review');
    } catch (error) {
      console.error('Error restoring user:', error);
      showMessage('error', `Failed to restore user: ${error.message}`);
      await loadUsers();
    } finally {
      setSaving(false);
    }
  };

  /* ── Status helpers ── */
  const getStatusInfo = (user) => {
    const vs = user.verification_status;
    if (user.user_type === 'admin' || user.user_type === 'superadmin') {
      return { label: 'Verified', color: '#10b981', key: 'verified' };
    }
    if (vs === 'verified') return { label: 'Verified', color: '#10b981', key: 'verified' };
    if (vs === 'suspended') return { label: 'Suspended', color: '#ef4444', key: 'suspended' };
    if (vs === 'rejected') return { label: 'Unverified', color: '#ef4444', key: 'rejected' };
    return { label: 'Pending', color: '#f59e0b', key: 'pending' };
  };

  const getRoleLabel = (userType) => {
    switch (userType) {
      case 'admin':
      case 'superadmin': return 'Admin';
      case 'government':
      case 'government_responder':
      case 'government_official':
      case 'responder': return 'Official/Responder';
      case 'resident':
      case 'verified_resident': return 'Resident';
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
        user.user_type === filterRole ||
        (filterRole === 'government_responder' && (
          user.user_type === 'government_official' ||
          user.user_type === 'government' ||
          user.user_type === 'responder'
        )) ||
        (filterRole === 'resident' && user.user_type === 'verified_resident');
      const statusKey = getStatusInfo(user).key;
      const matchesStatus = filterStatus === 'all' || statusKey === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  return (
    <div className="user-management">
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Filters */}
      <div className="user-filters">
        <div className="search-container">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="government_responder">Responders</option>
            <option value="resident">Residents</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Unverified</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state">
          <RefreshCw size={32} className="spinning" />
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No users found</h3>
          <p>No users match your current filters</p>
        </div>
      ) : (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Docs</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const statusInfo = getStatusInfo(user);
                const docs = user.verification_documents || user.documents || [];
                const docCount = Array.isArray(docs) ? docs.filter(d => d && d.trim()).length : 0;
                const initials = getInitials(user.full_name);
                return (
                  <tr key={user.id} onClick={() => handleViewUser(user)}>
                    <td>
                      <div className="um-user-cell">
                        <div className="um-avatar">{initials}</div>
                        <div>
                          <div className="um-user-name">{user.full_name}</div>
                          <div className="um-user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="um-role">{getRoleLabel(user.user_type)}</span>
                    </td>
                    <td>
                      <span className="um-status">
                        <span className="um-status-dot" style={{ background: statusInfo.color }} />
                        <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                      </span>
                    </td>
                    <td>
                      <span className="um-docs">{docCount > 0 ? docCount : '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={handleCloseModal}
        onApprove={handleApproveUser}
        onReject={handleRejectUser}
        onSuspend={handleSuspendUser}
        onRestore={handleRestoreUser}
        loading={saving}
      />
    </div>
  );
};

export default UserManagement;
