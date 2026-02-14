import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter,
  Calendar,
  User,
  Shield
} from 'lucide-react';
import './AuditLog.css';

const AuditLog = () => {
  const [logs, setLogs] = useState([
    { id: 1, admin: 'Admin User', action: 'Approved user verification', target: 'User #123', timestamp: new Date(), type: 'verification' },
    { id: 2, admin: 'Admin User', action: 'Rejected incident', target: 'Incident #456', timestamp: new Date(), type: 'moderation' },
    { id: 3, admin: 'Admin User', action: 'Updated system settings', target: 'General Settings', timestamp: new Date(), type: 'settings' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.admin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="audit-log">
      <div className="audit-header">
        <div>
          <h2>Audit Log</h2>
          <p>Track all admin actions and system changes</p>
        </div>
      </div>

      <div className="audit-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Actions</option>
          <option value="verification">Verification</option>
          <option value="moderation">Moderation</option>
          <option value="settings">Settings</option>
          <option value="user_management">User Management</option>
        </select>
      </div>

      <div className="audit-list">
        <div className="audit-table-header">
          <div>Admin</div>
          <div>Action</div>
          <div>Target</div>
          <div>Type</div>
          <div>Timestamp</div>
        </div>
        {filteredLogs.map(log => (
          <div key={log.id} className="audit-item">
            <div className="audit-cell">
              <User size={16} />
              <span>{log.admin}</span>
            </div>
            <div className="audit-cell">{log.action}</div>
            <div className="audit-cell">{log.target}</div>
            <div className="audit-cell">
              <span className="type-badge" data-type={log.type}>{log.type}</span>
            </div>
            <div className="audit-cell">
              <Calendar size={16} />
              <span>{log.timestamp.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditLog;

