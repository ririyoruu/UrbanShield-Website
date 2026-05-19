import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserPlus,
  Trash2,
  Power,
  Search,
  Crown,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  User,
  Shield,
  X,
  Phone,
  Briefcase,
  ChevronRight,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Key,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '../config/supabase';
import superAdminService from '../services/superAdminService';
import ModernConfirmationModal from './ModernConfirmationModal';
import './AdminManagement.css';

const AdminManagement = ({ initialTab = 'all', isSuperAdmin }) => {
  /* ── State ── */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addFormData, setAddFormData] = useState({
    email: '', password: '', full_name: '', username: '', phone: '', department: 'BFP', user_type: 'super_admin',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [detailFormData, setDetailFormData] = useState({
    full_name: '', username: '', phone: '', department: '', user_type: '',
  });

  const [selectedStaffIds, setSelectedStaffIds] = useState(new Set());

  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '', onConfirm: null, undoAction: null });
  const [lastDemoted, setLastDemoted] = useState(null);
  const [resetModal, setResetModal] = useState({ isOpen: false, email: '', userId: null, generatedPass: null });
  const [addUsernameError, setAddUsernameError] = useState('');
  const [editUsernameError, setEditUsernameError] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  /* ── Helpers ── */
  const isActive = (u) => u && u.is_active !== false;

  const showFlash = (message, type = 'success', title = '', undoAction = null) => {
    setModal({
      show: true,
      type,
      title: title || (type === 'success' ? 'Completed' : type === 'error' ? 'Error' : 'Notification'),
      message,
      onConfirm: null,
      undoAction
    });
  };

  const formatDisplayId = useCallback((index, total, userType) => {
    const prefix = userType === 'responder' ? 'RSP' : userType === 'super_admin' ? 'SUP' : 'ADM';
    const padded = (total - index).toString().padStart(4, '0');
    return `${prefix}-${padded}`;
  }, []);

  /* ── Database Ops ── */
  const loadStaff = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const { data, error: dbErr } = await supabase
        .from('profiles')
        .select('*')
        .in('user_type', ['admin', 'super_admin', 'responder'])
        .order('created_at', { ascending: false });
      if (dbErr) throw dbErr;
      setUsers(data || []);
    } catch (err) {
      showFlash('Failed to load staff list', 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const selectedStaff = useMemo(() => users.find(u => u.id === selectedStaffId) || null, [users, selectedStaffId]);

  /* ── Filtering ── */
  const stats = useMemo(() => ({
    all: users.length,
    super_admins: users.filter(u => u.user_type === 'super_admin').length,
    admins: users.filter(u => u.user_type === 'admin').length,
    responders: users.filter(u => u.user_type === 'responder').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (activeTab === 'super_admins') result = result.filter(u => u.user_type === 'super_admin');
    else if (activeTab === 'admins') result = result.filter(u => u.user_type === 'admin');
    else if (activeTab === 'responders') {
      result = result.filter(u => u.user_type === 'responder');
      if (filterDepartment !== 'all') {
        result = result.filter(u => (u.department || '').toLowerCase() === filterDepartment.toLowerCase());
      }
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(u =>
        (u.full_name || '').toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s) ||
        (u.username || '').toLowerCase().includes(s)
      );
    }

    // Sort result
    result.sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';

      if (sortConfig.key === 'created_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, activeTab, searchTerm, sortConfig, filterDepartment]);

  /* ── Actions ── */
  const handleCloseDetail = () => {
    setShowDetailDrawer(false);
    setSelectedStaffId(null);
    setIsEditMode(false);
  };

  const handleBulkDelete = () => {
    if (!selectedStaffIds.size) return;
    if (!isSuperAdmin) return;
    const count = selectedStaffIds.size;

    setModal({
      show: true,
      type: 'confirm',
      title: isResponderMode ? 'Remove Responders?' : 'Remove Admins?',
      message: `Are you sure you want to permanently remove ${count} selected ${isResponderMode ? 'responders' : 'admins'}? This action cannot be undone.`,
      onConfirm: executeBulkDelete
    });
  };

  const executeBulkDelete = async () => {
    const count = selectedStaffIds.size;
    const oldUsers = [...users];
    const staffIds = Array.from(selectedStaffIds);

    setModal({ show: false });
    setUsers(prev => prev.filter(u => !selectedStaffIds.has(u.id)));
    setSelectedStaffIds(new Set());

    try {
      setSaving(true);
      const { adminService } = require('../config/supabase');
      await adminService.deleteUsers(staffIds);
      showFlash(`${count} ${isResponderMode ? 'responder(s)' : 'admin(s)'} removed successfully`);
      await loadStaff(true);
    } catch (error) {
      console.error('Bulk delete error:', error);
      showFlash(`Failed to remove: ${error.message || 'Check permissions'}`, 'error');
      setUsers(oldUsers);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDetail = (user) => {
    setSelectedStaffId(user.id);
    setDetailFormData({
      full_name: user.full_name || '',
      username: user.username || '',
      phone: user.phone || '',
      department: user.department || 'BFP',
      user_type: user.user_type || 'super_admin',
    });
    setIsEditMode(false);
    setShowDetailDrawer(true);
  };

  const handleToggleActive = (e, user) => {
    e?.stopPropagation();
    const currentlyActive = isActive(user);
    const nextStatus = !currentlyActive;

    setModal({
      show: true,
      type: 'confirm',
      title: nextStatus ? 'Reactivate Account?' : 'Deactivate Account?',
      message: `Are you sure you want to ${nextStatus ? 'reactivate' : 'deactivate'} ${user.full_name || 'this account'}?`,
      onConfirm: () => executeToggleActive(user, nextStatus)
    });
  };

  const executeToggleActive = async (user, nextStatus) => {
    setModal({ show: false });
    setSaving(true);
    const old = [...users];
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: nextStatus } : u));

    try {
      await superAdminService.toggleStaffStatus(user.id, nextStatus);
      await loadStaff(true);
      showFlash(`Account ${nextStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      setUsers(old);
      showFlash('Action failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedStaff) return;

    // Phone validation: optional, but if entered must be 11 digits
    const digitsOnly = detailFormData.phone.replace(/\D/g, '');
    if (detailFormData.phone && digitsOnly.length !== 11) {
      showFlash('Phone number must be exactly 11 digits (e.g., 09123456789)', 'error');
      return;
    }

    if (/\s/.test(detailFormData.username)) {
      showFlash('Spaces are not allowed in usernames', 'error');
      return;
    }

    setSaving(true);
    try {
      await superAdminService.updateStaff(selectedStaff.id, {
        ...detailFormData,
        phone: digitsOnly
      });
      showFlash(`${isResponderMode ? 'Responder' : 'Admin'} details updated`);
      await loadStaff(true);
      setIsEditMode(false);
      setEditUsernameError('');
    } catch (err) {
      showFlash('Update failed', 'error');
    } finally { setSaving(false); }
  };

  const handleRemoveStaff = (e, user) => {
    e?.stopPropagation();
    const isDemoteToAdmin = user.user_type === 'super_admin';
    const title = isDemoteToAdmin ? 'Demote Super Admin?' : 'Remove from Staff?';
    const message = isDemoteToAdmin
      ? `Are you sure you want to demote ${user.full_name} to regular Admin?`
      : `Are you sure you want to remove ${user.full_name} from staff? they will be demoted to a resident.`;

    setModal({
      show: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => executeRemoveStaff(user, isDemoteToAdmin)
    });
  };

  const executeRemoveStaff = async (user, isDemoteToAdmin) => {
    setModal({ show: false });
    const previousRole = user.user_type;
    setSaving(true);

    if (isDemoteToAdmin) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, user_type: 'admin' } : u));
    } else {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    }

    try {
      if (isDemoteToAdmin) {
        await superAdminService.updateStaffRole(user.id, 'admin');
      } else {
        await superAdminService.demoteToResident(user.id);
      }

      if (selectedStaffId === user.id && !isDemoteToAdmin) setShowDetailDrawer(false);

      const handleUndo = async () => {
        try {
          setSaving(true);
          await superAdminService.updateStaffRole(user.id, previousRole);
          showFlash(`${user.full_name} role restored to ${previousRole === 'super_admin' ? 'Super Admin' : 'Responder'}`);
          await loadStaff(true);
        } catch (err) {
          showFlash('Undo failed', 'error');
        } finally {
          setSaving(false);
        }
      };

      const successMsg = isDemoteToAdmin ? `${user.full_name} demoted to Admin` : `${user.full_name} demoted to Resident`;
      showFlash(successMsg, 'success', 'Staff Demoted', handleUndo);
      await loadStaff(true);
    } catch (err) {
      showFlash('Action failed', 'error');
      await loadStaff();
    } finally { setSaving(false); }
  };

  const handlePromoteToSuperAdmin = (e, user) => {
    e?.stopPropagation();
    setModal({
      show: true,
      type: 'confirm',
      title: 'Promote to Super Admin?',
      message: `Are you sure you want to promote ${user.full_name} to Super Admin? This will give them full system control.`,
      onConfirm: () => executePromoteToSuperAdmin(user)
    });
  };

  const executePromoteToSuperAdmin = async (user) => {
    setModal({ show: false });
    setSaving(true);
    try {
      await superAdminService.updateStaffRole(user.id, 'super_admin');
      showFlash(`${user.full_name} promoted to Super Admin`);
      await loadStaff(true);
      setShowDetailDrawer(false);
    } catch (err) {
      showFlash('Promotion failed', 'error');
    } finally { setSaving(false); }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();

    // Email domain validation
    const emailStr = addFormData.email.toLowerCase().trim();
    const domain = emailStr.split('@')[1];
    const popularDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'icloud.com', 'msn.com', 'live.com', 'me.com',
      'aol.com', 'ymail.com', 'rocketmail.com', 'protonmail.com',
      'proton.me', 'zoho.com', 'gmx.com', 'mail.com'
    ];

    if (!domain || !popularDomains.includes(domain)) {
      showFlash(
        `Please use a legitimate email provider (e.g., Gmail, Yahoo, Outlook). '${domain || 'unknown'}' is not recognized.`,
        'error',
        'Invalid Email Domain'
      );
      return;
    }

    // Phone validation: can be empty if optional, but if provided must be 11 digits
    const digitsOnly = addFormData.phone.replace(/\D/g, '');
    if (addFormData.phone && digitsOnly.length !== 11) {
      showFlash('Phone number must be exactly 11 digits (e.g., 09123456789)', 'error');
      return;
    }

    if (/\s/.test(addFormData.username)) {
      showFlash('Spaces are not allowed in usernames', 'error');
      return;
    }

    setSaving(true);
    try {
      await superAdminService.createStaff({
        ...addFormData,
        email: addFormData.email.trim(),
        phone: digitsOnly
      });
      setShowAddDrawer(false);
      setAddFormData({ email: '', password: '', full_name: '', username: '', phone: '', department: 'BFP', user_type: 'super_admin' });
      setAddUsernameError('');
      showFlash(`${isResponderMode ? 'Responder' : 'Admin'} added`);
      await loadStaff();
    } catch (err) {
      showFlash(err.message || 'Failed to add staff', 'error');
    } finally { setSaving(false); }
  };

  const generateAutoPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAddFormData(prev => ({ ...prev, password }));
    setShowPassword(true);
    showFlash("Generated a secure password for you.", "success", "Password Generated");
  };

  const handleResetPassword = async (user) => {
    if (!user || !user.email) return;

    // Open confirmation modal first
    setResetModal({ isOpen: true, email: user.email, userId: user.id, generatedPass: null });
  };

  const confirmResetPassword = async () => {
    const { email, userId } = resetModal;

    // Generate secure password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setSaving(true);
    try {
      await superAdminService.resetUserPassword(email, generated, userId);

      // Update modal to show the generated password
      setResetModal(prev => ({ ...prev, generatedPass: generated }));

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(generated);
      } catch (err) { }

      showFlash(`Success: Password reset and copied to clipboard.`, 'success', 'Password Reset');
    } catch (err) {
      console.error('Password reset failed:', err);
      showFlash(err.message || 'Failed to reset password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const [copied, setCopied] = useState(false);
  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showFlash("Failed to copy password", "error");
    }
  };

  /* ── Rendering ── */
  const getInitials = (n) => (n || '?').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

  // Status Filter state matching UserManagement
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredByStatus = useMemo(() => {
    let result = filteredUsers;
    if (filterStatus === 'active') result = result.filter(u => isActive(u));
    if (filterStatus === 'deactivated') result = result.filter(u => !isActive(u));
    return result;
  }, [filteredUsers, filterStatus]);

  /* ── Selection ── */
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedStaffIds(new Set(filteredByStatus.map(u => u.id)));
    else setSelectedStaffIds(new Set());
  };

  const handleSelectStaff = (e, userId) => {
    e.stopPropagation();
    const next = new Set(selectedStaffIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedStaffIds(next);
  };

  const isAllSelected = filteredByStatus.length > 0 && selectedStaffIds.size === filteredByStatus.length;
  const isIndeterminate = selectedStaffIds.size > 0 && selectedStaffIds.size < filteredByStatus.length;

  const internalStats = useMemo(() => ({
    all: filteredUsers.length,
    active: filteredUsers.filter(isActive).length,
    deactivated: filteredUsers.filter(u => !isActive(u)).length
  }), [filteredUsers]);

  const isResponderMode = initialTab === 'responders';
  const isSuperAdminMode = initialTab === 'super_admins';
  const isAdminMode = initialTab === 'admins';

  return (
    <div className="zenith-table-moderation admin-management-module">
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
                  Keep them
                </button>
                <button className="zenith-modal-btn confirm-delete" onClick={modal.onConfirm}>
                  Proceed
                </button>
              </div>
            ) : (
              <div className="zenith-modal-actions" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                {modal.undoAction && (
                  <button className="zenith-modal-btn undo-btn" onClick={() => {
                    modal.undoAction();
                    setModal({ ...modal, show: false });
                  }}>
                    Undo Action
                  </button>
                )}
                <button className="status-close-btn" onClick={() => setModal({ show: false })}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="zenith-tabs">
        <button className={`zenith-tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          All <span>{internalStats.all}</span>
        </button>
        <button className={`zenith-tab ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => setFilterStatus('active')}>
          Active <span>{internalStats.active}</span>
        </button>
        <button className={`zenith-tab ${filterStatus === 'deactivated' ? 'active' : ''}`} onClick={() => setFilterStatus('deactivated')}>
          Deactivated <span>{internalStats.deactivated}</span>
        </button>
      </div>

      {/* Bulk Action Bar — Super Admin Only */}
      {isSuperAdmin && selectedStaffIds.size > 0 && (
        <div className="zenith-selection-bar active">
          <div className="selection-info">
            <span className="selection-count">{selectedStaffIds.size}</span>
            <span className="selection-text">Personnel selected</span>
          </div>
          <div className="selection-actions">
            <button className="selection-btn cancel" onClick={() => setSelectedStaffIds(new Set())}>
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
            placeholder={`Search ${isResponderMode ? 'responder' : isAdminMode ? 'super admin' : 'staff'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="zenith-toolbar-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isResponderMode && (
            <select 
              className="zenith-toolbar-select"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              style={{ width: 'auto', minWidth: '220px' }}
            >
              <option value="all">All Departments</option>
              <option value="BFP">BFP (Fire Station)</option>
              <option value="PNP">PNP (Police Station)</option>
              <option value="MHO">MHO (Health Office)</option>
              <option value="Community Hospital">Community Hospital</option>
              <option value="MSWDO">MSWDO (Social Welfare)</option>
              <option value="TERSSU">TERSSU (Emergency Response)</option>
              <option value="Waterworks">Waterworks</option>
              <option value="Barangay Office">Barangay Office</option>
            </select>
          )}

          {(!isSuperAdminMode || isSuperAdmin) && (
            <button className="add-staff-btn-zenith" onClick={() => {
              setAddFormData({ ...addFormData, user_type: isResponderMode ? 'responder' : isAdminMode ? 'admin' : 'super_admin' });
              setShowAddDrawer(true);
            }}>
              <UserPlus size={18} />
              Add {isResponderMode ? 'Responder' : isAdminMode ? 'Admin' : 'Super Admin'}
            </button>
          )}
        </div>
      </div>

      <div className="zenith-table-container">
        {loading ? (
          <div className="zenith-loading-state">
            <div className="loader-dot spinning" />
            <p>Loading personnel list...</p>
          </div>
        ) : filteredByStatus.length === 0 ? (
          <div className="zenith-empty-state">
            <User size={48} />
            <h3>No {isResponderMode ? 'responders' : 'personnel'} found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="zenith-table-wrapper">
            <table className="zenith-data-table">
              <thead>
                <tr>
                  {isSuperAdmin && (
                    <th className="zenith-checkbox-cell">
                      <input
                        type="checkbox"
                        className="zenith-checkbox"
                        checked={isAllSelected}
                        ref={el => el && (el.indeterminate = isIndeterminate)}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th onClick={() => handleSort('created_at')} className="sortable-header" style={{ width: '80px' }}>
                    ID {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                  </th>
                  <th>PERSONNEL</th>
                  {isResponderMode ? (
                    <th>DEPARTMENT</th>
                  ) : (
                    <th>ROLE</th>
                  )}
                  <th>STATUS</th>
                  <th className="zenith-actions-cell" style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredByStatus.map((user) => {
                  const initials = getInitials(user.full_name);
                  const active = isActive(user);
                  return (
                    <tr key={user.id} onClick={() => handleOpenDetail(user)}>
                      {isSuperAdmin && (
                        <td className="zenith-checkbox-cell" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="zenith-checkbox"
                            checked={selectedStaffIds.has(user.id)}
                            onChange={e => handleSelectStaff(e, user.id)}
                          />
                        </td>
                      )}
                      <td className="zenith-order-cell">
                        {formatDisplayId(users.indexOf(user), users.length, user.user_type)}
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
                      {isResponderMode ? (
                        <td>{user.department || '—'}</td>
                      ) : (
                        <td>
                          <span className={`zenith-role-pill staff-role ${user.user_type}`}>
                            {user.user_type === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                      )}
                      <td>
                        <span className={`zenith-status-badge ${active ? 'status-verified' : 'status-suspended'}`}>
                          {active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="zenith-actions-cell" onClick={e => e.stopPropagation()}>
                        <button className="zenith-actions-btn" onClick={() => handleOpenDetail(user)}>
                          <ChevronRight size={16} />
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

      {/* ── Detail Drawer (Modal Style) ── */}
      {showDetailDrawer && selectedStaff && (
        <div className="zenith-modal-container">
          <div className="zenith-overlay blur" onClick={() => setShowDetailDrawer(false)} />
          <div className="zenith-drawer personnel-detail-drawer">
            <div className="drawer-header">
              <div className="staff-header-info">
                <div className="large-avatar">{getInitials(selectedStaff.full_name)}</div>
                <div className="text">
                  <h3>{selectedStaff.full_name}</h3>
                  <p>{selectedStaff.email}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowDetailDrawer(false)}><X size={22} /></button>
            </div>

            <div className="drawer-scrollable">
              <div className="status-subheader">
                <div className="status-item">
                  <span className={`status-dot ${isActive(selectedStaff) ? 'active' : 'inactive'}`}></span>
                  <span className="status-label">{isActive(selectedStaff) ? 'Active' : 'Suspended'}</span>
                </div>
                <span className="separator">•</span>
                <div className="role-item">
                  <Shield size={14} />
                  <span>
                    {selectedStaff.user_type === 'responder' ? 'Responder' :
                      selectedStaff.user_type === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
              </div>

              {!isActive(selectedStaff) && (
                <div className="alert-card-zenith warning">
                  <AlertCircle size={18} />
                  <p>This personnel account is currently suspended and restricted from access.</p>
                </div>
              )}

              <div className="drawer-section">
                <div className="admin-drawer-section-title">
                  {selectedStaff.user_type === 'responder' ? 'Responder Details' : 'Personnel Details'}
                </div>
                <div className="details-stack-zenith">
                  <div className="detail-field-row">
                    <label>Full Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={detailFormData.full_name}
                        onChange={e => setDetailFormData({ ...detailFormData, full_name: e.target.value })}
                      />
                    ) : (
                      <div className="value">{selectedStaff.full_name || '—'}</div>
                    )}
                  </div>
                  <div className="detail-field-row">
                    <label>Email Address</label>
                    <div className="value email muted">{selectedStaff.email || '—'}</div>
                  </div>
                  <div className="detail-field-row">
                    <label>Phone Number</label>
                    {isEditMode ? (
                      <input
                        type="tel"
                        maxLength={11}
                        value={detailFormData.phone}
                        onChange={e => setDetailFormData({ ...detailFormData, phone: e.target.value.replace(/\D/g, '') })}
                      />
                    ) : (
                      <div className="value">{selectedStaff.phone || 'Not provided'}</div>
                    )}
                  </div>
                  {selectedStaff.user_type === 'responder' ? (
                    <div className="detail-field-row">
                      <label>Department</label>
                      {isEditMode ? (
                        <select value={detailFormData.department} onChange={e => setDetailFormData({ ...detailFormData, department: e.target.value })}>
                          <option value="BFP">BFP (Fire Station)</option>
                          <option value="PNP">PNP (Police Station)</option>
                          <option value="MHO">MHO (Health Office)</option>
                          <option value="Community Hospital">Community Hospital</option>
                          <option value="MSWDO">MSWDO (Social Welfare)</option>
                          <option value="TERSSU">TERSSU (Emergency Response)</option>
                          <option value="Waterworks">Waterworks</option>
                          <option value="Barangay Office">Barangay Office</option>
                        </select>
                      ) : (
                        <div className="value">{selectedStaff.department || '—'}</div>
                      )}
                    </div>
                  ) : (
                    <div className="detail-field-row">
                      <label>Role</label>
                      {isEditMode ? (
                        <select value={detailFormData.user_type} onChange={e => setDetailFormData({ ...detailFormData, user_type: e.target.value })}>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      ) : (
                        <div className="value">{selectedStaff.user_type === 'super_admin' ? 'Super Admin' : 'Admin'}</div>
                      )}
                    </div>
                  )}
                  <div className="detail-field-row">
                    <label>Username</label>
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          className={editUsernameError ? 'error-border' : ''}
                          value={detailFormData.username}
                          onChange={e => {
                            const val = e.target.value;
                            setDetailFormData({ ...detailFormData, username: val });
                            if (/\s/.test(val)) {
                              setEditUsernameError('Spaces are not allowed in usernames');
                            } else {
                              setEditUsernameError('');
                            }
                          }}
                        />
                        {editUsernameError && (
                          <div className="validation-error">
                            <AlertTriangle size={14} /> {editUsernameError}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="value">@{selectedStaff.username || '—'}</div>
                    )}
                  </div>
                  <div className="detail-field-row">
                    <label>{selectedStaff.user_type === 'responder' ? 'Responder ID' : 'Super Admin ID'}</label>
                    <div className="value muted">{formatDisplayId(users.indexOf(selectedStaff), users.length, selectedStaff.user_type)}</div>
                  </div>
                </div>
              </div>

              {!isEditMode && (
                <div className="danger-zone-zenith">
                  <div className="danger-zone-title">Account Management</div>
                  <p>Manage this {selectedStaff.user_type === 'responder' ? 'responder' : 'personnel'}'s access to the UrbanShield platform.</p>
                  <div className="danger-zone-actions">
                    <button type="button" className={`status-btn-zenith ${isActive(selectedStaff) ? 'deactivate' : 'activate'}`} onClick={(e) => handleToggleActive(e, selectedStaff)}>
                      {isActive(selectedStaff) 
                        ? (selectedStaff.user_type === 'responder' ? 'Suspend Responder' : 'Suspend Personnel') 
                        : (selectedStaff.user_type === 'responder' ? 'Reactivate Responder' : 'Reactivate Personnel')}
                    </button>
                    {selectedStaff.user_type === 'super_admin' ? (
                      <button type="button" className="remove-btn-zenith" onClick={(e) => handleRemoveStaff(e, selectedStaff)}>
                        Demote to Admin
                      </button>
                    ) : selectedStaff.user_type === 'responder' ? (
                      <button type="button" className="remove-btn-zenith" onClick={(e) => handleRemoveStaff(e, selectedStaff)}>
                        Demote to Resident
                      </button>
                    ) : null}

                    {isSuperAdmin && (
                      <button type="button" className="reset-pass-btn-zenith" onClick={() => handleResetPassword(selectedStaff)}>
                        <Key size={16} /> Reset Password
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="drawer-footer">
              {isEditMode ? (
                <>
                  <button type="button" className="footer-btn secondary" onClick={() => setIsEditMode(false)}>Cancel</button>
                  <button type="button" className="footer-btn primary" onClick={handleSaveUpdate} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="footer-btn secondary" onClick={() => setShowDetailDrawer(false)}>Close</button>
                  <button type="button" className="footer-btn primary" onClick={() => setIsEditMode(true)}>Edit Information</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Staff Drawer ── */}
      {showAddDrawer && (
        <>
          <div className="zenith-overlay" onClick={() => setShowAddDrawer(false)} />
          <div className="zenith-drawer">
            <div className="drawer-header">
              <h3>Add {isResponderMode ? 'Responder' : isAdminMode ? 'Admin' : 'Super Admin'}</h3>
              <button className="close-btn" onClick={() => setShowAddDrawer(false)}><X size={22} /></button>
            </div>
            <form onSubmit={handleAddStaff} className="drawer-scrollable">
              {/* ... existing fields ... */}
              <div className="drawer-section">
                <div className="admin-drawer-section-title">Login Credentials</div>
                <div className="form-item"><label>Email</label><input type="email" required value={addFormData.email} onChange={e => setAddFormData({ ...addFormData, email: e.target.value })} /></div>
                <div className="form-item">
                  <label>Username</label>
                  <input
                    type="text"
                    required
                    className={addUsernameError ? 'error-border' : ''}
                    value={addFormData.username}
                    onChange={e => {
                      const val = e.target.value;
                      setAddFormData({ ...addFormData, username: val });
                      if (/\s/.test(val)) {
                        setAddUsernameError('Spaces are not allowed in usernames');
                      } else {
                        setAddUsernameError('');
                      }
                    }}
                  />
                  {addUsernameError && (
                    <div className="validation-error">
                      <AlertTriangle size={14} /> {addUsernameError}
                    </div>
                  )}
                </div>
                <div className="form-item">
                  <label>Password</label>
                  <div className="pass-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={addFormData.password}
                      onChange={e => setAddFormData({ ...addFormData, password: e.target.value })}
                      placeholder="Enter or generate password"
                    />
                    <div className="pass-actions">
                      <button
                        type="button"
                        title="Generate Password"
                        className="gen-pass-btn"
                        onClick={generateAutoPassword}
                      >
                        <Sparkles size={16} />
                      </button>
                      {addFormData.password && (
                        <button
                          type="button"
                          title="Copy Password"
                          className="copy-pass-btn"
                          onClick={() => copyToClipboard(addFormData.password)}
                        >
                          {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                        </button>
                      )}
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <div className="admin-drawer-section-title">{isResponderMode ? 'Responder Details' : 'Staff Details'}</div>
                <div className="form-item"><label>Full Name</label><input type="text" required value={addFormData.full_name} onChange={e => setAddFormData({ ...addFormData, full_name: e.target.value })} /></div>
                {!isResponderMode ? (
                  <div className="form-item">
                    <label>Role</label>
                    <select value={addFormData.user_type} onChange={e => setAddFormData({ ...addFormData, user_type: e.target.value })}>
                      {isAdminMode ? (
                        <option value="admin">Admin</option>
                      ) : (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="form-item">
                    <label>Department</label>
                    <select value={addFormData.department} onChange={e => setAddFormData({ ...addFormData, department: e.target.value })} required>
                      <option value="BFP">BFP (Fire Station)</option>
                      <option value="PNP">PNP (Police Station)</option>
                      <option value="MHO">MHO (Health Office)</option>
                      <option value="Community Hospital">Community Hospital</option>
                      <option value="MSWDO">MSWDO (Social Welfare)</option>
                      <option value="TERSSU">TERSSU (Emergency Response)</option>
                      <option value="Waterworks">Waterworks</option>
                      <option value="Barangay Office">Barangay Office</option>
                    </select>
                  </div>
                )}
                <div className="form-item">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 09123456789"
                    value={addFormData.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setAddFormData({ ...addFormData, phone: val });
                    }}
                  />
                </div>
              </div>
              <div className="drawer-footer">
                <button type="button" className="footer-btn secondary" onClick={() => setShowAddDrawer(false)}>Cancel</button>
                <button type="submit" className="footer-btn primary" disabled={saving}>
                  Add {isResponderMode ? 'Responder' : isAdminMode ? 'Admin' : 'Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      {/* Modern Confirmation Modal for Resets */}
      <ModernConfirmationModal
        isOpen={resetModal.isOpen}
        onClose={() => setResetModal({ ...resetModal, isOpen: false })}
        onConfirm={confirmResetPassword}
        title="Reset Password"
        message={`Are you sure you want to reset the password for ${resetModal.email}? This action cannot be undone.`}
        confirmLabel={saving ? "Resetting..." : "Reset Now"}
        type="warning"
        generatedPassword={resetModal.generatedPass}
        onCopy={(txt) => {
          copyToClipboard(txt);
          showFlash("Password copied to clipboard!", "success");
        }}
      />
    </div>
  );
};

export default AdminManagement;
