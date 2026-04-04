import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flag, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  RefreshCw,
  AlertTriangle,
  X
} from 'lucide-react';
import { adminService } from '../config/supabase';
import './UserReportsManagement.css';

const UserReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
  const [saving, setSaving] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      console.log('🔍 UserReportsManagement: Loading reports from database...');
      const data = await adminService.getUserReports();
      console.log('📊 UserReportsManagement: Received reports:', data);
      console.log(`📊 UserReportsManagement: Total reports fetched: ${data?.length || 0}`);
      setReports(data || []);
    } catch (error) {
      console.error('❌ Error loading user reports:', error);
      // Silently fail - don't show alerts to user
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (report) => {
    return report.status || 'pending';
  };

  const getReason = (report) => {
    return report.report_reason || report.reason || 'other';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Search in report reason, incident title, reporter name, and additional info
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
                           report.report_reason?.toLowerCase().includes(searchLower) ||
                           report.additional_info?.toLowerCase().includes(searchLower) ||
                           report.reporter?.full_name?.toLowerCase().includes(searchLower) ||
                           report.incident?.title?.toLowerCase().includes(searchLower) ||
                           report.incident?.description?.toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'all' || getStatus(report) === filterStatus;
      const matchesReason = filterReason === 'all' || getReason(report) === filterReason;
      return matchesSearch && matchesStatus && matchesReason;
    });
  }, [reports, searchTerm, filterStatus, filterReason]);

