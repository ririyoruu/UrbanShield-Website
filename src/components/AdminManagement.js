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
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../config/supabase';
import superAdminService from '../services/superAdminService';
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
    email: '', password: '', full_name: '', username: '', phone: '', department: '', user_type: 'admin',
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
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '', onConfirm: null });

  /* ── Helpers ── */
  const isActive = (u) => u && u.is_active !== false;

  const showFlash = (message, type = 'success', title = '') => {
    setModal({
      show: true,
      type,
      title: title || (type === 'success' ? 'Completed' : type === 'error' ? 'Error' : 'Notification'),
      message,
      onConfirm: null
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
    else if (activeTab === 'admins') result = result.filter(u => u.user_type === 'admin' || u.user_type === 'super_admin');
    else if (activeTab === 'responders') result = result.filter(u => u.user_type === 'responder');

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(u =>
        (u.full_name || '').toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [users, activeTab, searchTerm]);

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
      department: user.department || '',
      user_type: user.user_type || 'admin',
    });
    setIsEditMode(false);
    setShowDetailDrawer(true);
  };

  const handleToggleActive = async (e, user) => {
    e?.stopPropagation();
    const currentlyActive = isActive(user);
    const nextStatus = !currentlyActive;
    if (!window.confirm(`${currentlyActive ? 'Deactivate' : 'Reactivate'} ${user.full_name || 'account'}?`)) return;

    setSaving(true);
    // Optimistic
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

    setSaving(true);
    try {
      await superAdminService.updateStaff(selectedStaff.id, {
        ...detailFormData,
        phone: digitsOnly
      });
      showFlash(`${isResponderMode ? 'Responder' : 'Admin'} details updated`);
      await loadStaff(true);
      setIsEditMode(false);
    } catch (err) {
      showFlash('Update failed', 'error');
    } finally { setSaving(false); }
  };

  const handleRemoveStaff = async (e, user) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove ${user.full_name} from staff? they will be demoted to a resident.`)) return;
    setSaving(true);
    setUsers(prev => prev.filter(u => u.id !== user.id)); // Optimistic
    try {
      const { error } = await supabase.from('profiles').update({
        is_active: false,
        verification_status: 'suspended'
      }).eq('id', user.id);
      if (error) throw error;
      if (selectedStaffId === user.id) setShowDetailDrawer(false);
      showFlash(`${isResponderMode ? 'Responder' : 'Admin'} removed`);
      await loadStaff(true);
    } catch (err) {
      showFlash('Removal failed', 'error');
      await loadStaff();
    } finally { setSaving(false); }
  };

  const handlePromoteToSuperAdmin = async (e, user) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to promote ${user.full_name} to Super Admin? This will give them full system control.`)) return;
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

    // Phone validation: can be empty if optional, but if provided must be 11 digits
    const digitsOnly = addFormData.phone.replace(/\D/g, '');
    if (addFormData.phone && digitsOnly.length !== 11) {
      showFlash('Phone number must be exactly 11 digits (e.g., 09123456789)', 'error');
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
      setAddFormData({ email: '', password: '', full_name: '', username: '', phone: '', department: '', user_type: 'admin' });
      showFlash(`${isResponderMode ? 'Responder' : 'Admin'} added`);
      await loadStaff();
    } catch (err) {
      showFlash(err.message || 'Failed to add staff', 'error');
    } finally { setSaving(false); }
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
                  Cancel
                </button>
                <button className="zenith-modal-btn confirm-delete" onClick={modal.onConfirm}>
                  Proceed
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
            placeholder={`Search ${isResponderMode ? 'responder' : isAdminMode ? 'admin' : 'staff'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="zenith-toolbar-actions">
          {(!isAdminMode || isSuperAdmin) && (
            <button className="add-staff-btn-zenith" onClick={() => {
              setAddFormData({ ...addFormData, user_type: isResponderMode ? 'responder' : 'admin' });
              setShowAddDrawer(true);
            }}>
              <UserPlus size={18} />
              Add {isResponderMode ? 'Responder' : 'Admin'}
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
                  <th>ID</th>
                  <th>PERSONNEL</th>
                  {isResponderMode ? <th>DEPARTMENT</th> : <th>ROLE</th>}
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
                          <option value="PNP">PNP</option>
                          <option value="BFP">BFP</option>
                          <option value="MDRRMO">MDRRMO</option>
                          <option value="RHU">RHU</option>
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
                      <input
                        type="text"
                        value={detailFormData.username}
                        onChange={e => setDetailFormData({ ...detailFormData, username: e.target.value })}
                      />
                    ) : (
                      <div className="value">@{selectedStaff.username || '—'}</div>
                    )}
                  </div>
                  <div className="detail-field-row">
                    <label>Admin ID</label>
                    <div className="value muted">{formatDisplayId(users.indexOf(selectedStaff), users.length, selectedStaff.user_type)}</div>
                  </div>
                </div>
              </div>

              {!isEditMode && (
                <div className="danger-zone-zenith">
                  <div className="danger-zone-title">Account Management</div>
                  <p>Manage this personnel's access to the UrbanShield platform.</p>
                  <div className="danger-zone-actions">
                    {isSuperAdmin && selectedStaff.user_type === 'admin' && (
                      <button type="button" className="status-btn-zenith activate" style={{ background: 'var(--primary)', marginBottom: '0.5rem' }} onClick={(e) => handlePromoteToSuperAdmin(e, selectedStaff)}>
                        <Crown size={16} /> Promote to Super Admin
                      </button>
                    )}
                    <button type="button" className={`status-btn-zenith ${isActive(selectedStaff) ? 'deactivate' : 'activate'}`} onClick={(e) => handleToggleActive(e, selectedStaff)}>
                      {isActive(selectedStaff) ? 'Suspend Personnel' : 'Reactivate Personnel'}
                    </button>
                    <button type="button" className="remove-btn-zenith" onClick={(e) => handleRemoveStaff(e, selectedStaff)}>
                      Demote to Resident
                    </button>
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
              <h3>Add {isResponderMode ? 'Responder' : isAdminMode ? 'Admin' : 'Staff Member'}</h3>
              <button className="close-btn" onClick={() => setShowAddDrawer(false)}><X size={22} /></button>
            </div>
            <form onSubmit={handleAddStaff} className="drawer-scrollable">
              {/* ... existing fields ... */}
              <div className="drawer-section">
                <div className="section-title" style={{ color: '#000000', fontWeight: '900', textTransform: 'uppercase' }}>Login Credentials</div>
                <div className="form-item"><label>Email</label><input type="email" required value={addFormData.email} onChange={e => setAddFormData({ ...addFormData, email: e.target.value })} /></div>
                <div className="form-item"><label>Username</label><input type="text" required value={addFormData.username} onChange={e => setAddFormData({ ...addFormData, username: e.target.value })} /></div>
                <div className="form-item"><label>Password</label><div className="pass-wrap"><input type={showPassword ? 'text' : 'password'} required value={addFormData.password} onChange={e => setAddFormData({ ...addFormData, password: e.target.value })} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              </div>

              <div className="drawer-section">
                <div className="section-title" style={{ color: '#000000', fontWeight: '900', textTransform: 'uppercase' }}>Staff Details</div>
                <div className="form-item"><label>Full Name</label><input type="text" required value={addFormData.full_name} onChange={e => setAddFormData({ ...addFormData, full_name: e.target.value })} /></div>
                {!isResponderMode ? (
                  <div className="form-item">
                    <label>Role</label>
                    <select value={addFormData.user_type} onChange={e => setAddFormData({ ...addFormData, user_type: e.target.value })}>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-item">
                    <label>Department</label>
                    <select value={addFormData.department} onChange={e => setAddFormData({ ...addFormData, department: e.target.value })}>
                      <option value="">None</option>
                      <option value="BFP">BFP</option>
                      <option value="PNP">PNP</option>
                      <option value="MDRRMO">MDRRMO</option>
                      <option value="RHU">RHU</option>
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
                  Add {isResponderMode ? 'Responder' : isAdminMode ? 'Admin' : 'Staff'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminManagement;
