import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  FileText,
  AlertTriangle,
  RefreshCw,
  User,
  Building,
  Shield,
  Users as UsersIcon
} from 'lucide-react';
import { adminService } from '../config/supabase';
import UserDetailModal from './UserDetailModal';
import './VerificationManagement.css';

const VerificationManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  // Helper functions - defined first
  const requiresApproval = (userType) => {
    const noApprovalNeeded = ['admin', 'tourist'];
    return !noApprovalNeeded.includes(userType);
  };

  const getApprovalStatus = (user) => {
    if (!requiresApproval(user.user_type)) {
      return { status: 'auto-approved', color: '#10b981', text: 'Auto-Approved' };
    }
    // Use is_verified (boolean) as the primary source
    if (user.is_verified === true) {
      return { status: 'approved', color: '#10b981', text: 'Verified' };
    } else if (user.is_verified === false) {
      return { status: 'rejected', color: '#ef4444', text: 'Rejected' };
    } else {
      // is_verified is null or undefined = pending
      return { status: 'pending', color: '#f59e0b', text: 'Pending Verification' };
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      const transformedUsers = data.map(user => ({
        ...user,
        full_name: user.full_name || user.name || 'Unknown User',
        verification_documents: user.verification_documents || user.documents || user.id_documents || []
      }));
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useMemo for computed values
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || user.user_type === filterType;
      const approvalStatus = getApprovalStatus(user);
      const matchesStatus = filterStatus === 'all' || approvalStatus.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [users, searchTerm, filterType, filterStatus]);

  const stats = useMemo(() => {
    return {
      pending: users.filter(u => getApprovalStatus(u).status === 'pending' && requiresApproval(u.user_type)).length,
      verified: users.filter(u => getApprovalStatus(u).status === 'approved').length,
      rejected: users.filter(u => getApprovalStatus(u).status === 'rejected').length,
      suspended: users.filter(u => getApprovalStatus(u).status === 'suspended').length
    };
  }, [users]);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleApprove = async (userId) => {
    if (!userId) {
      alert('Error: User ID is missing. Cannot approve user.');
      console.error('handleApprove called without userId');
      return;
    }
    
    try {
      setSaving(true);
      console.log('Approving user:', userId);
      // Set is_verified to true (don't pass verification_status since it's not used)
      const result = await adminService.updateUserVerification(userId, true);
      console.log('Approval result:', result);
      await loadUsers();
      setShowModal(false);
      alert('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      const errorMessage = error?.message || error?.error?.message || error?.code || 'Unknown error';
      console.error('Full error details:', error);
      alert(`Failed to approve user: ${errorMessage}. Please check the console for details.`);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (userId, reason = null) => {
    if (!userId) {
      alert('Error: User ID is missing. Cannot reject user.');
      return;
    }
    
    try {
      setSaving(true);
      console.log('Rejecting user:', userId);
      // Set is_verified to false
      await adminService.updateUserVerification(userId, false);
      await loadUsers();
      setShowModal(false);
      alert('User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      const errorMessage = error?.message || error?.error?.message || error?.code || 'Unknown error';
      alert(`Failed to reject user: ${errorMessage}. Please check the console for details.`);
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (userId) => {
    if (!userId) {
      alert('Error: User ID is missing. Cannot suspend user.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to suspend this user? They will not be able to access the system.')) {
      return;
    }
    try {
      setSaving(true);
      console.log('Suspending user:', userId);
      // Set is_verified to false for suspension
      await adminService.updateUserVerification(userId, false);
      await loadUsers();
      setShowModal(false);
      alert('User has been suspended.');
    } catch (error) {
      console.error('Error suspending user:', error);
      const errorMessage = error?.message || error?.error?.message || error?.code || 'Unknown error';
      alert(`Failed to suspend user: ${errorMessage}. Please check the console for details.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="verification-management">
      <div className="verification-header">
        <div>
          <h2>User Verification Management</h2>
          <p>Review and manage user verification requests</p>
        </div>
        <button className="btn-refresh" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      <div className="verification-stats">
        <div className="stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <Clock size={24} style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }} />
          <div>
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <CheckCircle size={24} style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }} />
          <div>
            <h3>{stats.verified}</h3>
            <p>Verified</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <XCircle size={24} style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }} />
          <div>
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <AlertTriangle size={24} style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }} />
          <div>
            <h3>{stats.suspended}</h3>
            <p>Suspended</p>
          </div>
        </div>
      </div>

      <div className="verification-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All User Types</option>
          <option value="verified_resident">Resident</option>
          <option value="business_owner">Business</option>
          <option value="government_official">Government</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="verification-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={48} />
            <h3>No users found</h3>
            <p>No users match your current filters</p>
          </div>
        ) : (
          filteredUsers.map(user => {
            const status = getApprovalStatus(user);
            const hasDocs = (user.verification_documents?.length || 0) > 0;
            return (
              <div key={user.id} className="verification-item card" onClick={() => handleViewUser(user)}>
                <div className="verification-item-single-line">
                  <div className="verification-item-left">
                    <div className="user-avatar-small">
                      <User size={18} />
                    </div>
                    <div className="user-info-inline">
                      <h4>{user.full_name}</h4>
                      <span className="user-email-inline">{user.email}</span>
                    </div>
                    {hasDocs && (
                      <span className="doc-indicator" title="Has documents">
                        <FileText size={14} />
                      </span>
                    )}
                  </div>
                  <div className="verification-item-middle">
                    <span className="user-type-badge">{user.user_type}</span>
                    <span className="status-badge" style={{ backgroundColor: status.color }}>
                      {status.text}
                    </span>
                  </div>
                  <div className="verification-item-actions" onClick={(e) => e.stopPropagation()}>
                    {status.status === 'pending' && requiresApproval(user.user_type) && (
                      <>
                        <button 
                          className="btn-approve" 
                          onClick={() => {
                            if (!user.id) {
                              console.error('User ID is missing:', user);
                              alert('Error: User ID is missing. Cannot approve.');
                              return;
                            }
                            handleApprove(user.id);
                          }} 
                          disabled={saving}
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button className="btn-reject" onClick={() => handleReject(user.id)} disabled={saving}>
                          <XCircle size={14} />
                          Reject
                        </button>
                      </>
                    )}
                    {status.status === 'approved' && (
                      <button 
                        className="btn-suspend" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSuspend(user.id);
                        }} 
                        disabled={saving}
                        title="Suspend verified user"
                      >
                        <AlertTriangle size={14} />
                        Suspend
                      </button>
                    )}
                    <button className="btn-view" onClick={() => handleViewUser(user)}>
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <UserDetailModal
        user={selectedUser}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={saving}
      />
    </div>
  );
};

export default VerificationManagement;

