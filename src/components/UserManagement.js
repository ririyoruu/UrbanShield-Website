import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  RefreshCw,
  CheckCircle,
  X,
  Check,
  Search,
  FileText,
  Crown,
  Shield,
  User
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
  // list-only view (card view removed)
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      console.log('Raw user data:', data);

      // Transform the data to match our UI structure
      const transformedUsers = data.map(user => ({
        id: user.id,
        full_name: user.full_name || user.name || 'Unknown User',
        email: user.email,
        phone: user.phone || user.phone_number || 'Not provided',
        user_type: user.user_type || 'general_user',
        status: user.is_verified === true ? 'approved' :
          user.is_verified === false ? 'rejected' : 'pending',
        is_verified: user.is_verified,
        verification_status: user.verification_status,
        created_at: user.created_at,
        address: user.address || 'Not provided',
        business_name: user.business_name || null,
        department: user.department || null,
        is_active: user.is_active !== false,
        updated_at: user.updated_at || user.created_at,
        // Include verification documents if they exist
        verification_documents: user.verification_documents || user.documents || user.id_documents || [],
        documents: user.verification_documents || user.documents || user.id_documents || [],
        id_documents: user.verification_documents || user.documents || user.id_documents || []
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

  const handleApproveUser = async (userId) => {
    try {
      setSaving(true);
      console.log('Approving user:', userId);

      const result = await adminService.updateUserVerification(userId, true, 'verified');
      console.log('Approval result:', result);

      // Reload users from database to ensure we have the latest state
      await loadUsers();

      showMessage('success', 'User approved successfully');

      // Close modal after approval
      if (showUserModal) {
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error approving user:', error);
      showMessage('error', `Failed to approve user: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectUser = async (userId, reason = null) => {
    try {
      setSaving(true);
      console.log('Rejecting user:', userId);

      const result = await adminService.updateUserVerification(userId, false, 'rejected');
      console.log('Rejection result:', result);

      // Reload users from database to ensure we have the latest state
      await loadUsers();

      showMessage('success', 'User rejected successfully');

      if (showUserModal) {
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      showMessage('error', `Failed to reject user: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      setSaving(true);
      console.log('Suspending user:', userId);

      const result = await adminService.updateUserVerification(userId, false, 'suspended');
      console.log('Suspension result:', result);

      await loadUsers();
      if (showUserModal) handleCloseModal();
      showMessage('success', 'User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      showMessage('error', `Failed to suspend user: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      setSaving(true);
      await adminService.updateUserVerification(userId, true, 'verified');
      await loadUsers();
      if (showUserModal) handleCloseModal();
      showMessage('success', 'User access restored successfully');
    } catch (error) {
      console.error('Error restoring user:', error);
      showMessage('error', `Failed to restore user: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'admin': return <Crown size={20} />;
      case 'government_responder': return <Shield size={20} />;
      case 'government_official': return <Shield size={20} />;
      case 'resident': return <User size={20} />;
      case 'verified_resident': return <User size={20} />;
      default: return <User size={20} />;
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin': return '#dc2626';
      case 'government_responder': return '#8b5cf6';
      case 'government_official': return '#8b5cf6';
      case 'resident': return '#10b981';
      case 'verified_resident': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getUserTypeDisplayName = (userType) => {
    switch (userType) {
      case 'admin': return 'Admin';
      case 'government_responder': return 'Gov / Responder';
      case 'government_official': return 'Gov / Responder';
      case 'resident': return 'Resident';
      case 'verified_resident': return 'Resident';
      default: return 'Resident';
    }
  };

  const requiresApproval = (userType) => {
    // Users that DON'T need approval for badge: admin, tourist
    // All other users can use the app but need approval for verification badge
    const noApprovalNeeded = ['admin', 'tourist'];
    return !noApprovalNeeded.includes(userType);
  };

  const getStatusBadge = (user) => {
    // Auto-approved users (admin-created) get special status
    if (user.user_type === 'admin' || user.user_type === 'superadmin') {
      return { status: 'auto-approved', color: '#10b981', text: 'Auto-Approved' };
    }

    // Check only verification_status field
    if (user.verification_status === 'verified') {
      return { status: 'approved', color: '#10b981', text: 'Verified' };
    } else if (user.verification_status === 'rejected') {
      return { status: 'rejected', color: '#ef4444', text: 'Unverified' };
    } else if (user.verification_status === 'suspended') {
      return { status: 'suspended', color: '#ef4444', text: 'Suspended' };
    } else {
      // Default to pending for null, undefined, or 'pending' values
      return { status: 'pending', color: '#f59e0b', text: 'Pending Verification' };
    }
  };

  const getApprovalStatus = (user) => {
    return getStatusBadge(user);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all'
        || user.user_type === filterRole
        || (filterRole === 'government_responder' && user.user_type === 'government_official')
        || (filterRole === 'resident' && user.user_type === 'verified_resident');
      const approvalStatus = getApprovalStatus(user);
      const matchesStatus = filterStatus === 'all' || approvalStatus.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      pending: users.filter(u => getApprovalStatus(u).status === 'pending' && requiresApproval(u.user_type)).length,
      verified: users.filter(u => getApprovalStatus(u).status === 'approved' && requiresApproval(u.user_type)).length,
      rejected: users.filter(u => getApprovalStatus(u).status === 'rejected' && requiresApproval(u.user_type)).length,
      autoApproved: users.filter(u => getApprovalStatus(u).status === 'auto-approved').length
    };
  }, [users]);

  return (
    <div className="user-management">
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Search and Filters */}
      <div className="user-filters">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="government_responder">Gov / Responders</option>
            <option value="resident">Residents</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Verification</option>
            <option value="approved">Verified</option>
            <option value="rejected">Unverified</option>
            <option value="suspended">Suspended</option>
            <option value="auto-approved">Auto-Approved</option>
          </select>
        </div>
      </div>

      {/* User List */}
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
        <div className="users-list">
          <div className="list-header">
            <div className="list-column">User</div>
            <div className="list-column">Role & Status</div>
            <div className="list-column">Contact</div>
            <div className="list-column">Actions</div>
          </div>
          {filteredUsers.map(user => (
            <div key={user.id} className="user-list-item" onClick={() => handleViewUser(user)}>
              <div className="list-cell">
                <div className="user-info">
                  <div className="user-avatar-small" style={{ backgroundColor: getUserTypeColor(user.user_type) + '20' }}>
                    {getUserTypeIcon(user.user_type)}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {user.full_name}
                      {((user.verification_documents && user.verification_documents.length > 0) ||
                        (user.documents && user.documents.length > 0) ||
                        (user.id_documents && user.id_documents.length > 0)) && (
                          <span className="has-documents-indicator" title="Has verification documents"><FileText size={13} /></span>
                        )}
                    </div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-joined">Joined {formatDate(user.created_at)}</div>
                  </div>
                </div>
              </div>
              <div className="list-cell">
                <div className="user-badges">
                  <span className="user-type-badge" style={{ color: getUserTypeColor(user.user_type), background: getUserTypeColor(user.user_type) + '15', border: `1px solid ${getUserTypeColor(user.user_type)}30` }}>
                    {getUserTypeIcon(user.user_type)}
                    {getUserTypeDisplayName(user.user_type)}
                  </span>
                  <span className="status-badge" style={{ backgroundColor: getApprovalStatus(user).color + '15', color: getApprovalStatus(user).color, border: `1px solid ${getApprovalStatus(user).color}30` }}>
                    {getApprovalStatus(user).text}
                  </span>
                </div>
              </div>
              <div className="list-cell">
                <div className="user-phone">{user.phone || '—'}</div>
              </div>
              <div className="list-cell">
                <div className="user-actions" onClick={(e) => e.stopPropagation()}>
                  {getApprovalStatus(user).status === 'pending' && requiresApproval(user.user_type) && (
                    <>
                      <button className="btn-approve" onClick={(e) => { e.stopPropagation(); handleApproveUser(user.id); }} disabled={saving} title="Approve"><Check size={13} /></button>
                      <button className="btn-reject" onClick={(e) => { e.stopPropagation(); handleRejectUser(user.id); }} disabled={saving} title="Reject"><X size={13} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
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