// Stats derived from reports
  const pendingCount = useMemo(() => reports.filter(r => getStatus(r) === 'pending').length, [reports]);

  const handleResolve = async (reportId, notes = null) => {
    try {
      setSaving(true);
      await adminService.updateUserReportStatus(reportId, 'resolved', notes);
      await loadReports();
      if (showModal && selectedReport?.id === reportId) {
        setShowModal(false);
        setSelectedReport(null);
      }
      // Success - reload will show the update
    } catch (error) {
      console.error('Error resolving report:', error);
      // Silently fail - don't show alerts
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async (reportId, notes = null) => {
    try {
      setSaving(true);
      await adminService.updateUserReportStatus(reportId, 'dismissed', notes);
      await loadReports();
      if (showModal) {
        setShowModal(false);
        setSelectedReport(null);
        setAdminNotes('');
      }
      // Success - reload will show the update
    } catch (error) {
      console.error('Error dismissing report:', error);
      // Silently fail - don't show alerts
    } finally {
      setSaving(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReport(null);
    setAdminNotes('');
  };

  const handleResolveWithNotes = async () => {
    if (selectedReport) {
      await handleResolve(selectedReport.id, adminNotes);
      setAdminNotes('');
    }
  };

  const handleDismissWithNotes = async () => {
    if (selectedReport) {
      await handleDismiss(selectedReport.id, adminNotes);
    }
  };

  return (
    <div className="user-reports-management">
      <div className="reports-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={filterReason} onChange={(e) => setFilterReason(e.target.value)}>
          <option value="all">All Reasons</option>
          <option value="spam">Spam</option>
          <option value="misinformation">Misinformation</option>
          <option value="harassment">Harassment</option>
          <option value="fake">Fake</option>
          <option value="inappropriate">Inappropriate</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="reports-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <Flag size={48} />
            <h3>No reports found</h3>
            <p>No reports match your current filters</p>
          </div>
        ) : (
          filteredReports.map(report => {
            const status = getStatus(report);
            const reason = getReason(report);
            return (
              <div key={report.id} className="report-item">
                <div className="report-item-single-line">
                  <div className="report-item-left">
                    <div className="report-icon-small">
                      <Flag size={18} />
                    </div>
                    <div className="report-info-inline">
                      <h4>
                        {report.incident?.title || `Report on Incident #${report.incident_id?.substring(0, 8) || 'N/A'}`}
                      </h4>
                      <span className="report-details-inline">
                        Reported by: {report.reporter?.full_name || 'Unknown'} 
                        {report.incident && ` • Incident: ${report.incident.title || 'N/A'}`}
                        {report.additional_info && ` • Info: ${report.additional_info}`}
                      </span>
                      <span className="report-time-inline" style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                        {formatTimestamp(report.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="report-item-middle">
                    <span className="reason-badge">{reason}</span>
                    <span className="status-badge" data-status={status}>
                      {status}
                    </span>
                  </div>
                  <div className="report-item-actions" onClick={(e) => e.stopPropagation()}>
                    {status === 'pending' && (
                      <>
                        <button className="btn-resolve" onClick={() => handleResolve(report.id)} disabled={saving}>
                          <CheckCircle size={14} />
                          Resolve
                        </button>
                        <button className="btn-dismiss" onClick={() => handleDismiss(report.id)} disabled={saving}>
                          <XCircle size={14} />
                          Dismiss
                        </button>
                      </>
                    )}
                    <button className="btn-view" onClick={() => handleViewReport(report)}>
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

      {/* Report Detail Modal */}
      {showModal && selectedReport && (
        <div className="modal-overlay" onClick={handleCloseModal} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '2rem'
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'white', margin: 0 }}>Report Details</h2>
              <button onClick={handleCloseModal} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px'
              }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>
                {selectedReport.incident?.title || `Report on Incident #${selectedReport.incident_id?.substring(0, 8) || 'N/A'}`}
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#888', margin: '0.25rem 0' }}>
                  <strong style={{ color: 'white' }}>Reporter:</strong> {selectedReport.reporter?.full_name || 'Unknown'}
                </p>
                <p style={{ color: '#888', margin: '0.25rem 0' }}>
                  <strong style={{ color: 'white' }}>Reason:</strong> 
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '4px 8px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '4px',
                    color: '#ef4444'
                  }}>
                    {getReason(selectedReport)}
                  </span>
                </p>
                <p style={{ color: '#888', margin: '0.25rem 0' }}>
                  <strong style={{ color: 'white' }}>Status:</strong>
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '4px 8px',
                    background: getStatus(selectedReport) === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 
                               getStatus(selectedReport) === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 
                               'rgba(107, 114, 128, 0.2)',
                    borderRadius: '4px',
                    color: getStatus(selectedReport) === 'pending' ? '#f59e0b' : 
                           getStatus(selectedReport) === 'resolved' ? '#10b981' : '#6b7280'
                  }}>
                    {getStatus(selectedReport)}
                  </span>
                </p>
                <p style={{ color: '#888', margin: '0.25rem 0' }}>
                  <strong style={{ color: 'white' }}>Reported:</strong> {formatTimestamp(selectedReport.created_at)}
                </p>
              </div>

              {selectedReport.incident && (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Incident Details</h4>
                  <p style={{ color: '#888', margin: '0.25rem 0' }}>
                    <strong style={{ color: 'white' }}>Title:</strong> {selectedReport.incident.title || 'N/A'}
                  </p>
                  <p style={{ color: '#888', margin: '0.25rem 0' }}>
                    <strong style={{ color: 'white' }}>Description:</strong> {selectedReport.incident.description || 'N/A'}
                  </p>
                  <p style={{ color: '#888', margin: '0.25rem 0' }}>
                    <strong style={{ color: 'white' }}>Location:</strong> {selectedReport.incident.location || 'N/A'}
                  </p>
                  <p style={{ color: '#888', margin: '0.25rem 0' }}>
                    <strong style={{ color: 'white' }}>Category:</strong> {selectedReport.incident.category || 'N/A'}
                  </p>
                </div>
              )}

              {selectedReport.additional_info && (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Additional Information</h4>
                  <p style={{ color: '#888' }}>{selectedReport.additional_info}</p>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {selectedReport.admin_notes && (
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Previous Admin Notes</h4>
                  <p style={{ color: '#888' }}>{selectedReport.admin_notes}</p>
                </div>
              )}

              {getStatus(selectedReport) === 'pending' && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleResolveWithNotes}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      opacity: saving ? 0.5 : 1
                    }}
                  >
                    <CheckCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Resolve
                  </button>
                  <button
                    onClick={handleDismissWithNotes}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      opacity: saving ? 0.5 : 1
                    }}
                  >
                    <XCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReportsManagement;

