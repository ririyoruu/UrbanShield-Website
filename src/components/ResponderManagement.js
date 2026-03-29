import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  RefreshCw,
  Search,
  Plus,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { supabase } from '../config/supabase';
import ResponderDetailModal from './ResponderDetailModal';
import './UserManagement.css';
import './ZenithIncidentModeration.css';
import './ZenithTableModeration.css';
import './ResponderManagement.css';

const ResponderManagement = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    department: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadResponders();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const loadResponders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'responder')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponders(data || []);
    } catch (error) {
      console.error('Error loading responders:', error);
      showMessage('error', 'Failed to load responders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResponder = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.password) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      // Create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.full_name,
            user_type: 'responder'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData?.user) {
        // Wait a moment for the profile to be created by the trigger
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update the profile with responder-specific data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            user_type: 'responder',
            phone: formData.phone || null,
            department: formData.department || null,
            is_verified: true,
            verification_status: 'verified'
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          throw new Error('Failed to update responder profile');
        }
      }

      showMessage('success', 'Responder account created successfully');
      setShowCreateModal(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        department: ''
      });
      await loadResponders();
    } catch (error) {
      console.error('Error creating responder:', error);
      showMessage('error', error.message || 'Failed to create responder account');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDutyStatus = async (responderId, responderName, currentDutyStatus) => {
    const isOnDuty = currentDutyStatus === 'on_duty';
    const newStatus = isOnDuty ? 'off_duty' : 'on_duty';
    const action = isOnDuty ? 'off duty' : 'on duty';

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          duty_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', responderId);

      if (error) throw error;

      showMessage('success', `${responderName} is now ${action}`);
      await loadResponders();
    } catch (error) {
      console.error('Error updating duty status:', error);
      showMessage('error', 'Failed to update duty status');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateResponder = async (responderId, responderName, currentStatus) => {
    const isActive = currentStatus !== false;
    const action = isActive ? 'deactivate' : 'activate';
    const confirmMessage = isActive 
      ? `Are you sure you want to deactivate ${responderName}? They will no longer be able to access the system.`
      : `Are you sure you want to activate ${responderName}? They will regain access to the system.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSaving(true);
      
      const updateData = isActive 
        ? { 
            is_active: false,
            verification_status: 'suspended',
            updated_at: new Date().toISOString()
          }
        : {
            is_active: true,
            verification_status: 'verified',
            updated_at: new Date().toISOString()
          };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', responderId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      showMessage('success', `Responder ${action}d successfully`);
      await loadResponders();
    } catch (error) {
      console.error(`Error ${action}ing responder:`, error);
      console.error('Error details:', error.message, error.details, error.hint);
      showMessage('error', `Failed to ${action} responder: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (ds) => {
    if (!ds) return '—';
    return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const filteredResponders = useMemo(() => {
    return responders.filter(responder => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s ||
        responder.full_name?.toLowerCase().includes(s) ||
        responder.email?.toLowerCase().includes(s) ||
        responder.department?.toLowerCase().includes(s);
      
      const isVerified = responder.verification_status === 'verified';
      const isActive = responder.is_active !== false;
      
      let matchesFilter = true;
      if (filterTab === 'verified') {
        matchesFilter = isVerified;
      } else if (filterTab === 'active') {
        matchesFilter = isActive;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [responders, searchTerm, filterTab]);

  const stats = useMemo(() => {
    return {
      total: responders.length,
      verified: responders.filter(r => r.verification_status === 'verified').length,
      active: responders.filter(r => r.is_active !== false).length
    };
  }, [responders]);

  return (
    <div className="zenith-table-moderation user-management-module">
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="zenith-tabs">
        <button 
          className={`zenith-tab ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
        >
          All Responders <span>{stats.total}</span>
        </button>
        <button 
          className={`zenith-tab ${filterTab === 'verified' ? 'active' : ''}`}
          onClick={() => setFilterTab('verified')}
        >
          Verified <span>{stats.verified}</span>
        </button>
        <button 
          className={`zenith-tab ${filterTab === 'active' ? 'active' : ''}`}
          onClick={() => setFilterTab('active')}
        >
          Active <span>{stats.active}</span>
        </button>
      </div>

      <div className="zenith-toolbar">
        <div className="zenith-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search responders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="zenith-toolbar-actions">
          <button 
            className="rm-add-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            <span>Add Responder</span>
          </button>
        </div>
      </div>

      <div className="zenith-table-container">
        {loading ? (
          <div className="zenith-loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Loading responders...</p>
          </div>
        ) : filteredResponders.length === 0 ? (
          <div className="zenith-empty-state">
            <Shield size={48} />
            <h3>No responders found</h3>
            <p>Create your first responder account to get started.</p>
          </div>
        ) : (
          <div className="zenith-table-wrapper">
            <table className="zenith-data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Responder</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Duty</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="zenith-actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponders.map((responder, index) => {
                  const initials = getInitials(responder.full_name);
                  const isVerified = responder.verification_status === 'verified';
                  const isActive = responder.is_active !== false;
                  return (
                    <tr key={responder.id} onClick={() => {
                      setSelectedResponder(responder);
                      setShowDetailModal(true);
                    }}>
                      <td className="zenith-order-cell">
                        RSP-{String(filteredResponders.length - index).padStart(4, '0')}
                      </td>
                      <td>
                        <div className="zenith-customer-cell">
                          <div className="zenith-avatar" style={{ backgroundColor: '#3b82f6' }}>
                            {initials}
                          </div>
                          <div className="zenith-customer-info">
                            <div className="zenith-customer-name">{responder.full_name}</div>
                            <div className="zenith-customer-email">{responder.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{responder.department || '—'}</td>
                      <td>{responder.phone || '—'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`rm-duty-toggle ${responder.duty_status === 'on_duty' ? 'on-duty' : 'off-duty'}`}
                          onClick={() => handleToggleDutyStatus(responder.id, responder.full_name, responder.duty_status)}
                          disabled={!isActive}
                          title={responder.duty_status === 'on_duty' ? 'Click to go off duty' : 'Click to go on duty'}
                        >
                          <span className="duty-dot"></span>
                          {responder.duty_status === 'on_duty' ? 'On Duty' : 'Off Duty'}
                        </button>
                      </td>
                      <td>
                        <span className={`zenith-status-badge ${!isActive ? 'status-rejected' : (isVerified ? 'status-verified' : 'status-pending')}`}>
                          {!isActive ? 'Deactivated' : (isVerified ? 'Verified' : 'Pending')}
                        </span>
                      </td>
                      <td className="zenith-date-cell">{formatDate(responder.created_at)}</td>
                      <td className="zenith-actions-cell">
                        {/* Actions handled in detail modal */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <>
          <div className="rm-backdrop" onClick={() => setShowCreateModal(false)} />
          <div className="rm-modal">
            <div className="rm-modal-header">
              <h3>Add Responder</h3>
              <button className="rm-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateResponder}>
              <div className="rm-modal-body">
                <div className="rm-form-row">
                  <div className="rm-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="rm-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email"
                      required
                    />
                  </div>
                </div>
                <div className="rm-form-row">
                  <div className="rm-form-group">
                    <label>Password</label>
                    <div className="rm-password-input">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="rm-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="rm-form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="rm-form-group">
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    <option value="BFP">BFP - Fire Protection</option>
                    <option value="PNP">PNP - Police</option>
                    <option value="MDRRMO">MDRRMO - Disaster Response</option>
                    <option value="RHU">RHU - Health Unit</option>
                    <option value="BHW">BHW - Health Workers</option>
                    <option value="PCG">PCG - Coast Guard</option>
                    <option value="MENRO">MENRO - Environment</option>
                  </select>
                </div>
              </div>
              <div className="rm-modal-footer">
                <button 
                  type="button" 
                  className="rm-btn rm-btn-cancel" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rm-btn rm-btn-create"
                  disabled={saving}
                >
                  {saving ? 'Adding...' : 'Add Responder'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <ResponderDetailModal
        responder={selectedResponder}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedResponder(null);
        }}
        onDeactivate={handleDeactivateResponder}
        loading={saving}
      />
    </div>
  );
};

export default ResponderManagement;
