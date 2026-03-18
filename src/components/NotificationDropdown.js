import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../config/supabase';
import './NotificationDropdown.css';

const NotificationDropdown = ({ user, reports = [], isOpen, onClose, onNavigateToIncidents }) => {
  const dropdownRef = useRef(null);

  // ── Close on outside click ──
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    // slight delay so the button click that opened it doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  // ── No separate loading needed, derived from props ──

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const cleanLocation = (incident) => {
    const addr = incident.address || '';
    const loc = incident.location || '';
    if (addr && addr.trim().length > 2) return addr.trim();
    if (loc && !/^[0-9A-Fa-f]{10,}/.test(loc.trim()) && loc.trim().length > 2) return loc.trim();
    return null;
  };

  // ── Derived Data ──
  const actionable = reports
    .filter(r => r.status !== 'resolved')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 15);

  const notifications = actionable.map(r => {
    const isPending = !r.status || r.status === 'pending';
    const location = cleanLocation(r);
    return {
      id: r.id,
      title: r.title || r.category || 'Untitled Post',
      location,
      category: r.category || 'Other',
      status: isPending ? 'pending' : 'in_action',
      severity: r.severity || 'medium',
      time: r.created_at,
      incidentId: r.id,
    };
  });

  const handleItemClick = (notif) => {
    if (onNavigateToIncidents) onNavigateToIncidents();
    onClose();
  };

  const severityColor = (sev) => {
    if (sev === 'high') return '#dc2626';
    if (sev === 'medium') return '#d97706';
    return '#71717a';
  };

  if (!isOpen) return null;

  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const inActionCount = notifications.filter(n => n.status === 'in_action').length;

  return (
    <div className="nd-dropdown" ref={dropdownRef}>

      {/* Header */}
      <div className="nd-header">
        <div className="nd-header-left">
          <Bell size={15} />
          <span>Notifications</span>
          {notifications.length > 0 && (
            <span className="nd-count">{notifications.length}</span>
          )}
        </div>
        <div className="nd-header-right">
          <button className="nd-icon-btn" onClick={onClose} title="Close">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {notifications.length > 0 && (
        <div className="nd-summary">
          {pendingCount > 0 && (
            <span className="nd-chip pending">
              <AlertTriangle size={11} /> {pendingCount} Unconfirmed
            </span>
          )}
          {inActionCount > 0 && (
            <span className="nd-chip in_action">
              <Shield size={11} /> {inActionCount} In Action
            </span>
          )}
        </div>
      )}

      {/* List */}
      <div className="nd-list">
        {notifications.length === 0 ? (
          <div className="nd-empty">
            <CheckCircle size={28} style={{ color: '#10b981' }} />
            <p>All caught up!</p>
            <span>No pending posts right now</span>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className="nd-item"
              onClick={() => handleItemClick(notif)}
            >
              {/* Left: severity dot */}
              <div className="nd-dot" style={{ background: severityColor(notif.severity) }} />

              {/* Body */}
              <div className="nd-item-body">
                <div className="nd-item-top">
                  <span className="nd-item-title">{notif.title}</span>
                  <span className={`nd-status-pill ${notif.status}`}>
                    {notif.status === 'in_action' ? 'In Progress' : 'Unconfirmed'}
                  </span>
                </div>
                <div className="nd-item-meta">
                  {notif.category && (
                    <span className="nd-category">{notif.category}</span>
                  )}
                  {notif.location && (
                    <span className="nd-location">📍 {notif.location}</span>
                  )}
                </div>
                <span className="nd-time">
                  <Clock size={10} /> {formatTimeAgo(notif.time)}
                </span>
              </div>

              {/* Right: chevron */}
              <ChevronRight size={14} className="nd-chevron" />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="nd-footer">
        <button
          className="nd-footer-btn"
          onClick={() => { if (onNavigateToIncidents) onNavigateToIncidents(); onClose(); }}
        >
          View All Posts <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
