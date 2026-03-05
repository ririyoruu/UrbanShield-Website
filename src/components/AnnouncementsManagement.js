import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Clock,
  AlertTriangle,
  Bell,
  CheckCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import { adminService } from '../config/supabase';
import './AnnouncementsManagement.css';

const PRIORITY_CONFIG = {
  normal: { label: 'Normal', color: '#71717a', bg: '#f4f4f5', border: '#e4e4e7' },
  high: { label: 'High', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const AUDIENCE_LABELS = {
  all: 'All Users',
  verified: 'Verified Only',
  resident: 'Residents',
  government: 'Gov / Responders',
};

const emptyForm = {
  title: '',
  description: '',
  content: '',
  target_audience: 'all',
  priority: 'normal',
  expiration_date: ''
};

const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load announcements from database on component mount
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllAnnouncements();
      setAnnouncements(data);
      setError('');
    } catch (error) {
      console.error('Failed to load announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setFormData(emptyForm); setDrawerOpen(true); setError(''); };
  const openEdit = (a) => { setEditing(a.id); setFormData({ ...a }); setDrawerOpen(true); setError(''); };
  const closeDrawer = () => { setDrawerOpen(false); setEditing(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editing) {
        await adminService.updateAnnouncement(editing, formData);
        setAnnouncements(prev => prev.map(a => a.id === editing ? { ...a, ...formData } : a));
      } else {
        const newAnnouncement = await adminService.createAnnouncement(formData);
        setAnnouncements(prev => [newAnnouncement, ...prev]);
      }
      closeDrawer();
    } catch (error) {
      console.error('Failed to save announcement:', error);
      setError(editing ? 'Failed to update announcement' : 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        setLoading(true);
        await adminService.deleteAnnouncement(id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      } catch (error) {
        console.error('Failed to delete announcement:', error);
        setError('Failed to delete announcement');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="ann-root">

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
      {loading && announcements.length === 0 ? (
        <div className="ann-loading">
          <div className="ann-loading-spinner"><Loader2 size={24} /></div>
          <h3>Loading announcements...</h3>
          <p>Please wait while we fetch the announcements.</p>
        </div>
      ) : error && announcements.length === 0 ? (
        <div className="ann-error">
          <div className="ann-error-icon"><AlertTriangle size={28} /></div>
          <h3>Error loading announcements</h3>
          <p>{error}</p>
          <button className="ann-btn-create" onClick={loadAnnouncements}>
            <Loader2 size={14} /> Try Again
          </button>
        </div>
      ) : announcements.length === 0 ? (
        <div className="ann-empty">
          <div className="ann-empty-icon"><Megaphone size={28} /></div>
          <h3>No announcements yet</h3>
          <p>Create your first announcement and it will appear here.</p>
          <button className="ann-btn-create" onClick={openCreate}><Plus size={14} /> Create Announcement</button>
        </div>
      ) : (
        <div className="ann-list">
          {announcements.map(ann => {
            const p = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.normal;
            return (
              <div key={ann.id} className="ann-card">
                <div className="ann-card-left" style={{ background: p.bg, borderColor: p.border }}>
                  <Bell size={16} style={{ color: p.color }} />
                </div>
                <div className="ann-card-body">
                  <div className="ann-card-top">
                    <div className="ann-card-meta-row">
                      <span className="ann-priority-pill" style={{ color: p.color, background: p.bg, borderColor: p.border }}>
                        {p.label}
                      </span>
                      <span className="ann-audience-pill">
                        <Users size={11} /> {AUDIENCE_LABELS[ann.target_audience] || ann.target_audience}
                      </span>
                    </div>
                    <div className="ann-card-actions">
                      <button className="ann-icon-btn" onClick={() => openEdit(ann)} title="Edit" disabled={loading}>
                        <Edit size={14} />
                      </button>
                      <button className="ann-icon-btn danger" onClick={() => handleDelete(ann.id)} title="Delete" disabled={loading}>
                        {loading ? <Loader2 size={14} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                  <h4 className="ann-card-title">{ann.title}</h4>
                  {ann.description && <p className="ann-card-desc">{ann.description}</p>}
                  {ann.content && <p className="ann-card-content">{ann.content}</p>}
                  <div className="ann-card-footer">
                    {ann.created_at && (
                      <span className="ann-footer-item"><Clock size={11} /> {formatDate(ann.created_at)}</span>
                    )}
                    {ann.expiration_date && (
                      <span className="ann-footer-item warn"><Calendar size={11} /> Expires {formatDate(ann.expiration_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Right-side Drawer ── */}
      {drawerOpen && (
        <>
          <div className="ann-backdrop" onClick={closeDrawer} />
          <div className="ann-drawer">
            {/* Drawer Header */}
            <div className="ann-drawer-header">
              <div>
                <p className="ann-drawer-eyebrow">{editing ? 'Edit' : 'New'} Announcement</p>
                <h3 className="ann-drawer-title">{editing ? 'Update Announcement' : 'Create Announcement'}</h3>
              </div>
              <button className="ann-drawer-close" onClick={closeDrawer}><X size={16} /></button>
            </div>

            {/* Drawer Form */}
            <form className="ann-drawer-body" onSubmit={handleSubmit}>

              {/* Error Display */}
              {error && (
                <div className="ann-form-error">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="ann-field">
                <label>Title <span>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Maintenance Tonight"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="ann-field">
                <label>Short Description</label>
                <input
                  type="text"
                  placeholder="Brief summary shown in the list"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="ann-field">
                <label>Full Content <span>*</span></label>
                <textarea
                  rows={5}
                  placeholder="Write the full announcement body here..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="ann-field-row">
                <div className="ann-field">
                  <label>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} disabled={loading}>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="ann-field">
                  <label>Target Audience</label>
                  <select value={formData.target_audience} onChange={e => setFormData({ ...formData, target_audience: e.target.value })} disabled={loading}>
                    <option value="all">All Users</option>
                    <option value="verified">Verified Only</option>
                    <option value="resident">Residents</option>
                    <option value="government">Gov / Responders</option>
                  </select>
                </div>
              </div>

              <div className="ann-field">
                <label>Expiration Date <span className="ann-optional">(optional)</span></label>
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={e => setFormData({ ...formData, expiration_date: e.target.value })}
                  disabled={loading}
                />
              </div>

              {/* Priority preview */}
              {formData.priority !== 'normal' && (
                <div className="ann-priority-preview" style={{
                  background: PRIORITY_CONFIG[formData.priority]?.bg,
                  borderColor: PRIORITY_CONFIG[formData.priority]?.border,
                  color: PRIORITY_CONFIG[formData.priority]?.color,
                }}>
                  <AlertTriangle size={14} />
                  This announcement is marked as <strong>{PRIORITY_CONFIG[formData.priority]?.label}</strong> priority.
                </div>
              )}

              <div className="ann-drawer-footer">
                <button type="button" className="ann-btn-cancel" onClick={closeDrawer} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="ann-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={15} className="ann-spinner" />
                      {editing ? 'Updating...' : 'Publishing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} /> {editing ? 'Update' : 'Publish'} Announcement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AnnouncementsManagement;
