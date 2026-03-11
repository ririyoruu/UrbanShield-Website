import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  LogOut,
  AlertTriangle,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  Eye,
  Search,
  Bell,
  Menu,
  X,
  User,
  UserCheck,
  FileText,
  Megaphone,
  Settings as SettingsIcon,
  Mail,
  Moon,
  Sun,
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
import NotificationDropdown from './NotificationDropdown';
import Settings from './Settings';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
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
  const [userReportsSubscription, setUserReportsSubscription] = useState(null);
  const [profilesSubscription, setProfilesSubscription] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [newReportsAvailable, setNewReportsAvailable] = useState(false);
  const [reportsViewMode, setReportsViewMode] = useState('default'); // 'default' or 'list'
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [usersSubTab, setUsersSubTab] = useState('users');
  const [settingsSubTab, setSettingsSubTab] = useState('settings');
  const [adminAvatarUrl, setAdminAvatarUrl] = useState('');
  const [adminName, setAdminName] = useState(user?.name || '');

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    // Cleanup all subscriptions on unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
        console.log('✅ Incidents subscription cleaned up');
      }
      if (userReportsSubscription) {
        userReportsSubscription.unsubscribe();
        console.log('✅ User reports subscription cleaned up');
      }
      if (profilesSubscription) {
        profilesSubscription.unsubscribe();
        console.log('✅ Profiles subscription cleaned up');
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
      const pendingCount = incidents.filter(incident =>
        !incident.status || incident.status === 'pending'
      ).length;
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
          title: 'Total Posts',
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
        { title: 'Total Posts', value: '0', change: null, icon: <AlertTriangle />, color: '#dc2626' },
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

  // Setup real-time subscriptions
  const setupRealtimeSubscription = () => {
    // Subscribe to incidents table
    const incidentsSubscription = adminService.subscribeToReports((payload) => {
      console.log('🔄 Real-time incident update received:', payload);

      if (payload.eventType === 'CONNECTION_ERROR') {
        console.error('❌ Real-time connection error:', payload.error);
        setRealtimeStatus('error');
        return;
      }

      if (payload.eventType === 'INSERT') {
        console.log('📝 New incident reported - refreshing all data...');
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
        console.log('✏️ Incident updated - refreshing data...');
        loadReports();
        loadStats();
        loadAnalytics();
        loadResponseTimeAnalytics();
        loadNotificationCount();
        
        // If status changed to resolved, show notification
        if (payload.old?.status !== payload.new?.status && payload.new?.status === 'resolved') {
          if (activeTab !== 'reports') {
            setNotificationCount(prev => prev + 1);
          }
        }
      } else if (payload.eventType === 'DELETE') {
        console.log('🗑️ Incident deleted - refreshing data...');
        loadReports();
        loadStats();
        loadAnalytics();
        loadResponseTimeAnalytics();
        loadNotificationCount();
      }
    });

    // Subscribe to user reports table
    const userReportsSubscription = adminService.subscribeToUserReports((payload) => {
      console.log('🔄 Real-time user report update received:', payload);

      if (payload.eventType === 'INSERT') {
        console.log('📝 New user report submitted - refreshing...');
        loadReports(); // Refresh reports data
        loadNotificationCount();
        setNotificationCount(prev => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        console.log('✏️ User report updated - refreshing...');
        loadReports(); // Refresh reports data
        loadNotificationCount();
      }
    });

    // Subscribe to profiles table (for user management)
    const profilesSubscription = adminService.subscribeToProfiles((payload) => {
      console.log('🔄 Real-time profile update received:', payload);

      if (payload.eventType === 'INSERT') {
        console.log('👤 New user registered - refreshing stats...');
        loadStats();
        loadNotificationCount();
      } else if (payload.eventType === 'UPDATE') {
        console.log('✏️ User profile updated - refreshing...');
        loadStats();
      } else if (payload.eventType === 'DELETE') {
        console.log('🗑️ User deleted - refreshing...');
        loadStats();
        loadNotificationCount();
      }
    });

    setRealtimeSubscription(incidentsSubscription);
    setUserReportsSubscription(userReportsSubscription);
    setProfilesSubscription(profilesSubscription);
    setRealtimeStatus('connected');
    console.log('✅ Real-time subscriptions established for all tables');
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

  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <Menu size={18} />
          </button>
          <div className="brand-icon">
            <img src="/logourb.png" alt="UrbanShield" className="brand-logo" />
          </div>
          <span className="brand-text">UrbanShield</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">General</span>
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => handleTabChange('map')}>
            <MapPin size={18} /><span>Live Map</span>
          </button>
          <button className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`} onClick={() => handleTabChange('incidents')}>
            <AlertTriangle size={18} /><span>Posts</span>
          </button>
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleTabChange('users')}>
            <Users size={18} /><span>Users</span>
          </button>

          <span className="sidebar-section-label">Other</span>
          <button className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => handleTabChange('announcements')}>
            <Bell size={18} /><span>Announcements</span>
          </button>
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
            <SettingsIcon size={18} /><span>Settings</span>
          </button>
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <button className="user-info" onClick={() => handleTabChange('profile')}>
            <div className="user-avatar">
              {adminAvatarUrl
                ? <img src={adminAvatarUrl} alt="Admin" className="sidebar-avatar-img" onError={() => setAdminAvatarUrl('')} />
                : <span className="sidebar-avatar-initial">{(adminName || user.name || 'A').charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="user-details">
              <h3>{adminName || user.name}</h3>
              <p>Administrator</p>
            </div>
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <h1 className="page-title">
              {activeTab === 'map' && <span style={{ fontSize: '1.3em', fontWeight: 'bold' }}>🗺️ Live Post Map</span>}
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'incidents' && 'Post Management'}
              {activeTab === 'reports' && 'Posts Management'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'announcements' && 'Announcements'}
              {activeTab === 'profile' && 'Settings'}
            </h1>
            {activeTab === 'map' && (
              <div className="map-instructions" style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                <span className="instruction-item">🔵 Click markers for details</span>
                <span className="instruction-item">🔴 Pending posts</span>
                <span className="instruction-item">🟢 Resolved posts</span>
                <span style={{ marginLeft: '15px', fontSize: '0.85em' }}>📍 Click on any post marker to view full details and take immediate action</span>
              </div>
            )}
          </div>
          <div className="header-right">
            <div className="search-container">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search posts..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.trim()) setActiveTab('incidents');
                }}
              />
              {searchTerm && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="notification-container">
              <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>
              <div className={`realtime-indicator ${realtimeStatus}`} title={`Real-time: ${realtimeStatus}`}>
                <div className="realtime-dot"></div>
              </div>
              <NotificationDropdown
                user={user}
                reports={reports}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onNavigateToIncidents={() => { setActiveTab('incidents'); setShowNotifications(false); }}
              />
            </div>
            <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content">
          {activeTab === 'map' && (
            <div className="map-content">
              <div className="map-wrapper card">
                <MapComponent
                  incidents={reports}
                  userType="admin"
                  onMarkerClick={(incident) => handleViewReport(incident)}
                />
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="overview-content">
              {/* Stat Cards */}
              <div className="stats-grid-compact">
                <div className="stat-box">
                  <div className="stat-box-header">
                    <span className="stat-box-label">Total Posts</span>
                    <AlertTriangle size={16} className="stat-box-icon" style={{ color: '#dc2626' }} />
                  </div>
                  <span className="stat-box-value">{stats[0]?.value || '0'}</span>
                  <span className="stat-box-change">All reported incidents</span>
                </div>
                <div className="stat-box">
                  <div className="stat-box-header">
                    <span className="stat-box-label">Pending Review</span>
                    <Clock size={16} className="stat-box-icon" style={{ color: '#f59e0b' }} />
                  </div>
                  <span className="stat-box-value">{stats[1]?.value || '0'}</span>
                  <span className="stat-box-change">Awaiting moderation</span>
                </div>
                <div className="stat-box">
                  <div className="stat-box-header">
                    <span className="stat-box-label">Resolved Today</span>
                    <CheckCircle size={16} className="stat-box-icon" style={{ color: '#10b981' }} />
                  </div>
                  <span className="stat-box-value">{stats[2]?.value || '0'}</span>
                  <span className="stat-box-change">Handled today</span>
                </div>
                <div className="stat-box">
                  <div className="stat-box-header">
                    <span className="stat-box-label">Active Users</span>
                    <Users size={16} className="stat-box-icon" style={{ color: '#3b82f6' }} />
                  </div>
                  <span className="stat-box-value">{stats[3]?.value || '0'}</span>
                  <span className="stat-box-change">Registered accounts</span>
                </div>
                <div className="stat-box stat-box-clickable" onClick={() => setActiveTab('incidents')}>
                  <div className="stat-box-header">
                    <span className="stat-box-label">Pending Posts</span>
                    <Eye size={16} className="stat-box-icon" style={{ color: '#ef4444' }} />
                  </div>
                  <span className="stat-box-value">{reports.filter(r => r.is_verified === null || r.is_verified === undefined).length}</span>
                  <span className="stat-box-change">Click to review →</span>
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
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
                          borderRadius: '8px',
                          color: isDark ? '#fafafa' : '#09090b'
                        }}
                        labelStyle={{ color: isDark ? '#fafafa' : '#09090b' }}
                        itemStyle={{ color: isDark ? '#a1a1aa' : '#52525b' }}
                      />
                      <Line type="monotone" dataKey="incidents" stroke={isDark ? '#a1a1aa' : '#18181b'} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="resolved" stroke={isDark ? '#52525b' : '#71717a'} strokeWidth={2} dot={false} strokeDasharray="4 2" />
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
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}
                        style={{ fontSize: '0.75rem', fill: isDark ? '#e2e8f0' : '#374151' }}
                      >
                        {incidentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
                          borderRadius: '8px',
                          color: isDark ? '#fafafa' : '#09090b'
                        }}
                        labelStyle={{ color: isDark ? '#fafafa' : '#09090b' }}
                        itemStyle={{ color: isDark ? '#a1a1aa' : '#52525b' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="recent-reports card">
                <div className="card-header">
                  <h3>Recent Posts</h3>
                  <button className="view-all-btn" onClick={() => setActiveTab('incidents')}>View All →</button>
                </div>
                <div className="reports-list">
                  {reports.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>
                      No posts yet
                    </div>
                  ) : reports.slice(0, 5).map(report => {
                    const postStatus = report.status === 'resolved' ? 'resolved'
                      : report.status === 'in_action' ? 'in_action'
                        : 'pending';
                    const statusLabel = postStatus === 'resolved' ? 'Resolved'
                      : postStatus === 'in_action' ? 'In Action'
                        : 'Pending';
                    return (
                      <div
                        key={report.id}
                        className="report-item"
                        style={{ cursor: 'pointer' }}
                        onClick={() => { setSelectedReport(report); setShowReportModal(true); }}
                      >
                        <div className="report-info">
                          <h4>{report.title || 'Untitled Post'}</h4>
                          <p>{report.address || report.location || '—'}</p>
                          <span className="report-time">
                            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`status-badge ${postStatus}`}>{statusLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <IncidentModeration key={activeTab} initialSearch={searchTerm} />
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
              </div>
              {settingsSubTab === 'settings' && <Settings user={user} onAvatarChange={(url, name) => { if (url) setAdminAvatarUrl(url); if (name) setAdminName(name); }} />}
              {settingsSubTab === 'invitations' && <InvitationManager user={user} />}
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
