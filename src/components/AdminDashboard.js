import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Shield, 
  LogOut, 
  BarChart3, 
  AlertTriangle, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Filter,
  Search,
  Bell,
  TrendingUp,
  Activity,
  RefreshCw,
  Trash2,
  Key,
  Menu,
  X,
  User,
  ImageIcon,
  UserCheck,
  FileText,
  MessageSquare,
  Flag,
  Megaphone,
  Database,
  Settings as SettingsIcon,
  Mail,
  LayoutDashboard
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import MapComponent from './MapComponent';
import { adminService, supabase } from '../config/supabase';
import InvitationManager from './InvitationManager';
import UserManagement from './UserManagement';
import ReportDetailModal from './ReportDetailModal';
import VerificationManagement from './VerificationManagement';
import IncidentModeration from './IncidentModeration';
import UserReportsManagement from './UserReportsManagement';
import AnnouncementsManagement from './AnnouncementsManagement';
import AuditLog from './AuditLog';
import NotificationDropdown from './NotificationDropdown';
import Settings from './Settings';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('map');

  const handleTabChange = (tab) => {
    console.log('Tab changing from', activeTab, 'to', tab);
    setActiveTab(tab);
  };
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [responseTimeStats, setResponseTimeStats] = useState({
    averageResponseTime: 0,
    fastestResponse: 0,
    resolutionRate: 0
  });
  const [stats, setStats] = useState([
    { title: 'Total Posts', value: '0', change: null, icon: <AlertTriangle />, color: '#dc2626' },
    { title: 'Pending Review', value: '0', change: null, icon: <Clock />, color: '#f59e0b' },
    { title: 'Resolved Today', value: '0', change: null, icon: <CheckCircle />, color: '#10b981' },
    { title: 'Total Users', value: '0', change: null, icon: <Users />, color: '#3b82f6' }
  ]);
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [newReportsAvailable, setNewReportsAvailable] = useState(false);
  const [reportsViewMode, setReportsViewMode] = useState('default'); // 'default' or 'list'
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [usersSubTab, setUsersSubTab] = useState('users');
  const [settingsSubTab, setSettingsSubTab] = useState('settings');
  const [adminAvatarUrl, setAdminAvatarUrl] = useState('');
  const [adminName, setAdminName] = useState(user?.name || '');

  // Load admin profile (avatar)
  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', authUser.id)
          .single();
        if (profile) {
          if (profile.avatar_url) setAdminAvatarUrl(profile.avatar_url);
          if (profile.full_name) setAdminName(profile.full_name);
        }
      } catch (err) {
        console.error('Error loading admin profile:', err);
      }
    };
    loadAdminProfile();
  }, [activeTab]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscription();
    loadNotificationCount();

    // Cleanup subscription on unmount
    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    const errors = [];
    
    // Load each function individually so one failure doesn't block others
    const results = await Promise.allSettled([
      loadReports().catch(err => {
        console.error('Error loading reports:', err);
        errors.push('Reports');
        setReports([]);
        return { status: 'rejected', reason: err };
      }),
      loadAnalytics().catch(err => {
        console.error('Error loading analytics:', err);
        errors.push('Analytics');
        return { status: 'rejected', reason: err };
      }),
      loadStats().catch(err => {
        console.error('Error loading stats:', err);
        errors.push('Statistics');
        return { status: 'rejected', reason: err };
      }),
      loadResponseTimeAnalytics().catch(err => {
        console.error('Error loading response time analytics:', err);
        errors.push('Response Time');
        return { status: 'rejected', reason: err };
      })
    ]);
    
    // Only show error if ALL functions failed
    const failedCount = results.filter(r => r.status === 'rejected').length;
    if (failedCount === results.length && errors.length > 0) {
      setError(`Failed to load dashboard data. Please check your connection or database access.`);
    } else if (errors.length > 0) {
      console.warn(`Some dashboard sections failed to load: ${errors.join(', ')}`);
    }
    
    setLoading(false);
  };

  const loadNotificationCount = async () => {
    try {
      const incidents = await adminService.getAllReports();
      const pendingCount = incidents.filter(incident => {
        const verified = incident.is_verified;
        return verified === null || verified === undefined;
      }).length;
      setNotificationCount(pendingCount);
    } catch (error) {
      console.error('Error loading notification count:', error);
      setNotificationCount(0);
    }
  };

  // Load reports from database
  const loadReports = async () => {
    try {
      const data = await adminService.getAllReports();
      console.log('Raw report data:', data);
      const cleanHexStrings = (text) => {
        if (!text || typeof text !== 'string') return text;
        const original = text;
        let cleaned = text
          .replace(/\s+in\s+01010000[0-9A-Fa-f]{32,}/gi, '')
          .replace(/\s+in\s+[0-9A-Fa-f]{40,}/gi, '')
          .replace(/0101000020E6100000[0-9A-Fa-f]{32,}/gi, '')
          .replace(/01010000[0-9A-Fa-f]{32,}/gi, '')
          .replace(/\b[0-9A-Fa-f]{40,}\b/gi, '')
          .replace(/\s+/g, ' ')
          .replace(/\s+in\s*$/i, '')
          .trim();
        if (!cleaned || cleaned.length < 2) {
          return original;
        }
        return cleaned;
      };

      const formattedReports = data.map(report => {
        console.log('Processing report:', report.id, 'Description:', report.description);
        return {
          ...report,
          reporter: report.reporter?.full_name || 'Unknown User',
          timestamp: formatTimestamp(report.created_at),
          type: report.category,
          priority: report.severity || 'medium',
          // Keep latitude/longitude from PostGIS parsing in supabase.js
          latitude: report.latitude,
          longitude: report.longitude,
          title: (() => {
            let rawTitle = report.title || report.description || '';
            if (!rawTitle && report.category) {
              rawTitle = `${report.category} Incident`;
            }
            if (!rawTitle) {
              rawTitle = 'Untitled Incident';
            }
            const cleaned = cleanHexStrings(rawTitle);
            if (!cleaned || cleaned.length < 2) {
              return report.category ? `${report.category} Incident` : 'Untitled Incident';
            }
            return cleaned;
          })(),
          location: (() => {
            const originalLoc = report.location;
            const cityAddress = `${report.city || ''} ${report.address || ''}`.trim();
            const loc = originalLoc || cityAddress || 'Unknown Location';
            if (loc && (
              loc.startsWith('0101000020E6100000') ||
              (loc.length > 40 && /^[0-9A-Fa-f]+$/.test(loc)) ||
              /^01010000[0-9A-Fa-f]{32,}$/.test(loc)
            )) {
              return cityAddress || 'Location not specified';
            }
            return loc;
          })(),
          address: report.address || null,
          description: cleanHexStrings(report.description),
          images: report.images || report.photo_urls || []
        };
      });
      console.log('Formatted reports:', formattedReports);
      setReports(formattedReports);
    } catch (err) {
      console.error('Error loading reports:', err);
      throw err;
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      console.log('Loading analytics data...');
      const { monthlyStats, typeDistribution } = await adminService.getAnalyticsData();
      console.log('Analytics data loaded:', { monthlyStats, typeDistribution });
      
      if (!monthlyStats || monthlyStats.length === 0) {
        const now = new Date();
        const fallbackData = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          fallbackData.push({
            name: d.toLocaleString(undefined, { month: 'short' }),
            incidents: 0,
            resolved: 0
          });
        }
        setAnalyticsData(fallbackData);
      } else {
        setAnalyticsData(monthlyStats);
      }
      
      if (!typeDistribution || typeDistribution.length === 0) {
        setIncidentTypes([
          { name: 'No Data', value: 1, color: '#6b7280' }
        ]);
      } else {
        setIncidentTypes(typeDistribution);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      const now = new Date();
      const fallbackData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        fallbackData.push({
          name: d.toLocaleString(undefined, { month: 'short' }),
          incidents: 0,
          resolved: 0
        });
      }
      setAnalyticsData(fallbackData);
      setIncidentTypes([
        { name: 'No Data', value: 1, color: '#6b7280' }
      ]);
    }
  };

  // Load dashboard statistics
  const loadStats = async () => {
    try {
      console.log('Loading dashboard stats...');
      const dashboardStats = await adminService.getDashboardStats();
      console.log('Dashboard stats loaded:', dashboardStats);
      
      const statsData = [
        { 
          title: 'Total Reports', 
          value: (dashboardStats.totalReports || 0).toString(), 
          change: null, 
          icon: <AlertTriangle />, 
          color: '#dc2626' 
        },
        { 
          title: 'Pending Review', 
          value: (dashboardStats.pendingReports || 0).toString(), 
          change: null, 
          icon: <Clock />, 
          color: '#f59e0b' 
        },
        { 
          title: 'Resolved Today', 
          value: (dashboardStats.resolvedToday || 0).toString(), 
          change: null, 
          icon: <CheckCircle />, 
          color: '#10b981' 
        },
        { 
          title: 'Active Users', 
          value: (dashboardStats.activeUsers || 0).toString(), 
          change: null, 
          icon: <Users />, 
          color: '#3b82f6' 
        }
      ];
      
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats([
        { title: 'Total Reports', value: '0', change: null, icon: <AlertTriangle />, color: '#dc2626' },
        { title: 'Pending Review', value: '0', change: null, icon: <Clock />, color: '#f59e0b' },
        { title: 'Resolved Today', value: '0', change: null, icon: <CheckCircle />, color: '#10b981' },
        { title: 'Active Users', value: '0', change: null, icon: <Users />, color: '#3b82f6' }
      ]);
    }
  };

  // Load response time analytics
  const loadResponseTimeAnalytics = async () => {
    try {
      console.log('Loading response time analytics...');
      const responseStats = await adminService.getResponseTimeAnalytics();
      console.log('Response time stats loaded:', responseStats);
      setResponseTimeStats(responseStats);
    } catch (err) {
      console.error('Error loading response time analytics:', err);
      setResponseTimeStats({
        averageResponseTime: 0,
        fastestResponse: 0,
        resolutionRate: 0
      });
    }
  };

  // Setup real-time subscription
  const setupRealtimeSubscription = () => {
    const subscription = adminService.subscribeToReports((payload) => {
      console.log('Real-time update received:', payload);
      
      if (payload.eventType === 'INSERT') {
        console.log('New incident reported - refreshing data...');
        loadReports();
        loadStats();
        loadAnalytics();
        loadResponseTimeAnalytics();
        loadNotificationCount();
        
        if (activeTab !== 'reports') {
          setNotificationCount(prev => prev + 1);
        }
        
        setNewReportsAvailable(true);
        setTimeout(() => {
          setNewReportsAvailable(false);
        }, 5000);
      } else if (payload.eventType === 'UPDATE') {
        console.log('Incident updated - refreshing data...');
        loadReports();
        loadStats();
        loadAnalytics();
        loadResponseTimeAnalytics();
        loadNotificationCount();
      } else if (payload.eventType === 'DELETE') {
        console.log('Incident deleted - refreshing data...');
        loadReports();
        loadStats();
        loadAnalytics();
        loadResponseTimeAnalytics();
        loadNotificationCount();
      }
    });
    
    setRealtimeSubscription(subscription);
    console.log('Real-time subscription established for incidents');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const filteredReports = reports.filter(report => {
    let matchesStatus = true;
    
    if (filterStatus === 'pending') {
      matchesStatus = report.is_verified === null || report.is_verified === undefined;
    } else if (filterStatus === 'approved') {
      matchesStatus = report.is_verified === true;
    } else if (filterStatus === 'rejected') {
      matchesStatus = report.is_verified === false;
    }
    
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleCloseModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  const handleApprove = async (reportId) => {
    try {
      setLoading(true);
      await adminService.setIncidentVerified(reportId, true);
      await loadReports();
      await loadStats();
      setError(null);
      if (showReportModal) {
        handleCloseModal();
      }
    } catch (err) {
      const message = err?.message || 'Failed to approve report';
      setError(message);
      console.error('Error approving report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reportId, reason = null) => {
    try {
      setLoading(true);
      await adminService.setIncidentVerified(reportId, false);
      if (reason) {
        console.log('Rejection reason:', reason);
      }
      await loadReports();
      await loadStats();
      setError(null);
      if (showReportModal) {
        handleCloseModal();
      }
    } catch (err) {
      const message = err?.message || 'Failed to reject report';
      setError(message);
      console.error('Error rejecting report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await adminService.deleteReport(reportId);
      await loadReports();
      await loadStats();
    } catch (err) {
      setError('Failed to delete report');
      console.error('Error deleting report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllToPending = async () => {
    if (!window.confirm('Are you sure you want to reset all reports to pending? This will move all approved/rejected reports back to pending.')) {
      return;
    }
    
    try {
      setLoading(true);
      await adminService.resetAllReportsToPending();
      await loadReports();
      await loadStats();
      setError(null);
    } catch (err) {
      setError('Failed to reset reports');
      console.error('Error resetting reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = () => {
    loadDashboardData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <img 
              src="/logourb.png" 
              alt="UrbanShield Logo" 
              className="brand-logo"
            />
          </div>
          <span className="brand-text">UrbanShield</span>
        </div>
        
        <div className="user-info" onClick={() => handleTabChange('profile')} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">
            {adminAvatarUrl ? (
              <img src={adminAvatarUrl} alt="Admin" className="sidebar-avatar-img" onError={() => setAdminAvatarUrl('')} />
            ) : (
              <span className="sidebar-avatar-initial">
                {(adminName || user.name || 'A').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="user-details">
            <h3>{adminName || user.name}</h3>
            <p>Administrator</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => handleTabChange('map')}
          >
            <MapPin size={20} />
            <span>Map</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => handleTabChange('incidents')}
          >
            <AlertTriangle size={20} />
            <span>Posts</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            <Flag size={20} />
            <span>Reports</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            <Users size={20} />
            <span>Users</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => handleTabChange('announcements')}
          >
            <Bell size={20} />
            <span>Announcements</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <SettingsIcon size={20} />
            <span>Settings</span>
          </button>
        </nav>
        
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <h1 className="page-title">
              {activeTab === 'map' && 'Live Post Map'}
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'incidents' && 'Post Management'}
              {activeTab === 'reports' && 'Reports Management'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'announcements' && 'Announcements'}
              {activeTab === 'profile' && 'Settings'}
            </h1>
          </div>
          <div className="header-right">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Search reports..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="notification-container">
              <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>
              {showNotifications && (
                <NotificationDropdown
                  notifications={[]}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>
            <button 
              className="refresh-btn" 
              onClick={loadDashboardData}
              disabled={loading}
            >
              <RefreshCw size={20} className={loading ? 'spinning' : ''} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content">
          {activeTab === 'map' && (
            <div className="map-content">
              <div className="map-header">
                <h3>🗺️ Live Post Map</h3>
                <p>📍 Click on any post marker to view full details and take immediate action</p>
                <div className="map-instructions">
                  <span className="instruction-item">🔵 Click markers for details</span>
                  <span className="instruction-item">🔴 Pending posts</span>
                  <span className="instruction-item">🟢 Resolved posts</span>
                </div>
              </div>
              <div className="map-wrapper card">
                <MapComponent 
                  incidents={reports}
                  userType="admin"
                  onMarkerClick={(incident) => handleViewReport(incident)}
                />
              </div>
              <div className="map-insights">
                <div className="insight-card card">
                  <h4>Map Insights</h4>
                  <div className="insights-grid">
                    <div className="insight-item">
                      <Activity size={20} />
                      <div>
                        <span className="insight-label">Hotspots Detected</span>
                        <span className="insight-value">3 areas</span>
                      </div>
                    </div>
                    <div className="insight-item">
                      <TrendingUp size={20} />
                      <div>
                        <span className="insight-label">Trend Analysis</span>
                        <span className="insight-value">↑ 15% this week</span>
                      </div>
                    </div>
                    <div className="insight-item">
                      <Filter size={20} />
                      <div>
                        <span className="insight-label">Active Filters</span>
                        <span className="insight-value">All types</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="overview-content">
              {/* Compact Stats Boxes */}
              <div className="stats-grid-compact">
                <div className="stat-box" style={{ borderLeft: '4px solid #dc2626' }}>
                  <span className="stat-box-value">{stats[0]?.value || '0'}</span>
                  <span className="stat-box-label">Total Posts</span>
                </div>
                <div className="stat-box" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <span className="stat-box-value">{stats[1]?.value || '0'}</span>
                  <span className="stat-box-label">Pending Review</span>
                </div>
                <div className="stat-box" style={{ borderLeft: '4px solid #10b981' }}>
                  <span className="stat-box-value">{stats[2]?.value || '0'}</span>
                  <span className="stat-box-label">Resolved Today</span>
                </div>
                <div className="stat-box" style={{ borderLeft: '4px solid #3b82f6' }}>
                  <span className="stat-box-value">{stats[3]?.value || '0'}</span>
                  <span className="stat-box-label">Active Users</span>
                </div>
                <div className="stat-box stat-box-clickable" style={{ borderLeft: '4px solid #ef4444' }} onClick={() => setActiveTab('incidents')}>
                  <span className="stat-box-value">{reports.filter(r => r.is_verified === null || r.is_verified === undefined).length}</span>
                  <span className="stat-box-label">Pending Posts</span>
                </div>
              </div>

              {/* Charts */}
              <div className="charts-grid">
                <div className="chart-card card">
                  <h3 className="chart-title">Post Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={isDark ? 'rgba(255,255,255,0.6)' : '#64748b'} />
                      <YAxis stroke={isDark ? 'rgba(255,255,255,0.6)' : '#64748b'} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff', 
                          border: isDark ? '1px solid rgba(59,130,246,0.3)' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: isDark ? '#f8fafc' : '#0f172a'
                        }} 
                        labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                        itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                      />
                      <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={3} />
                      <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card card">
                  <h3 className="chart-title">Post Types</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incidentTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {incidentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff', 
                          border: isDark ? '1px solid rgba(59,130,246,0.3)' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: isDark ? '#f8fafc' : '#0f172a'
                        }} 
                        labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                        itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="recent-reports card">
                <div className="card-header">
                  <h3>Recent Posts</h3>
                  <button className="view-all-btn">View All</button>
                </div>
                <div className="reports-list">
                  {reports.slice(0, 3).map(report => (
                    <div key={report.id} className="report-item">
                      <div className="report-info">
                        <h4>{report.title}</h4>
                        <p>{report.location}</p>
                        <span className="report-time">{new Date(report.created_at).toLocaleTimeString()}</span>
                      </div>
                      <span className={`status-badge ${
                        report.is_verified === true ? 'approved' : 
                        report.is_verified === false ? 'rejected' : 'pending'
                      }`}>
                        {report.is_verified === true ? 'Approved' : 
                         report.is_verified === false ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <IncidentModeration key={activeTab} />
          )}

          {activeTab === 'users' && (
            <div className="users-with-verification">
              <div className="sub-tabs">
                <button 
                  className={`sub-tab ${usersSubTab === 'users' ? 'active' : ''}`}
                  onClick={() => setUsersSubTab('users')}
                >
                  <Users size={16} />
                  <span>Users</span>
                </button>
                <button 
                  className={`sub-tab ${usersSubTab === 'verification' ? 'active' : ''}`}
                  onClick={() => setUsersSubTab('verification')}
                >
                  <CheckCircle size={16} />
                  <span>Verification</span>
                </button>
              </div>
              {usersSubTab === 'users' ? <UserManagement /> : <VerificationManagement />}
            </div>
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsManagement />
          )}

          {activeTab === 'reports' && (
            <UserReportsManagement />
          )}

          {activeTab === 'profile' && (
            <div className="settings-with-subtabs">
              <div className="sub-tabs">
                <button 
                  className={`sub-tab ${settingsSubTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setSettingsSubTab('settings')}
                >
                  <SettingsIcon size={16} />
                  <span>General</span>
                </button>
                <button 
                  className={`sub-tab ${settingsSubTab === 'invitations' ? 'active' : ''}`}
                  onClick={() => setSettingsSubTab('invitations')}
                >
                  <Mail size={16} />
                  <span>Invitations</span>
                </button>
                <button 
                  className={`sub-tab ${settingsSubTab === 'audit' ? 'active' : ''}`}
                  onClick={() => setSettingsSubTab('audit')}
                >
                  <FileText size={16} />
                  <span>Audit Log</span>
                </button>
              </div>
              {settingsSubTab === 'settings' && <Settings user={user} onAvatarChange={(url, name) => { if (url) setAdminAvatarUrl(url); if (name) setAdminName(name); }} />}
              {settingsSubTab === 'invitations' && <InvitationManager user={user} />}
              {settingsSubTab === 'audit' && <AuditLog />}
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={showReportModal}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={loading}
      />
    </div>
  );
};

export default AdminDashboard;
