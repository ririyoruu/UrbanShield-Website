import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  X,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  Tag,
  ChevronDown,
  ChevronUp,
  ListChecks
} from 'lucide-react';
import { adminService } from '../config/supabase';
import './AdminManagement.css';
import './AnnouncementsManagement.css';

const ALERT_LEVEL_CONFIG = {
  critical: { label: 'Critical', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '🔴' },
  warning: { label: 'Warning', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '🟡' },
  info: { label: 'Info', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '🔵' },
  notice: { label: 'Notice', color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '⚫' },
};

const emptyForm = {
  alert_level: 'info',
  alert_type: '',
  title: '',
  content: '',
  areas: '',
  action_items: [''],
};

const AnnouncementsManagement = ({ user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '', onConfirm: null });

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    try {
      setFetchLoading(true);
      const data = await adminService.getAllAnnouncements();
      setAnnouncements(data);
      setError('');
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setFetchLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setDrawerOpen(true);
    setError('');
  };

  const openEdit = (a) => {
    setEditing(a.id);
    setFormData({
      alert_level: a.alert_level || 'info',
      alert_type: a.alert_type || '',
      title: a.title || '',
      content: a.content || '',
      areas: a.areas || a.districts || '',
      action_items: a.action_items?.length ? a.action_items : [''],
    });
    setDrawerOpen(true);
    setError('');
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditing(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 🛠️ include user's department for immediate UI feedback
      const payload = { 
        ...formData, 
        action_items: formData.action_items.filter(i => i.trim()),
        author_department: user?.department || 'URBANSHIELD'
      };

      if (editing) {
        const updated = await adminService.updateAnnouncement(editing, payload);
        const updatedData = updated.data || updated;
        setAnnouncements(prev => prev.map(a => a.id === editing ? { ...a, ...updatedData } : a));
      } else {
        const result = await adminService.createAnnouncement(payload);
        const createdData = result.data || result;
        // Ensure the new card has the author info for immediate display
        const enrichedData = {
          ...createdData,
          author_name: user?.full_name || 'System Administrator',
          author_department: user?.department || 'URBANSHIELD'
        };
        setAnnouncements(prev => [enrichedData, ...prev]);
      }
      
      loadAnnouncements();
      closeDrawer();
    } catch (err) {
      console.error('📋 Full failure context:', err);
      // 🔥 EXPOSE THE ACTUAL ERROR MESSAGE SO WE CAN FIX THE DB
      setError(err.message || (editing ? 'Failed to update announcement' : 'Failed to create announcement'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setModal({
      show: true,
      type: 'confirm',
      title: 'Delete Announcement?',
      message: 'Are you sure you want to delete this announcement? This action cannot be undone.',
      onConfirm: () => executeDelete(id)
    });
  };

  const executeDelete = async (id) => {
    setModal({ show: false });
    try {
      await adminService.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const addActionItem = () => setFormData(f => ({ ...f, action_items: [...f.action_items, ''] }));
  const removeActionItem = (i) => setFormData(f => ({ ...f, action_items: f.action_items.filter((_, idx) => idx !== i) }));
  const updateActionItem = (i, val) => setFormData(f => {
    const items = [...f.action_items]; items[i] = val; return { ...f, action_items: items };
  });

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getAlertConfig = (ann) => {
    const level = ann.alert_level || 'info';
    return ALERT_LEVEL_CONFIG[level] || ALERT_LEVEL_CONFIG.info;
  };

  const sortedAnnouncements = [...announcements].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="zenith-table-moderation">

      {/* ── Top bar ── */}
      <div className="ann-topbar">
        <div className="ann-topbar-left">
          <span className="ann-count-pill">{announcements.length}</span>
          <span className="ann-topbar-label">Announcements</span>
        </div>
        <button className="ann-btn-create" onClick={openCreate}>
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {/* ── List ── */}
      {fetchLoading && announcements.length === 0 ? (
        <div className="ann-loading">
          <div className="ann-loading-spinner"><Loader2 size={24} /></div>
          <h3>Loading announcements...</h3>
        </div>
      ) : error && announcements.length === 0 ? (
        <div className="ann-error">
          <div className="ann-error-icon"><AlertTriangle size={28} /></div>
          <h3>Error loading announcements</h3>
          <p>{error}</p>
          <button className="ann-btn-create" onClick={loadAnnouncements}><Loader2 size={14} /> Try Again</button>
        </div>
      ) : sortedAnnouncements.length === 0 ? (
        <div className="ann-empty">
          <div className="ann-empty-icon"><Megaphone size={28} /></div>
          <h3>No announcements yet</h3>
          <p>Create your first announcement and it will appear here.</p>
          <button className="ann-btn-create" onClick={openCreate}><Plus size={14} /> Create Announcement</button>
        </div>
      ) : (
        <div className="ann-list">
          {sortedAnnouncements.map(ann => {
            const cfg = getAlertConfig(ann);
            const isExpanded = expandedId === ann.id;
            return (
              <div key={ann.id} className="ann-card">
                <div className="ann-card-header">
                  <div className="ann-card-header-left">
                    <span className="ann-alert-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                      {cfg.dot} {cfg.label}
                    </span>
                    {ann.alert_type && (
                      <span className="ann-type-badge">
                        <Tag size={12} /> 
                        {ann.alert_type.includes('|') ? ann.alert_type.split('|')[0] : ann.alert_type}
                      </span>
                    )}
                    <span className="ann-dept-badge">
                      <Megaphone size={12} /> {ann.author_department}
                    </span>
                  </div>
                  <div className="ann-card-actions">
                    <button className="ann-icon-btn" onClick={() => openEdit(ann)} title="Edit">
                      <Edit size={16} />
                    </button>
                    <button className="ann-icon-btn danger" onClick={() => handleDelete(ann.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="ann-card-body">
                  <h4 className="ann-card-title">{ann.title}</h4>
                  {(ann.areas || ann.districts) && (
                    <p className="ann-card-district"><MapPin size={14} /> {ann.areas || ann.districts}</p>
                  )}
                  <p className={`ann-card-content ${!isExpanded ? 'ann-card-content--clamped' : ''}`}>
                    {ann.content}
                  </p>
                  {ann.action_items?.length > 0 && isExpanded && (
                    <div className="ann-action-items">
                      <p className="ann-action-items-label"><ListChecks size={14} /> What You Should Do</p>
                      <ul>
                        {ann.action_items.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="ann-card-footer">
                    <div className="ann-footer-left">
                      {ann.created_at && (
                        <span className="ann-footer-item"><Clock size={12} /> {formatDate(ann.created_at)}</span>
                      )}
                    </div>
                    <button className="ann-expand-btn" onClick={() => setExpandedId(isExpanded ? null : ann.id)}>
                      {isExpanded ? <><ChevronUp size={14} /> Less</> : <><ChevronDown size={14} /> More</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Drawer ── */}
      {drawerOpen && (
        <>
          <div className="zenith-overlay" onClick={closeDrawer} />
          <div className="zenith-drawer" style={{ width: '560px' }}>
            <div className="ann-drawer-header">
              <div>
                <p className="ann-drawer-eyebrow">{editing ? 'Edit' : 'New'} Announcement</p>
                <h3 className="ann-drawer-title">{editing ? 'Update Announcement' : 'Create Announcement'}</h3>
              </div>
              <button className="ann-drawer-close" onClick={closeDrawer}><X size={16} /></button>
            </div>

            <form className="ann-drawer-body" onSubmit={handleSubmit}>

              {error && (
                <div className="ann-form-error"><AlertTriangle size={14} /><span>{error}</span></div>
              )}

              {/* 1. Alert Level */}
              <div className="ann-field">
                <label>Alert Level <span className="ann-req">*</span></label>
                <div className="ann-level-picker">
                  {Object.entries(ALERT_LEVEL_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      className={`ann-level-btn ${formData.alert_level === key ? 'ann-level-btn--active' : ''}`}
                      style={formData.alert_level === key ? { background: cfg.bg, borderColor: cfg.color, color: cfg.color } : {}}
                      onClick={() => setFormData({ ...formData, alert_level: key })}
                      disabled={loading}
                    >
                      <span>{cfg.dot}</span>
                      <span>{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Tag */}
              <div className="ann-field">
                <label>Tag</label>
                <input type="text" placeholder="e.g. Typhoon Warning, Health Advisory"
                  value={formData.alert_type} onChange={e => setFormData({ ...formData, alert_type: e.target.value })}
                  disabled={loading} />
              </div>

              {/* 3. Title */}
              <div className="ann-field">
                <label>Title <span className="ann-req">*</span></label>
                <input type="text" placeholder="e.g. Evacuation Order – Barangay Tubigon"
                  value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required disabled={loading} />
              </div>

              {/* 4. Content */}
              <div className="ann-field">
                <label>Content <span className="ann-req">*</span></label>
                <textarea rows={4} placeholder="Write the full announcement body here..."
                  value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required disabled={loading} />
              </div>

              {/* 5. Areas */}
              <div className="ann-field">
                <label>Areas</label>
                <input type="text" placeholder="e.g. Barangay Tubigon, Bohol"
                  value={formData.areas} onChange={e => setFormData({ ...formData, areas: e.target.value })}
                  disabled={loading} />
              </div>

              {/* 6. Action Items */}
              <div className="ann-field">
                <label>Action Items</label>
                <div className="ann-action-list">
                  {formData.action_items.map((item, i) => (
                    <div key={i} className="ann-action-row">
                      <span className="ann-action-num">{i + 1}</span>
                      <input type="text" placeholder={`Step ${i + 1}...`}
                        value={item} onChange={e => updateActionItem(i, e.target.value)}
                        disabled={loading} />
                      {formData.action_items.length > 1 && (
                        <button type="button" className="ann-action-remove" onClick={() => removeActionItem(i)}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="ann-action-add" onClick={addActionItem} disabled={loading}>
                    <Plus size={13} /> Add Step
                  </button>
                </div>
              </div>

              <div className="ann-drawer-footer">
                <button type="button" className="ann-btn-cancel" onClick={closeDrawer} disabled={loading}>Cancel</button>
                <button type="submit" className="ann-btn-submit" disabled={loading}>
                  {loading ? (
                    <><Loader2 size={15} className="ann-spinner" />{editing ? 'Updating...' : 'Publishing...'}</>
                  ) : (
                    <><CheckCircle size={15} /> {editing ? 'Update' : 'Publish'} Announcement</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Zenith Status Modal */}
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
                  Delete
                </button>
              </div>
            ) : (
              <div className="zenith-modal-actions">
                <button className="status-close-btn" onClick={() => setModal({ show: false })}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManagement;
