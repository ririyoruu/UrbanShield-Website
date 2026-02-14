import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Save,
  X
} from 'lucide-react';
import './AnnouncementsManagement.css';

const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    target_audience: 'all',
    priority: 'normal',
    expiration_date: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      setAnnouncements(announcements.map(a => a.id === editing ? { ...a, ...formData } : a));
      setEditing(null);
    } else {
      setAnnouncements([...announcements, { id: Date.now(), ...formData, created_at: new Date() }]);
    }
    setShowForm(false);
    setFormData({ title: '', description: '', content: '', target_audience: 'all', priority: 'normal', expiration_date: '' });
  };

  return (
    <div className="announcements-management">
      <div className="announcements-header">
        <div>
          <h2>Announcements Management</h2>
          <p>Create and manage system announcements</p>
        </div>
        <button className="btn-create" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Create Announcement
        </button>
      </div>

      {showForm && (
        <div className="announcement-form card">
          <div className="form-header">
            <h3>{editing ? 'Edit' : 'Create'} Announcement</h3>
            <button className="btn-close" onClick={() => { setShowForm(false); setEditing(null); }}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target Audience</label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                >
                  <option value="all">All Users</option>
                  <option value="verified">Verified Users Only</option>
                  <option value="resident">Residents</option>
                  <option value="business">Business Owners</option>
                  <option value="government">Government Officials</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Expiration Date (Optional)</label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </button>
              <button type="submit" className="btn-save">
                <Save size={16} />
                {editing ? 'Update' : 'Create'} Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="announcements-list">
        {announcements.length === 0 ? (
          <div className="empty-state">
            <Megaphone size={48} />
            <h3>No announcements</h3>
            <p>Create your first announcement to get started</p>
          </div>
        ) : (
          announcements.map(announcement => (
            <div key={announcement.id} className="announcement-item card">
              <div className="announcement-header">
                <div>
                  <h4>{announcement.title}</h4>
                  <p>{announcement.description}</p>
                </div>
                <span className="priority-badge" data-priority={announcement.priority}>
                  {announcement.priority}
                </span>
              </div>
              <div className="announcement-content">
                <p>{announcement.content}</p>
              </div>
              <div className="announcement-meta">
                <span>Target: {announcement.target_audience}</span>
                {announcement.expiration_date && <span>Expires: {announcement.expiration_date}</span>}
              </div>
              <div className="announcement-actions">
                <button className="btn-edit" onClick={() => { setEditing(announcement.id); setFormData(announcement); setShowForm(true); }}>
                  <Edit size={16} />
                  Edit
                </button>
                <button className="btn-delete" onClick={() => setAnnouncements(announcements.filter(a => a.id !== announcement.id))}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsManagement;

