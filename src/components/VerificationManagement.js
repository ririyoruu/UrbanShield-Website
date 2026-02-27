import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  RefreshCw,
  User,
  Shield,
  Crown
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

  useEffect(() => { loadUsers(); }, []);

  const requiresApproval = (userType) => !['admin'].includes(userType);

  const getApprovalStatus = (user) => {
    if (!requiresApproval(user.user_type))
      return { status: 'auto-approved', color: '#10b981', text: 'Auto-Approved' };
    if (user.verification_status === 'verified' || user.is_verified === true)
      return { status: 'approved', color: '#10b981', text: 'Verified' };
    if (user.verification_status === 'rejected' || user.is_verified === false)
      return { status: 'rejected', color: '#ef4444', text: 'Rejected' };
    if (user.verification_status === 'suspended')
      return { status: 'suspended', color: '#a855f7', text: 'Suspended' };
    return { status: 'pending', color: '#f59e0b', text: 'Pending' };
  };

  const getRoleLabel = (type) => {
    if (type === 'admin' || type === 'superadmin') return 'Admin';
    if (type === 'government_responder' || type === 'government_official') return 'Gov / Responder';
    return 'Resident';
  };

  const getRoleIcon = (type) => {
    if (type === 'admin' || type === 'superadmin') return <Crown size={11} />;
    if (type === 'government_responder' || type === 'government_official') return <Shield size={11} />;
    return <User size={11} />;
  };

  const getRoleColor = (type) => {
    if (type === 'admin' || type === 'superadmin') return '#dc2626';
    if (type === 'government_responder' || type === 'government_official') return '#8b5cf6';
    return '#10b981';
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      const transformed = data.map(u => ({
        ...u,
        full_name: u.full_name || u.name || 'Unknown User',
        verification_documents: u.verification_documents || u.documents || u.id_documents || []
      }));
      setUsers(transformed);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all'
        || user.user_type === filterType
        || (filterType === 'government_responder' && user.user_type === 'government_official')
        || (filterType === 'resident' && user.user_type === 'verified_resident');
      const status = getApprovalStatus(user);
      const matchesStatus = filterStatus === 'all' || status.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [users, searchTerm, filterType, filterStatus]);

  const stats = useMemo(() => ({
    pending: users.filter(u => getApprovalStatus(u).status === 'pending').length,
    verified: users.filter(u => getApprovalStatus(u).status === 'approved').length,
    rejected: users.filter(u => getApprovalStatus(u).status === 'rejected').length,
    suspended: users.filter(u => getApprovalStatus(u).status === 'suspended').length
  }), [users]);

  const handleViewUser = (user) => { setSelectedUser(user); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setSelectedUser(null); };

  const handleApprove = async (userId) => {
    try {
      setSaving(true);
      await adminService.updateUserVerification(userId, true, 'verified');
      await loadUsers();
      handleCloseModal();
    } catch (err) {
      console.error('Error verifying user:', err);
      alert(`Failed to verify user: ${err?.message || 'Unknown error'}`);
    } finally { setSaving(false); }
  };

  const handleReject = async (userId) => {
    try {
      setSaving(true);
      await adminService.updateUserVerification(userId, false, 'rejected');
      await loadUsers();
      handleCloseModal();
    } catch (err) {
      console.error('Error rejecting user:', err);
      alert(`Failed to reject user: ${err?.message || 'Unknown error'}`);
    } finally { setSaving(false); }
  };

  const handleSuspend = async (userId) => {
    try {
      setSaving(true);
      await adminService.updateUserVerification(userId, false, 'suspended');
      await loadUsers();
      handleCloseModal();
    } catch (err) {
      console.error('Error suspending user:', err);
      alert(`Failed to suspend user: ${err?.message || 'Unknown error'}`);
    } finally { setSaving(false); }
  };

  const handleRestore = async (userId) => {
    try {
      setSaving(true);
      await adminService.updateUserVerification(userId, true, 'verified');
      await loadUsers();
      handleCloseModal();
    } catch (err) {
      console.error('Error restoring user:', err);
      alert(`Failed to restore user: ${err?.message || 'Unknown error'}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="verification-management">

      {/* ── Stat chips ── */}
      <div className="verif-stat-row">
        {[
          { label: 'Pending', count: stats.pending, color: '#f59e0b', filter: 'pending', icon: <Clock size={13} /> },
          { label: 'Verified', count: stats.verified, color: '#10b981', filter: 'approved', icon: <CheckCircle size={13} /> },
          { label: 'Rejected', count: stats.rejected, color: '#ef4444', filter: 'rejected', icon: <XCircle size={13} /> },
          { label: 'Suspended', count: stats.suspended, color: '#a855f7', filter: 'suspended', icon: <AlertTriangle size={13} /> },
        ].map(({ label, count, color, filter, icon }) => (
          <button
            key={filter}
            className={`verif-stat-chip ${filterStatus === filter ? 'active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === filter ? 'all' : filter)}
            style={filterStatus === filter ? { borderColor: color, color } : {}}
          >
            <span className="verif-stat-icon" style={{ color }}>{icon}</span>
            <span className="verif-stat-num" style={filterStatus === filter ? { color } : {}}>{count}</span>
            <span className="verif-stat-label">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="verif-filters">
        <div className="verif-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="government_responder">Gov / Responders</option>
          <option value="resident">Residents</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* ── List ── */}
      <div className="verif-list">
        <div className="verif-list-header">
          <div>User</div>
          <div>Role &amp; Status</div>
          <div>Documents</div>
        </div>

        {loading ? (
          <div className="verif-empty"><RefreshCw size={28} className="spinning" /><p>Loading...</p></div>
        ) : filteredUsers.length === 0 ? (
          <div className="verif-empty"><UserCheck size={36} /><p>No users match your filters</p></div>
        ) : (
          filteredUsers.map(user => {
            const status = getApprovalStatus(user);
            const roleColor = getRoleColor(user.user_type);
            const hasDocs = (user.verification_documents?.length || 0) > 0;
            return (
              <div key={user.id} className="verif-row" onClick={() => handleViewUser(user)}>
                {/* User */}
                <div className="verif-cell verif-user">
                  <div className="verif-avatar" style={{ background: roleColor + '18', color: roleColor }}>
                    {getRoleIcon(user.user_type)}
                  </div>
                  <div>
                    <div className="verif-name">{user.full_name}</div>
                    <div className="verif-email">{user.email}</div>
                  </div>
                </div>

                {/* Role & Status */}
                <div className="verif-cell">
                  <div className="verif-badges">
                    <span className="verif-role-badge" style={{ color: roleColor, background: roleColor + '15', borderColor: roleColor + '30' }}>
                      {getRoleIcon(user.user_type)} {getRoleLabel(user.user_type)}
                    </span>
                    <span className="verif-status-badge" style={{ color: status.color, background: status.color + '15', borderColor: status.color + '30' }}>
                      {status.text}
                    </span>
                  </div>
                </div>

                {/* Documents */}
                <div className="verif-cell">
                  {hasDocs
                    ? <span className="verif-doc-pill"><FileText size={11} /> {user.verification_documents.length} doc{user.verification_documents.length > 1 ? 's' : ''}</span>
                    : <span className="verif-no-doc">None</span>
                  }
                </div>
              </div>
            );
          })
        )}
      </div>

      <UserDetailModal
        user={selectedUser}
        isOpen={showModal}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
        onSuspend={handleSuspend}
        onRestore={handleRestore}
        loading={saving}
      />
    </div>
  );
};

export default VerificationManagement;
