import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Users,
  Map,
  Settings as SettingsIcon,
  Bell,
  Search,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  PieChart,
  BarChart,
  Activity,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  MoreVertical,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  Plus,
  Menu,
  X,
  User,
  UserCheck,
  FileText,
  Megaphone,
  Mail,
  Moon,
  Sun,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
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
import AdminManagement from './AdminManagement';
import './AdminDashboard.css';
import './ZenithDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('map');
  const isAlreadyViewed = (id) => viewedNotifications instanceof Set ? viewedNotifications.has(id) : viewedNotifications?.includes?.(id);

  const handleTabChange = (tab) => {
    console.log('Tab changing from', activeTab, 'to', tab);
    setActiveTab(tab);
  };
  const [reports, setReports] = useState([]);
  const [filterStatus] = useState('all');
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
    { title: 'Open', value: '0', change: null, icon: <Clock />, color: '#f59e0b' },
    { title: 'Resolved Today', value: '0', change: null, icon: <CheckCircle />, color: '#10b981' },
    { title: 'Total Users', value: '0', change: null, icon: <Users />, color: '#3b82f6' }
  ]);
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);
  const [userReportsSubscription, setUserReportsSubscription] = useState(null);
  const [profilesSubscription, setProfilesSubscription] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('urbanshield_urbanshield_viewed_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
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
  const [adminId, setAdminId] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(user?.type === 'super_admin');
  const [staffFilter, setStaffFilter] = useState('all');
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [activeMenu, setActiveMenu] = useState(null); // track which main menu is open
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('zenith_sound_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [mapFilter, setMapFilter] = useState('all');

  // Persist sound setting
  useEffect(() => {
    localStorage.setItem('zenith_sound_enabled', isSoundEnabled);
  }, [isSoundEnabled]);



  // Global Search State
  const [globalSearchResults, setGlobalSearchResults] = useState({ incidents: [], profiles: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  // Global Search Effect (Debounced)
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setGlobalSearchResults({ incidents: [], profiles: [] });
        return;
      }

      setIsSearching(true);
      try {
        const results = await adminService.globalSearch(searchTerm);
        setGlobalSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load admin profile (avatar)
  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        setAdminId(authUser.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, user_type')
          .eq('id', authUser.id)
          .single();
        if (profile) {
          if (profile.avatar_url) setAdminAvatarUrl(profile.avatar_url);
          if (profile.full_name) setAdminName(profile.full_name);
          setIsSuperAdmin(profile.user_type === 'super_admin');
        }
      } catch (err) {
        console.error('Error loading admin profile:', err);
      }
    };
    loadAdminProfile();
  }, [activeTab]);

  // Load recent activity
  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        // Get recent incidents
        const { data: recentIncidents } = await supabase
          .from('incidents')
          .select('id, title, created_at, status, reporter:profiles!incidents_user_id_fkey(full_name)')
          .order('created_at', { ascending: false })
          .limit(5);

        // Get recent user verifications
        const { data: recentUsers } = await supabase
          .from('profiles')
          .select('id, full_name, created_at, verification_status')
          .order('created_at', { ascending: false })
          .limit(5);

        const activities = [];

        // Add incidents
        recentIncidents?.forEach(incident => {
          activities.push({
            id: `incident-${incident.id}`,
            type: 'incident',
            action: 'reported',
            user: incident.reporter?.full_name || 'Unknown',
            target: incident.title || 'Incident',
            timestamp: incident.created_at,
            status: incident.status
          });
        });

        // Add users
        recentUsers?.forEach(user => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user',
            action: 'registered',
            user: user.full_name || 'Unknown',
            target: 'account',
            timestamp: user.created_at,
            status: user.verification_status
          });
        });

        // Sorting and Grouping Logic (2-minute window)
        const groupLogs = (entries) => {
          const grouped = [];
          const WINDOW_MS = 2 * 60 * 1000; // 2 minutes

          entries.forEach(entry => {
            const isUpdate = entry.type === 'incident' && entry.action === 'updated';
            const existing = grouped.find(g =>
              g.type === entry.type &&
              g.action === entry.action &&
              g.incident_id === entry.incident_id &&
              Math.abs(new Date(g.timestamp) - new Date(entry.timestamp)) < WINDOW_MS
            );

            if (!isUpdate || !existing) {
              grouped.push(entry);
            }
          });
          return grouped;
        };

        const sorted = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setRecentActivity(groupLogs(sorted).slice(0, 8));
      } catch (err) {
        console.error('Error loading recent activity:', err);
      }
    };

    if (activeTab === 'overview') {
      loadRecentActivity();
    }
  }, [activeTab]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscription();

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



  // Load reports from database
  const loadReports = async () => {
    try {
      const data = await adminService.getAllReports();
      console.log('Raw report data:', data);
      console.log('🔍 Database Schema Columns:', Object.keys(data[0] || {}));
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
          display_location: (() => {
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
          raw_location: report.location, // Keep raw hex for map precision
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
          title: 'Open',
          value: (dashboardStats.openReports || 0).toString(),
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

      // Update pending users count for sidebar badge
      if (dashboardStats.pendingUsers !== undefined) {
        setPendingUsersCount(dashboardStats.pendingUsers);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats([
        { title: 'Total Posts', value: '0', change: null, icon: <AlertTriangle />, color: '#dc2626' },
        { title: 'Open', value: '0', change: null, icon: <Clock />, color: '#f59e0b' },
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

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!isSoundEnabled) return;

    try {
      // Use a professional, mission-critical alert sound
      const audio = new Audio('/notification.wav');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio playback prevented by browser:', e));
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [isSoundEnabled]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }
  }, []);

  // Display browser notification
  const showBrowserNotification = useCallback((title, options = {}) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logourb.png',
        badge: '/logourb.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        if (options.data?.id) {
          setActiveTab('incidents');
          setReportsViewMode('list');
          // Handle logic to open this specific report if possible
        }
      };
    }
  }, []);

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

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
        playNotificationSound();

        // Show browser notification
        showBrowserNotification(`New ${payload.new.category || 'Incident'} Reported`, {
          body: payload.new.title || payload.new.address || 'Check the dashboard for details.',
          tag: 'new-incident',
          data: { id: payload.new.id }
        });

        loadReports();
        loadStats();
        loadAnalytics();
        loadResponseTimeAnalytics();

        setNewReportsAvailable(true);
        setTimeout(() => {
          setNewReportsAvailable(false);
        }, 5000);
      } else if (payload.eventType === 'UPDATE') {
        console.log('✏️ Incident updated - synchronizing data...');
        const updatedIncident = payload.new;
        const isRevert = updatedIncident.status === 'open';

        // Sync the modal in real-time if it's currently showing the updated incident
        setSelectedReport(prev => {
          if (!prev || prev.id !== updatedIncident.id) return prev;

          return {
            ...prev,
            ...updatedIncident,
            ...(isRevert && {
              status_updated_by: null,
              status_updated_by_name: null,
              dispatched_departments: [],
              assigned_responders: [],
              assigned_officer: null,
              assigned_officer_id: null
            })
          };
        });

        loadReports();
        loadStats();
        loadAnalytics();
        loadResponseTimeAnalytics();
      } else if (payload.eventType === 'DELETE') {
        console.log('🗑️ Incident deleted - refreshing data...');
        loadReports();
        loadStats();
        loadAnalytics();
        loadResponseTimeAnalytics();
      }
    });

    // Subscribe to user reports table
    const userReportsSubscription = adminService.subscribeToUserReports((payload) => {
      console.log('🔄 Real-time user report update received:', payload);

      if (payload.eventType === 'INSERT') {
        console.log('📝 New user report submitted - refreshing...');
        loadReports(); // Refresh reports data
      } else if (payload.eventType === 'UPDATE') {
        console.log('✏️ User report updated - refreshing...');
        loadReports(); // Refresh reports data
      }
    });

    // Subscribe to profiles table (for user management)
    const profilesSubscription = adminService.subscribeToProfiles((payload) => {
      console.log('🔄 Real-time profile update received:', payload);

      if (payload.eventType === 'INSERT') {
        console.log('👤 New user registered - refreshing stats...');
        loadStats();
      } else if (payload.eventType === 'UPDATE') {
        console.log('✏️ User profile updated - refreshing...');
        loadStats();
      } else if (payload.eventType === 'DELETE') {
        console.log('🗑️ User deleted - refreshing...');
        loadStats();
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

  const handleSelectSearchResult = (result, type) => {
    setSearchTerm('');
    setShowSearchResults(false);

    if (type === 'incident') {
      setActiveTab('incidents');
      setReportsViewMode('list');
      setSelectedReport(result);
      setShowReportModal(true);
    } else if (type === 'profile') {
      if (result.user_type === 'admin' || result.user_type === 'responder' || result.user_type === 'super_admin') {
        setActiveTab('admin-management');
        setStaffFilter(result.user_type === 'admin' ? 'admins' : 'responders');
      } else {
        setActiveTab('users');
      }
    }
  };

  const renderSearchResultsArea = () => {
    if (!searchTerm || searchTerm.length < 2) return null;
    if (!showSearchResults) return null;

    const hasResults = globalSearchResults.incidents.length > 0 || globalSearchResults.profiles.length > 0;

    return (
      <div className="search-results-dropdown" onMouseDown={(e) => e.preventDefault()}>
        {!hasResults && !isSearching && (
          <div className="search-empty">No results found for "{searchTerm}"</div>
        )}

        {isSearching && (
          <div className="search-empty">Searching...</div>
        )}

        {globalSearchResults.incidents.length > 0 && (
          <div className="search-results-section">
            <div className="search-results-header">Posts & Incidents</div>
            {globalSearchResults.incidents.map(item => (
              <div key={item.id} className="search-result-item" onClick={() => handleSelectSearchResult(item, 'incident')}>
                <div className="search-result-icon"><AlertTriangle size={18} /></div>
                <div className="search-result-content">
                  <div className="search-result-title">{item.title}</div>
                  <div className="search-result-subtitle">{item.address || 'Unknown location'}</div>
                </div>
                <div className="search-result-badge">{item.status}</div>
              </div>
            ))}
          </div>
        )}

        {globalSearchResults.profiles.length > 0 && (
          <div className="search-results-section">
            <div className="search-results-header">People & Staff</div>
            {globalSearchResults.profiles.map(item => (
              <div key={item.id} className="search-result-item" onClick={() => handleSelectSearchResult(item, 'profile')}>
                <div className="search-result-icon"><User size={18} /></div>
                <div className="search-result-content">
                  <div className="search-result-title">{item.full_name}</div>
                  <div className="search-result-subtitle">{item.email}</div>
                </div>
                <div className="search-result-badge">{item.user_type}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleAssignResponder = async (incidentId, responder, options = {}) => {
    console.log('⚡ Starting Dispatch Reflection Phase...', { incidentId, responderId: responder?.id, options });
    if (!incidentId || !responder) {
      console.error('❌ DISPATCH ABORTED: Missing Incident ID or Responder Data', { incidentId, responder });
      return;
    }

    try {
      setLoading(true);
      let assignedBy = adminId;
      if (!assignedBy) {
        const { data: { user: authUser } = {} } = await supabase.auth.getUser();
        assignedBy = authUser?.id || null;
        if (assignedBy) setAdminId(assignedBy);
      }

      console.log('📡 Calling adminService.assignResponder...', { incidentId, responderId: responder.id, assignedBy });
      const result = await adminService.assignResponder(incidentId, responder.id, {
        assignedBy,
        ...options,
        status: 'in_progress'
      });

      console.log('✅ adminService result:', result);

      // Optimistic update for reports list (for map and main dashboard)
      setReports(prev => prev.map(r => r.id === incidentId ? {
        ...r,
        status: 'in_progress',
        assigned_officer_id: responder.id,
        assigned_officer: responder.full_name
      } : r));

      await loadReports();
      console.log('🔄 Data refreshed via loadReports()');

      setSelectedReport(prev => (prev && prev.id === incidentId
        ? {
          ...prev,
          status: 'in_progress',
          assigned_officer: responder.full_name + (options.additionalResponders?.length ? ` + ${options.additionalResponders.length} others` : ''),
          assigned_officer_id: responder.id
        }
        : prev));
    } catch (err) {
      console.error('CRITICAL DISPATCH ERROR:', err);
      // Show high-visibility alert to find out why DB is rejecting
      window.alert(`Dispatch Failed: ${err.message || 'Unknown database error'}`);
      setError('Failed to assign responder: ' + (err.message || ''));
    } finally {
      setLoading(false);
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
      matchesStatus = report.is_under_review === true;
    } else if (filterStatus === 'approved') {
      matchesStatus = report.is_under_review === false;
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

      // Optimistic update
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'approved', is_under_review: false } : r));

      await loadReports();
      await loadStats();

      // Update selected report in modal immediately
      setSelectedReport(prev => (prev && prev.id === reportId ? { ...prev, is_under_review: false, status: 'resolved' } : prev));

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

      // Optimistic update
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'rejected', is_verified: false } : r));

      await loadReports();
      await loadStats();

      // Update selected report in modal immediately
      setSelectedReport(prev => (prev && prev.id === reportId ? { ...prev, is_verified: false, status: 'rejected' } : prev));

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

  const handleStartAction = async (reportId) => {
    try {
      setLoading(true);
      await adminService.startAction(reportId);

      // Optimistic update
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'in_progress' } : r));
      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => ({ ...prev, status: 'in_progress' }));
      }

      await loadStats();
      setError(null);
    } catch (err) {
      console.error('Error starting action:', err);
      setError('Failed to start action: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResolved = async (report) => {
    try {
      setLoading(true);
      const reportId = typeof report === 'object' ? report.id : report;
      await adminService.resolveIncident(reportId);

      // Optimistic update
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => ({ ...prev, status: 'resolved' }));
      }

      await loadStats();
      setError(null);
    } catch (err) {
      console.error('Error marking resolved:', err);
      setError('Failed to mark resolved: ' + err.message);
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

  const handleIncidentStatusChange = async (reportId, newStatus) => {
    await loadReports();
    await loadStats();

    // Update active modal report if it's the one that changed
    if (selectedReport?.id === reportId) {
      const clearAssignment = newStatus === 'pending' || newStatus === 'open';
      setSelectedReport(prev => ({
        ...prev,
        status: newStatus,
        ...(clearAssignment && {
          status_updated_by: null,
          status_updated_by_name: null,
          dispatched_departments: [],
          assigned_responders: [],
          assigned_officer: null,
          assigned_officer_id: null,
          assigned_at: null
        })
      }));
    }
  };

  const handleRevertReport = async (reportId) => {
    try {
      setLoading(true);
      await adminService.updateReportStatus(reportId, 'open', 'Incident reverted back to open');

      // Optimistic update
      setReports(prev => prev.map(r => r.id === reportId ? {
        ...r,
        status: 'open',
        status_updated_by_name: null,
        dispatched_departments: [],
        assigned_responders: [],
        assigned_officer: null,
        assigned_officer_id: null
      } : r));

      await handleIncidentStatusChange(reportId, 'open');
    } catch (err) {
      setError('Failed to revert report');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDuplicate = async (reportId) => {
    try {
      setLoading(true);
      await adminService.updateReportStatus(reportId, 'duplicate', 'Marked as duplicate');
      await handleIncidentStatusChange(reportId, 'duplicate');
    } catch (err) {
      setError('Failed to mark duplicate');
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

  // Calculate notification count (open/pending posts not yet viewed)
  const notificationCount = useMemo(() => {
    return reports.filter(r => {
      const isPending = !r.status || r.status === 'pending';
      const isNotViewed = !isAlreadyViewed(r.id);
      return isPending && isNotViewed;
    }).length;
  }, [reports, viewedNotifications]);

  // Mark a notification as viewed
  const handleViewNotification = (notifId) => {
    if (!isAlreadyViewed(notifId)) {
      const newViewed = new Set([...viewedNotifications, notifId]);
      setViewedNotifications(newViewed);
      localStorage.setItem('urbanshield_urbanshield_viewed_notifications', JSON.stringify([...newViewed]));
    }
  };

  // Clear all notifications (mark all current as viewed)
  const handleClearAllNotifications = useCallback(() => {
    const allIds = reports.filter(r => !r.status || r.status === 'pending').map(r => r.id);
    setViewedNotifications(prev => {
      const newSet = new Set([...prev, ...allIds]);
      localStorage.setItem('urbanshield_urbanshield_viewed_notifications', JSON.stringify([...newSet]));
      return newSet;
    });
  }, [reports]);

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
            <div className="nav-item-content">
              <LayoutDashboard size={18} /><span>Dashboard</span>
            </div>
          </button>
          <button className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => handleTabChange('map')}>
            <div className="nav-item-content">
              <MapPin size={18} /><span>Live Map</span>
            </div>
          </button>
          <button className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`} onClick={() => handleTabChange('incidents')}>
            <div className="nav-item-content">
              <AlertTriangle size={18} /><span>Posts</span>
            </div>
            {notificationCount > 0 && (
              <span className="sidebar-badge">{notificationCount}</span>
            )}
          </button>
          <div className="sidebar-group">
            <button
              className={`nav-item ${['users', 'admin-management'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => {
                if (sidebarCollapsed) {
                  setSidebarCollapsed(false);
                  setUserManagementOpen(true);
                  handleTabChange('users');
                } else {
                  setUserManagementOpen(!userManagementOpen);
                  handleTabChange('users');
                }
              }}
            >
              <div className="nav-item-content">
                <Users size={18} />
                <span>User Management</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {pendingUsersCount > 0 && (
                  <span className="sidebar-badge">{pendingUsersCount}</span>
                )}
                <ChevronRight className={`chevron ${userManagementOpen ? 'rotate' : ''}`} size={16} />
              </div>
            </button>

            {userManagementOpen && (
              <div className="sub-nav">
                <button className={`nav-sub-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleTabChange('users')}>
                  <User size={16} /><span>Residents</span>
                </button>
                <button className={`nav-sub-item ${(activeTab === 'admin-management' && staffFilter === 'responders') ? 'active' : ''}`} onClick={() => { handleTabChange('admin-management'); setStaffFilter('responders'); }}>
                  <UserCheck size={16} /><span>Responders</span>
                </button>
                {isSuperAdmin && (
                  <button className={`nav-sub-item ${(activeTab === 'admin-management' && staffFilter === 'admins') ? 'active' : ''}`} onClick={() => { handleTabChange('admin-management'); setStaffFilter('admins'); }}>
                    <Shield size={16} /><span>Admins</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <span className="sidebar-section-label">Other</span>
          <button className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => handleTabChange('announcements')}>
            <div className="nav-item-content">
              <Bell size={18} /><span>Announcements</span>
            </div>
          </button>
          <button className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => handleTabChange('logs')}>
            <div className="nav-item-content">
              <Activity size={18} /><span>Audit Logs</span>
            </div>
          </button>
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
            <div className="nav-item-content">
              <SettingsIcon size={18} /><span>Settings</span>
            </div>
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
              <p>{isSuperAdmin ? 'Super Administrator' : 'Administrator'}</p>
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
              {activeTab === 'map' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>🗺️ Live Post Map</span>}
              {activeTab === 'overview' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Dashboard</span>}
              {activeTab === 'incidents' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Post Management</span>}
              {activeTab === 'reports' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Posts Management</span>}
              {activeTab === 'users' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Residents</span>}
              {activeTab === 'admin-management' && staffFilter === 'responders' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Responders</span>}
              {activeTab === 'admin-management' && staffFilter === 'admins' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Admins</span>}
              {activeTab === 'admin-management' && staffFilter === 'all' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Staff Management</span>}
              {activeTab === 'announcements' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Announcements</span>}
              {activeTab === 'logs' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Audit Logs</span>}
              {activeTab === 'profile' && <span style={{ fontSize: '2em', fontWeight: 'bold' }}>Settings</span>}
            </h1>
          </div>
          <div className="header-right">
            <div className="search-container">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search UrbanShield..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
              {searchTerm && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              {renderSearchResultsArea()}
            </div>
            <div className="notification-container">
              <button
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <div className="badge-container">
                  <Bell size={18} />
                  {notificationCount > 0 && (
                    <span className="notification-badge">{notificationCount}</span>
                  )}
                </div>
              </button>
              <div className={`realtime-indicator ${notificationCount > 0 ? 'unread' : 'read'}`} title={notificationCount > 0 ? `${notificationCount} unread reports` : 'All reports read'}>
                <div className="realtime-dot"></div>
              </div>
              <NotificationDropdown
                user={user}
                reports={reports}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onNavigateToIncidents={(id) => {
                  if (id) {
                    handleViewNotification(id);
                    // Find specific report to open modal
                    const report = reports.find(r => r.id === id);
                    if (report) {
                      setSelectedReport(report);
                      setShowReportModal(true);
                    }
                  }
                  setActiveTab('incidents');
                  setShowNotifications(false);
                }}
                onViewNotification={handleViewNotification}
                onClearAll={handleClearAllNotifications}
                viewedNotifications={viewedNotifications}
              />
            </div>

            <button
              className={`sound-btn ${!isSoundEnabled ? 'muted' : ''}`}
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              title={isSoundEnabled ? "Mute notification sound" : "Unmute notification sound"}
            >
              {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content">
          {activeTab === 'map' && (
            <MapComponent
              incidents={reports}
              userType="admin"
              onMarkerClick={(incident) => handleViewReport(incident)}
              isDark={isDark}
              statusFilter={mapFilter}
              setStatusFilter={setMapFilter}
            />
          )}

          {activeTab === 'overview' && (
            <div className="overview-content">
              {/* Zenith-style Stat Cards */}
              <div className="zenith-stats-grid">
                <div className="zenith-stat-card" onClick={() => { setActiveTab('map'); setMapFilter('all'); }}>
                  <div className="zenith-stat-label">Total Posts</div>
                  <div className="zenith-stat-value">{stats[0]?.value || '0'}</div>
                  <div className="zenith-stat-change positive">All reported incidents</div>
                </div>
                <div className="zenith-stat-card" onClick={() => setActiveTab('users')}>
                  <div className="zenith-stat-label">Active Users</div>
                  <div className="zenith-stat-value">{stats[3]?.value || '0'}</div>
                  <div className="zenith-stat-change positive">Registered accounts</div>
                </div>
                <div className="zenith-stat-card" onClick={() => { setActiveTab('map'); setMapFilter('pending'); }}>
                  <div className="zenith-stat-label">Pending Posts</div>
                  <div className="zenith-stat-value">{stats[1]?.value || '0'}</div>
                  <div className="zenith-stat-change negative">Awaiting moderation</div>
                </div>
                <div className="zenith-stat-card" onClick={() => { setActiveTab('map'); setMapFilter('resolved'); }}>
                  <div className="zenith-stat-label">Resolved Today</div>
                  <div className="zenith-stat-value">{stats[2]?.value || '0'}</div>
                  <div className="zenith-stat-change positive">Handled today</div>
                </div>
              </div>

              {/* Dashboard Grid Layout */}
              <div className="dashboard-grid">
                {/* Main Charts Column */}
                <div className="dashboard-main-chart">
                  {/* Post Trends - Area Chart Upgrade */}
                  <div className="zenith-chart-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="zenith-chart-header">
                      <h3 className="zenith-chart-title">Post Trends</h3>
                      <p className="zenith-chart-subtitle">Incident reporting volume over the past 6 months</p>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={analyticsData}>
                        <defs>
                          <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isDark ? "#3b82f6" : "#2563eb"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={isDark ? "#3b82f6" : "#2563eb"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke={isDark ? '#71717a' : '#a1a1aa'}
                          tick={{ fontSize: 12, fill: isDark ? '#71717a' : '#a1a1aa' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={isDark ? '#71717a' : '#a1a1aa'}
                          tick={{ fontSize: 12, fill: isDark ? '#71717a' : '#a1a1aa' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#18181b' : '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            fontSize: '13px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="incidents"
                          stroke={isDark ? '#60a5fa' : '#2563eb'}
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorIncidents)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Resolution Performance - Bar Chart Addition */}
                  <div className="zenith-chart-card">
                    <div className="zenith-chart-header">
                      <h3 className="zenith-chart-title">Resolution Velocity</h3>
                      <p className="zenith-chart-subtitle">Comparing reported vs resolved incidents</p>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsBarChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke={isDark ? '#71717a' : '#a1a1aa'}
                          tick={{ fontSize: 12, fill: isDark ? '#71717a' : '#a1a1aa' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={isDark ? '#71717a' : '#a1a1aa'}
                          tick={{ fontSize: 12, fill: isDark ? '#71717a' : '#a1a1aa' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#18181b' : '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                        <Bar
                          dataKey="incidents"
                          fill={isDark ? "#3f3f46" : "#e4e4e7"}
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        />
                        <Bar
                          dataKey="resolved"
                          fill={isDark ? "#10b981" : "#059669"}
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sidebar with Activity & Category */}
                <div className="dashboard-sidebar">
                  {/* Recent Activity - Compact */}
                  <div className="zenith-chart-card activity-compact">
                    <div className="zenith-chart-header">
                      <h3 className="zenith-chart-title">Recent Activity</h3>
                      <button className="zenith-view-all" onClick={() => handleTabChange('logs')}>View all</button>
                    </div>
                    <div className="activity-list-compact">
                      {recentActivity.length === 0 ? (
                        <div className="activity-empty-compact">
                          <Clock size={24} style={{ color: 'var(--muted-fg)', opacity: 0.5 }} />
                          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-fg)', margin: '0.5rem 0 0 0' }}>No recent activity</p>
                        </div>
                      ) : (
                        recentActivity.slice(0, 10).map(activity => (
                          <div key={activity.id} className="activity-item-compact">
                            <div className="activity-icon-compact">
                              {activity.type === 'incident' ? (
                                <AlertTriangle size={12} style={{ color: '#ef4444' }} />
                              ) : (
                                <User size={12} style={{ color: '#3b82f6' }} />
                              )}
                            </div>
                            <div className="activity-content-compact">
                              <p className="activity-text-compact">
                                <strong>{activity.user.split(' ')[0]}</strong> {activity.action}
                              </p>
                              <span className="activity-time-compact">{formatTimestamp(activity.timestamp)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Category Chart - Increased height to fill gap naturally */}
                  <div className="zenith-chart-card">
                    <div className="zenith-chart-header">
                      <h3 className="zenith-chart-title">Incident Categories</h3>
                      <p className="zenith-chart-subtitle">Distribution by type</p>
                    </div>
                    <ResponsiveContainer width="100%" height={380}>
                      <RechartsPieChart>
                        <Pie
                          data={incidentTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {incidentTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#18181b' : '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '13px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="zenith-legend" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '1rem' }}>
                      {incidentTypes.slice(0, 8).map((entry, index) => (
                        <div key={index} className="zenith-legend-item">
                          <div className="zenith-legend-color" style={{ backgroundColor: entry.color }}></div>
                          <span className="zenith-legend-label" style={{ fontSize: '0.8125rem' }}>{entry.name}</span>
                          <span className="zenith-legend-value" style={{ fontSize: '0.8125rem' }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Zenith-style Recent Activity */}
              <div className="zenith-activity-card">
                <div className="zenith-card-header">
                  <div>
                    <h3 className="zenith-card-title">Recent Posts</h3>
                    <p className="zenith-card-description">Latest incident reports from the community</p>
                  </div>
                  <button className="zenith-view-all" onClick={() => setActiveTab('incidents')}>View all</button>
                </div>
                <div className="zenith-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Reporter</th>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-fg)' }}>
                            No posts yet
                          </td>
                        </tr>
                      ) : reports.slice(0, 6).map(report => {
                        const postStatus = report.status === 'resolved' ? 'resolved'
                          : report.status === 'in_progress' ? 'in_progress'
                          : report.status === 'duplicate' ? 'duplicate'
                          : 'open';
                        const statusLabel = postStatus === 'resolved' ? 'Resolved'
                          : postStatus === 'in_progress' ? 'In Progress'
                          : postStatus === 'duplicate' ? 'Duplicate'
                          : 'Open';
                        return (
                          <tr key={report.id} onClick={() => { setSelectedReport(report); setShowReportModal(true); }}>
                            <td>
                              <div className="zenith-customer">
                                <div className="zenith-avatar">{(report.reporter || 'U').charAt(0).toUpperCase()}</div>
                                <div>
                                  <div className="zenith-customer-name">{report.reporter || 'Unknown User'}</div>
                                  <div className="zenith-customer-email">{report.title || 'Untitled'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="zenith-location">{report.address || report.location || '—'}</td>
                            <td className="zenith-date">{new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`zenith-badge zenith-badge-${postStatus}`}>{statusLabel}</span>
                                {report.status !== 'duplicate' && report.isDuplicate && (
                                  <span style={{ 
                                    fontSize: '0.65rem', 
                                    background: 'rgba(139, 92, 246, 0.1)', 
                                    color: '#8b5cf6', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    fontWeight: '600'
                                  }}>SUGGESTED DUPLICATE</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <IncidentModeration
              key={activeTab}
              initialSearch={searchTerm}
              onStatusChange={handleIncidentStatusChange}
              onAssignResponder={handleAssignResponder}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement isSuperAdmin={isSuperAdmin} />
          )}

          {activeTab === 'admin-management' && (
            <AdminManagement initialTab={staffFilter} isSuperAdmin={isSuperAdmin} />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsManagement user={user} />
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

          {activeTab === 'logs' && (
            <div className="logs-content">
              <div className="zenith-activity-card">
                <div className="zenith-card-header" style={{ padding: '1.5rem' }}>
                  <div>
                    <h3 className="zenith-card-title">Full System Activity</h3>
                    <p className="zenith-card-description">Complete audit trail of recent platform events</p>
                  </div>
                </div>
                <div className="activity-details-list" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                  {recentActivity.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-fg)' }}>No active logs recorded.</p>
                  ) : (
                    recentActivity.map(activity => (
                      <div key={activity.id} style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1.25rem 0',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {activity.type === 'incident' ? <AlertTriangle size={18} color="#ef4444" /> : <User size={18} color="#3b82f6" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.9375rem' }}>{activity.user}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-fg)' }}>{new Date(activity.timestamp).toLocaleString()}</span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--muted-fg)', margin: 0 }}>
                            Successfully <span style={{ color: 'var(--fg)', fontWeight: '500' }}>{activity.action}</span> a new {activity.type === 'incident' ? 'Incident Report' : 'User Profile'}:
                            <strong style={{ marginLeft: '4px', color: 'var(--fg)' }}>{activity.target}</strong>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
        onStartAction={handleStartAction}
        onMarkResolved={handleMarkResolved}
        onMarkDuplicate={handleMarkDuplicate}
        onRevertOpen={handleRevertReport}
        onAssignResponder={handleAssignResponder}
        onDeleteReport={handleDeleteReport}
        isSuperAdmin={isSuperAdmin}
        loading={loading}
      />
    </div>
  );
};

export default AdminDashboard;
