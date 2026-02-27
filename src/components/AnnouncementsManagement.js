import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
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

  const openCreate = () => { setEditing(null); setFormData(emptyForm); setDrawerOpen(true); };
  const openEdit = (a) => { setEditing(a.id); setFormData({ ...a }); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setEditing(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      setAnnouncements(prev => prev.map(a => a.id === editing ? { ...a, ...formData } : a));
    } else {
      setAnnouncements(prev => [{ id: Date.now(), ...formData, created_at: new Date().toISOString() }, ...prev]);
    }
    closeDrawer();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this announcement?')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
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
      {announcements.length === 0 ? (
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
                      <button className="ann-icon-btn" onClick={() => openEdit(ann)} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="ann-icon-btn danger" onClick={() => handleDelete(ann.id)} title="Delete">
                        <Trash2 size={14} />
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
                      <span className="ann-footer-item warn"><Calendar size={11} /> Expires {ann.expiration_date}</span>
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

              <div className="ann-field">
                <label>Title <span>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Maintenance Tonight"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="ann-field">
                <label>Short Description</label>
                <input
                  type="text"
                  placeholder="Brief summary shown in the list"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                />
              </div>

              <div className="ann-field-row">
                <div className="ann-field">
                  <label>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="ann-field">
                  <label>Target Audience</label>
                  <select value={formData.target_audience} onChange={e => setFormData({ ...formData, target_audience: e.target.value })}>
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
                <button type="button" className="ann-btn-cancel" onClick={closeDrawer}>Cancel</button>
                <button type="submit" className="ann-btn-submit">
                  <CheckCircle size={15} /> {editing ? 'Update' : 'Publish'} Announcement
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
