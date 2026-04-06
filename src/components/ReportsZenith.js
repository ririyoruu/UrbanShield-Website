import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  Flag, Search, RefreshCw, AlertTriangle, X, Activity, User as UserIcon, 
  ChevronRight, ShieldAlert, ShieldCheck, EyeOff, MessageSquare, Trash2, 
  CheckCircle, Clock, AlertOctagon, MoreVertical, Users, ArrowUp, ArrowDown
} from 'lucide-react';
import { adminService } from '../config/supabase';
import './ReportsZenith.css';
import './ZenithTableModeration.css';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: <Clock size={14} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  under_review: { label: 'Under Review', icon: <Activity size={14} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  dismissed: { label: 'Dismissed', icon: <CheckCircle size={14} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  removed: { label: 'Removed', icon: <EyeOff size={14} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
};

const ReportsZenith = ({ isSuperAdmin, user }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedCases, setSelectedCases] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [pendingStatus, setPendingStatus] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUserReports();
      
      const acc = {};
      data.forEach(report => {
        const incidentId = report.incident_id || 'system';
        if (!acc[incidentId]) {
          acc[incidentId] = {
            id: incidentId,
            incident: report.incident,
            status: report.status || 'pending',
            reports: [],
            totalReports: 0,
            latestDate: report.created_at,
            reasons: {},
            lastAdminNote: report.admin_note || '',
            reporters: new Set()
          };
        }
        
        acc[incidentId].reports.push(report);
        acc[incidentId].totalReports += 1;
        
        // Collect reporting user names
        const ru = report.reporting_user;
        const reporterId = report.reporter_id;
        
        let rName = 'Unknown Reporter';
        if (ru) {
          rName = ru.full_name || ru.fullname || ru.name || ru.display_name || ru.username || ru.email?.split('@')[0] || rName;
        }
        
        if (rName === 'Unknown Reporter' && reporterId) {
          rName = `User-${reporterId.slice(0, 5)}`;
        }
        
        acc[incidentId].reporters.add(rName);

        // Debug log for troubleshooting 'Unknown Reporter'
        if (rName === 'Unknown Reporter' || rName.startsWith('User-')) {
          console.warn(`⚠️ Reporter profile missing for report ${report.id}:`, {
            reporter_id: report.reporter_id,
            reporting_user: report.reporting_user
          });
        }
        
        // Group reasons
        const reason = report.reason || 'Other';
        acc[incidentId].reasons[reason] = (acc[incidentId].reasons[reason] || 0) + 1;
        
        // Latest date
        if (new Date(report.created_at) > new Date(acc[incidentId].latestDate)) {
          acc[incidentId].latestDate = report.created_at;
        }

        // Status alignment (take from latest report or any non-pending if exist)
        if (report.status !== 'pending') {
          acc[incidentId].status = report.status;
        }
        
        if (report.admin_note) {
          acc[incidentId].lastAdminNote = report.admin_note;
        }
      });

      const finalData = Object.values(acc).map(group => ({
        ...group,
        reporters: Array.from(group.reporters)
      }));

      setCases(finalData.sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate)));
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const [sortConfig, setSortConfig] = useState({ key: 'latestDate', direction: 'desc' });
  
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const filteredCases = useMemo(() => {
    let result = cases.filter(c => {
      const matchesSearch = !searchTerm || 
        c.incident?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.includes(searchTerm.toLowerCase());
      
      const statusMatch = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && statusMatch;
    });

    // Sorting logic
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'latestDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [cases, searchTerm, filterStatus, sortConfig]);

  const handleSelectCase = (id) => {
    setSelectedCases(prev => {
      const newS = new Set(prev);
      if (newS.has(id)) newS.delete(id);
      else newS.add(id);
      return newS;
    });
  };

  const handleSelectAll = () => {
    if (selectedCases.size > 0) {
      setSelectedCases(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredCases.map(c => c.id));
      setSelectedCases(allIds);
      setSelectAll(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCases.size === 0) return;
    if (!window.confirm(`Delete ${selectedCases.size} selected reports & incidents? This is permanent.`)) return;

    try {
      setSaving(true);
      await adminService.bulkDeleteIncidents(Array.from(selectedCases));
      setSelectedCases(new Set());
      setSelectAll(false);
      await loadReports();
    } catch (error) {
      alert('Delete failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedCase = useMemo(() => 
    cases.find(c => c.id === selectedCaseId), [cases, selectedCaseId]
  );

  const handleOpenCase = (caseObj) => {
    setSelectedCaseId(caseObj.id);
    setAdminNote(caseObj.lastAdminNote || '');
    setPendingStatus(caseObj.status); // Default to current status
    document.body.style.overflow = 'hidden';
  };

  const handleCloseCase = () => {
    setSelectedCaseId(null);
    setPendingStatus(null);
    document.body.style.overflow = '';
  };

  const handleAction = async (newStatus) => {
    if (!newStatus) { handleCloseCase(); return; }
    if (!selectedCase || !user) return;
    try {
      setSaving(true);
      
      // 1. Update the moderation status for all reports tied to this incident
      await adminService.updateUserReports(selectedCase.id, {
        status: newStatus,
        admin_note: adminNote,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      });

      // 2. Perform shadow-removal on the incident itself if 'removed' is chosen
      if (newStatus === 'removed') {
        await adminService.hideIncident(selectedCase.id);
      } else if (newStatus === 'dismissed') {
        // If dismissed, ensure it's NOT flagged (unhide if it was flagged before)
        await adminService.unhideIncident(selectedCase.id);
      }

      await loadReports();
      handleCloseCase();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderModal = () => {
    if (!selectedCase) return null;

    const post = selectedCase.incident;
    const profile = post?.author; // Matched with join in supabase.js
    const author = profile?.full_name || profile?.username || profile?.email?.split('@')[0] || 'Anonymous Poster';
    
    // Formatting Helpers
    const getInitials = (str) => {
      if (!str || str === 'Anonymous Poster') return 'A';
      return str.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    };

    const formatDate = (dateString) => {
      const dStr = dateString || selectedCase.latestDate;
      if (!dStr) return 'Date unknown';
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    };
    
    return ReactDOM.createPortal(
      <div className="view-case-overlay" onClick={handleCloseCase}>
        <div className="view-case-panel" onClick={e => e.stopPropagation()}>
          <div className="case-panel-header">
            <div className="case-header-left">
              <span className="case-id">CASE #{selectedCase.id.slice(0, 8).toUpperCase()}</span>
              <div className="priority-badge">
                {selectedCase.totalReports >= 3 ? <AlertTriangle size={14} /> : <Flag size={14} />}
                {selectedCase.totalReports >= 3 ? 'High Priority' : 'System Flag'}
              </div>
            </div>
            <button className="close-panel-btn" onClick={handleCloseCase}><X size={20} /></button>
          </div>

          <div className="case-panel-content">
            {/* Case Summary Top Section */}
            <div className="case-summary-header">
              <h2 className="case-post-title">{post?.title || 'Untitled Report'}</h2>
              <div className="case-post-meta">
                <span className="post-time-stamp">{formatDate(post?.created_at)}</span>
                <span className="reporter-count-badge">{selectedCase.totalReports} total reports</span>
              </div>
              
              <div className="reporters-list-strip">
                <Users size={14} />
                <span>Reported by: <strong>{Array.from(selectedCase.reporters || []).join(', ')}</strong></span>
              </div>
            </div>

            <div className="case-section post-preview-section">
              <div className="post-content-card">
                <p>{post?.description || 'No description provided.'}</p>
                {post?.images && post.images.length > 0 && (
                  <div className="post-images-reel">
                    {post.images.map((img, i) => (
                      <div key={i} className="reel-img-wrapper">
                        <img src={img} alt={`incident-flag-${i}`} />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="post-footer-metadata">
                  <div className="metadata-item">📍 {post?.location || 'Unknown Location'}</div>
                  <div className="metadata-item">🏷️ {post?.category || 'General'}</div>
                </div>
              </div>
            </div>

            {/* Reports Area (Statistics) */}
            <div className="case-section reports-stats-section">
              <h4>Case Statistics</h4>
              <div className="reasons-grid">
                {Object.entries(selectedCase.reasons).map(([reason, count]) => (
                  <div key={reason} className="reason-pill">
                    <span className="reason-text">{reason}</span>
                    <span className="reason-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Interaction */}
            <div className="case-section admin-workflow-section">
              <label>Admin Internal Notes</label>
              <textarea 
                placeholder="Describe your assessment or reasoning..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
              />

              <div className="workflow-actions-title">Select Verdict</div>
              <div className="action-button-grid">
                <button 
                  className={`verdict-btn dismiss ${pendingStatus === 'dismissed' ? 'active-verdict' : ''}`} 
                  onClick={() => setPendingStatus('dismissed')}
                  disabled={saving}
                >
                  <CheckCircle size={14} />
                  <div className="btn-label">
                    <strong>Dismiss</strong>
                    <span>Validate post and keep active</span>
                  </div>
                </button>

                <button 
                  className={`verdict-btn review ${pendingStatus === 'under_review' ? 'active-verdict' : ''}`} 
                  onClick={() => setPendingStatus('under_review')}
                  disabled={saving}
                >
                  <Activity size={14} />
                  <div className="btn-label">
                    <strong>Review</strong>
                    <span>Mark as investigating</span>
                  </div>
                </button>

                <button 
                  className={`verdict-btn remove ${pendingStatus === 'removed' ? 'active-verdict' : ''}`} 
                  onClick={() => setPendingStatus('removed')}
                  disabled={saving}
                >
                  <EyeOff size={14} />
                  <div className="btn-label">
                    <strong>Remove</strong>
                    <span>Remove from public view</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="case-panel-footer">
            <span className="footer-status">Draft Status: <strong>{(pendingStatus || 'pending').replace('_', ' ')}</strong></span>
            <button className="finalize-btn" onClick={() => handleAction(pendingStatus)} disabled={saving}>
              {saving ? 'Saving...' : 'Done'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="zenith-table-moderation">
      {/* Selection Bar (Zenith style) */}
      {selectedCases.size > 0 && (
        <div className="zenith-selection-bar active" style={{ zIndex: 1000 }}>
          <div className="selection-info">
            <span className="selection-count">{selectedCases.size}</span>
            <span className="selection-text">Reported case{selectedCases.size > 1 ? 's' : ''} selected</span>
          </div>
          <div className="selection-actions">
            <button className="selection-btn cancel" onClick={() => { setSelectedCases(new Set()); setSelectAll(false); }}>
              Clear selection
            </button>
            <button className="selection-btn delete" onClick={handleBulkDelete} disabled={saving}>
              <Trash2 size={16} />
              {saving ? 'Deleting...' : 'Delete rows'}
            </button>
          </div>
        </div>
      )}

      <div className="reports-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search report ID, post title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="toolbar-filters">
          <button 
            className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('all')}
          >
            All Cases
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'under_review' ? 'active' : ''}`} 
            onClick={() => setFilterStatus('under_review')}
          >
            Reviewing
          </button>
        </div>
      </div>

      <div className="zenith-table-container">
        <div className="zenith-table-wrapper">
          <table className="zenith-data-table">
            <thead>
              <tr>
                <th className="zenith-checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectAll || (filteredCases.length > 0 && selectedCases.size === filteredCases.length)}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Post Preview</th>
                <th onClick={() => handleSort('totalReports')} className="sortable-header">
                  Count {sortConfig.key === 'totalReports' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </th>
                <th onClick={() => handleSort('latestDate')} className="sortable-header">
                  Latest Date {sortConfig.key === 'latestDate' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                </th>
                <th>Status</th>
                <th className="actions-header"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="table-loading">Loading reports...</td></tr>
              ) : filteredCases.length === 0 ? (
                <tr><td colSpan="6" className="table-empty">No matching reports found</td></tr>
              ) : (
                filteredCases.map((c) => {
                  const config = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                  const previewImg = c.incident?.images?.[0];
                  const isSelected = selectedCases.has(c.id);
                  
                  return (
                    <tr key={c.id} className={`case-row ${isSelected ? 'selected' : ''}`} onClick={() => handleOpenCase(c)}>
                      <td className="zenith-checkbox-cell" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectCase(c.id)}
                        />
                      </td>
                      <td className="preview-cell">
                        <div className="post-preview-bundle">
                          {previewImg ? (
                            <div className="preview-img"><img src={previewImg} alt="Preview" /></div>
                          ) : (
                            <div className="preview-icon"><MessageSquare size={16} /></div>
                          )}
                          <div className="preview-info">
                            <div className="preview-title truncate">{c.incident?.title || 'System Alert'}</div>
                            <div className="preview-snippet truncate">{c.incident?.description}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`count-indicator ${c.totalReports >= 5 ? 'critical' : ''}`}>
                          {c.totalReports} reports
                        </div>
                      </td>
                      <td>
                        <div className="date-display">
                          {new Date(c.latestDate).toLocaleDateString()}
                          <span>{new Date(c.latestDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td>
                        <div className="status-pill" style={{ color: config.color, background: config.bg }}>
                          {config.icon}
                          {config.label}
                        </div>
                      </td>
                      <td className="actions-cell">
                        <ChevronRight size={18} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {renderModal()}
    </div>
  );
};

export default ReportsZenith;