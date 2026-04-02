import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Clock,
  MapPin,
  User,
  Play,
  FileText,
  Upload,
  X,
  Copy,
  Mountain,
  Flame,
  Droplet,
  ShieldAlert,
  Activity,
  MessageSquare,
  SlidersHorizontal
} from 'lucide-react';
import { adminService, supabase } from '../config/supabase';
import ReportDetailModal from './ReportDetailModal';
import './IncidentModeration.css';
import './ZenithIncidentModeration.css';
import './ZenithTableModeration.css';

const IncidentModeration = ({ initialSearch = '', onStatusChange, onAssignResponder, isSuperAdmin: propIsSuperAdmin }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationCache, setLocationCache] = useState({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(propIsSuperAdmin || false);
  // Resolve modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveText, setResolveText] = useState('');
  const [resolveProofFile, setResolveProofFile] = useState(null);
  const [resolveProofPreview, setResolveProofPreview] = useState('');
  // Duplicates
  const [duplicateGroups, setDuplicateGroups] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIncidents, setSelectedIncidents] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const proofInputRef = useRef(null);

  const formatDisplayId = useCallback((index, total, prefix = 'POS') => {
    const padded = (total - index).toString().padStart(4, '0');
    return `${prefix}-${padded}`;
  }, []);

  useEffect(() => {
    loadIncidents();
    if (propIsSuperAdmin === undefined) {
      checkSuperAdmin();
    }

    // Real-time subscription — updates the table instantly on any DB change
    const channel = supabase
      .channel('incidents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, async (payload) => {
        await loadIncidents();
        // If the changed incident is currently open in the modal, refresh it too
        const changedId = payload.new?.id || payload.old?.id;
        if (changedId) {
          setSelectedIncident(prev => {
            if (!prev || prev.id !== changedId) return prev;
            // Merge new DB values into open modal so it reflects instantly
            return { ...prev, ...payload.new, reporter: prev.reporter };
          });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const checkSuperAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        setIsSuperAdmin(profile?.user_type === 'super_admin');
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (err) {
      return 'Unknown';
    }
  };

  const handleSaveNote = async (incidentId, note) => {
    try {
      setSaving(true);
      const incident = incidents.find(i => i.id === incidentId);
      const currentStatus = incident?.status || 'pending';
      const result = await adminService.updateReportStatus(incidentId, currentStatus, note);
      console.log('✅ Note saved in DB:', result);
      if (result) {
        setSelectedIncident(prev => (prev && prev.id === incidentId ? { ...prev, admin_notes: result.admin_notes || note } : prev));
        setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, admin_notes: result.admin_notes || note } : i));
        await loadIncidents();
      } else {
        console.error('⚠️ DB returned null/undefined for note save');
        setError('Note may not have been saved');
      }
    } catch (error) {
      console.error('❌ Error saving note:', error);
      setError('Failed to save note: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDuplicate = async (incidentId) => {
    const fromModal = selectedIncident && selectedIncident.id === incidentId && showModal;
    if (!fromModal && !window.confirm('Mark this post as a duplicate?')) return;
    try {
      setSaving(true);
      await adminService.updateReportStatus(incidentId, 'duplicate', 'Marked as duplicate');
      // Optimistic update — real-time subscription will confirm
      setSelectedIncident(prev => prev?.id === incidentId ? { ...prev, status: 'duplicate', isDuplicate: true } : prev);
      setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, status: 'duplicate', isDuplicate: true } : i));
    } catch (error) {
      console.error('❌ Error marking duplicate:', error);
      setError('Failed to mark duplicate: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Status mapping — DB uses 'open' for new incidents
  const getStatus = (incident) => {
    if (incident.status === 'duplicate' || incident.isDuplicate) return 'duplicate';
    if (incident.status === 'resolved') return 'resolved';
    if (incident.status === 'in_action') return 'in_action';
    if (incident.status === 'open' || incident.status === 'pending' || !incident.status) return 'pending';
    return incident.status;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'resolved':
        return { label: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,.15)' };
      case 'in_action':
        return { label: 'In Progress', color: '#2563eb', bg: 'rgba(37,99,235,.12)' };
      case 'pending':
        return { label: 'Open', color: '#d97706', bg: 'rgba(217,119,6,.14)' };
      case 'duplicate':
        return { label: 'Duplicate', color: '#a855f7', bg: 'rgba(168,85,247,.15)' };
      default:
        return { label: status, color: '#6b7280', bg: 'rgba(107,114,128,.15)' };
    }
  };

  const categoryMap = {
    earthquake: { label: 'Earthquake', color: '#7c3aed', icon: <Mountain size={20} /> },
    fire: { label: 'Fire', color: '#f97316', icon: <Flame size={20} /> },
    flood: { label: 'Flood', color: '#0ea5e9', icon: <Droplet size={20} /> },
    accident: { label: 'Accident', color: '#ef4444', icon: <ShieldAlert size={20} /> },
    rescue: { label: 'Rescue', color: '#2563eb', icon: <Activity size={20} /> }
  };

  const getCategoryConfig = (category) => {
    if (!category) return { label: 'General', color: '#a855f7', icon: <AlertTriangle size={20} /> };
    const key = category.toLowerCase();
    return categoryMap[key] || { label: category, color: '#a855f7', icon: <AlertTriangle size={20} /> };
  };

  // ─── Duplicate Detection ───
  const normText = (t) => (t || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

  const similarity = (a, b) => {
    if (!a || !b) return 0;
    const wordsA = new Set(normText(a).split(' '));
    const wordsB = new Set(normText(b).split(' '));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    let overlap = 0;
    wordsA.forEach(w => { if (wordsB.has(w)) overlap++; });
    return overlap / Math.max(wordsA.size, wordsB.size);
  };

  const detectDuplicates = useCallback((list) => {
    const groups = {};
    const flagged = new Set();
    for (let i = 0; i < list.length; i++) {
      if (flagged.has(list[i].id)) continue;
      for (let j = i + 1; j < list.length; j++) {
        if (flagged.has(list[j].id)) continue;
        const a = list[i], b = list[j];
        // Same category + high title similarity + within 24h
        const sameCat = a.category && b.category && a.category === b.category;
        const titleSim = similarity(a.title, b.title);
        const descSim = similarity(a.description, b.description);
        const timeDiff = Math.abs(new Date(a.created_at) - new Date(b.created_at));
        const within24h = timeDiff < 24 * 60 * 60 * 1000;
        // Same location (approximate)
        const locA = (a.resolvedLocation || a.location || '').toLowerCase();
        const locB = (b.resolvedLocation || b.location || '').toLowerCase();
        const sameLoc = locA && locB && (locA === locB || similarity(locA, locB) > 0.6);

        if ((titleSim > 0.7 && within24h) || (sameCat && descSim > 0.6 && sameLoc && within24h)) {
          // Mark the newer one as duplicate of the older
          const original = new Date(a.created_at) <= new Date(b.created_at) ? a : b;
          const dupe = original === a ? b : a;
          groups[dupe.id] = original.id;
          flagged.add(dupe.id);
        }
      }
    }
    return groups;
  }, []);

  // ─── Location helpers (unchanged) ───
  const isHexOrGarbage = (text) => {
    if (!text || text.length < 2) return true;
    const hexOnly = text.replace(/[\s.,\-()]/g, '');
    if (/^[0-9A-Fa-f]+$/.test(hexOnly) && hexOnly.length > 10) return true;
    if (/[0-9A-Fa-f]{20,}/.test(text)) return true;
    return false;
  };

  const parsePostGISPoint = (hex) => {
    try {
      if (!hex || typeof hex !== 'string') return null;
      const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
      let offset = 0;
      // PostGIS geography (SRID 4326) starts with 0101000020E6100000
      if (clean.startsWith('0101000020E6100000')) offset = 36;
      // PostGIS geometry (SRID 4326) starts with 0101000020E6100000
      else if (clean.startsWith('01010000')) offset = 20;
      else return null;
      if (clean.length < offset + 32) return null;
      const lonHex = clean.substring(offset, offset + 16);
      const latHex = clean.substring(offset + 16, offset + 32);
      const readDouble = (h) => {
        const bytes = [];
        for (let i = 0; i < 16; i += 2) bytes.push(parseInt(h.substring(i, i + 2), 16));
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        bytes.forEach((b, i) => view.setUint8(i, b));
        return view.getFloat64(0, true); // true = little-endian (WKB 01 prefix)
      };
      const lon = readDouble(lonHex);
      const lat = readDouble(latHex);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) return { lat, lng: lon };
    } catch (e) {
      console.error('Error parsing PostGIS point:', e);
    }
    return null;
  };

  const reverseGeocode = useCallback(async (lat, lng) => {
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (locationCache[key]) return locationCache[key];
    try {
      await new Promise(r => setTimeout(r, 1100));
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'UrbanShieldAdmin/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',').map(s => s.trim());
        const short = parts.slice(0, 3).join(', ');
        setLocationCache(prev => ({ ...prev, [key]: short }));
        return short;
      }
    } catch (err) { }
    return null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resolveLocation = useCallback(async (incident) => {
    console.log('🔍 Resolving location for incident:', incident.id);
    console.log('   Address field:', incident.address);
    console.log('   Location field (PostGIS):', incident.location);

    // First try to use the address field directly
    if (incident.address && incident.address.trim() !== '') {
      console.log('   ✅ Using address field:', incident.address);
      return incident.address;
    }

    // Fallback to parsing PostGIS geography if address is empty
    console.log('   Address is empty, falling back to PostGIS parsing...');
    const loc = incident.location || '';
    let lat = parseFloat(incident.latitude);
    let lng = parseFloat(incident.longitude);

    console.log('   Parsed lat:', lat, 'Parsed lng:', lng);

    if ((!lat || !lng || isNaN(lat) || isNaN(lng)) && incident.coordinates) {
      const parsed = parsePostGISPoint(String(incident.coordinates));
      if (parsed) { lat = parsed.lat; lng = parsed.lng; }
    }
    if ((!lat || !lng || isNaN(lat) || isNaN(lng)) && isHexOrGarbage(loc)) {
      const parsed = parsePostGISPoint(loc);
      if (parsed) { lat = parsed.lat; lng = parsed.lng; }
    }
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      const coordMatch = loc.match(/([-\d.]+)[,\s]+([-\d.]+)/);
      if (coordMatch) { lat = parseFloat(coordMatch[1]); lng = parseFloat(coordMatch[2]); }
    }

    console.log('   Final lat:', lat, 'Final lng:', lng);

    if (lat && lng && !isNaN(lat) && isFinite(lat) && !isNaN(lng) && isFinite(lng)
      && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      console.log('   ✅ Valid coordinates - attempting reverse geocoding...');
      const address = await reverseGeocode(lat, lng);
      if (address) {
        console.log('   ✅ Got address from reverse geocoding:', address);
        return address;
      }
    }

    console.log('   ❌ Could not resolve location - returning Unknown Location');
    return 'Unknown Location';
  }, [reverseGeocode, locationCache]);

  // ─── Load incidents ───
  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllReports();
      if (!data || data.length === 0) { setIncidents([]); return; }

      const cleanHexStrings = (text) => {
        if (!text || typeof text !== 'string') return '';
        let cleaned = text
          // Remove PostGIS geography hex strings (SRID 4326)
          .replace(/0101000020E6100000[0-9A-Fa-f]{32,}/gi, '')
          // Remove PostGIS geometry hex strings
          .replace(/01010000[0-9A-Fa-f]{32,}/gi, '')
          // Remove any remaining long hex strings
          .replace(/\b[0-9A-Fa-f]{40,}\b/gi, '')
          // Clean up extra whitespace
          .replace(/\s+/g, ' ').trim();
        if (!cleaned || cleaned.length < 2) return '';
        return cleaned;
      };

      const formattedIncidents = data.map((incident) => ({
        ...incident,
        reporter: incident.reporter?.full_name || 'Unknown User',
        timestamp: incident.created_at,
        type: incident.category,
        priority: incident.severity || 'medium',
        title: incident.title ? cleanHexStrings(incident.title) : 'Untitled Post',
        location: incident.address || cleanHexStrings(incident.location) || 'Unknown Location',
        address: incident.address || null, // Keep the address field separate
        description: incident.description ? cleanHexStrings(incident.description) : '',
        images: incident.images || incident.photo_urls || []
      }));

      // Detect duplicates
      const dupes = detectDuplicates(formattedIncidents);
      setDuplicateGroups(dupes);
      const withDupes = formattedIncidents.map(i => ({
        ...i,
        isDuplicate: i.status === 'duplicate' || !!dupes[i.id],
        duplicateOf: dupes[i.id] || null
      }));

      setIncidents(withDupes);

      // Force React re-render by incrementing refresh key
      setRefreshKey(prev => prev + 1);

      // Resolve locations in background
      formattedIncidents.forEach(async (incident) => {
        const resolved = await resolveLocation(incident);
        if (resolved !== incident.location) {
          setIncidents(prev => prev.map(i =>
            i.id === incident.id ? { ...i, resolvedLocation: resolved } : i
          ));
        }
      });
    } catch (error) {
      console.error('Error loading incidents:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = !searchTerm ||
        incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (incident.reporter && incident.reporter.toLowerCase().includes(searchTerm.toLowerCase())) ||
        incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.resolvedLocation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || incident.category === filterCategory;
      const matchesSeverity = filterSeverity === 'all' || (incident.severity || 'medium') === filterSeverity;
      const status = getStatus(incident);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
    });
  }, [incidents, searchTerm, filterCategory, filterSeverity, filterStatus]);

  const stats = useMemo(() => ({
    pending: incidents.filter(i => getStatus(i) === 'pending').length,
    in_action: incidents.filter(i => getStatus(i) === 'in_action').length,
    resolved: incidents.filter(i => getStatus(i) === 'resolved').length,
    duplicate: incidents.filter(i => getStatus(i) === 'duplicate').length,
    total: incidents.length
  }), [incidents]);

  // ─── Actions ───
  const handleViewIncident = async (incident) => {
    // Don't open modal if clicking on checkbox
    if (selectedIncidents.has(incident.id)) return;
    
    let refreshed = incident;
    try {
      const fresh = await adminService.getIncidentById(incident.id);
      if (fresh) {
        refreshed = {
          ...incident,
          ...fresh,
          reporter: fresh?.reporter?.full_name || incident.reporter,
          admin_notes: fresh.admin_notes ?? incident.admin_notes,
        };
      }
    } catch (err) {
      console.warn('Failed to refresh incident detail, using cached data', err);
    }
    setSelectedIncident(refreshed);
    setShowModal(true);
  };

  const handleStartAction = async (incidentId) => {
    try {
      setSaving(true);
      await adminService.startAction(incidentId);
      // Optimistic update — real-time subscription will confirm from DB
      setSelectedIncident(prev => prev?.id === incidentId ? { ...prev, status: 'in_action' } : prev);
      setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, status: 'in_action' } : i));
      onStatusChange?.(incidentId, 'in_action');
    } catch (error) {
      console.error('❌ Error starting action:', error);
      setError('Failed to start action: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openResolveModal = (incident) => {
    setResolveTarget(incident);
    setResolveText('');
    setResolveProofFile(null);
    setResolveProofPreview('');
    setShowResolveModal(true);
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be less than 5MB'); return; }
    setResolveProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setResolveProofPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Bulk actions
  const handleSelectAll = useCallback(() => {
    if (selectAll || selectedIncidents.size > 0) {
      setSelectedIncidents(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredIncidents.map(i => i.id));
      setSelectedIncidents(allIds);
      setSelectAll(true);
    }
  }, [selectAll, selectedIncidents.size, filteredIncidents]);

  const handleSelectIncident = useCallback((incidentId) => {
    setSelectedIncidents(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(incidentId)) {
        newSelected.delete(incidentId);
      } else {
        newSelected.add(incidentId);
      }
      return newSelected;
    });
  }, []);

  // Update selectAll state when selection changes
  useEffect(() => {
    const allCount = filteredIncidents.length;
    const selectedCount = selectedIncidents.size;
    if (allCount > 0 && selectedCount === allCount) {
      setSelectAll(true);
    } else if (selectedCount === 0) {
      setSelectAll(false);
    }
  }, [selectedIncidents, filteredIncidents.length]);

  const handleBulkDelete = async () => {
    if (selectedIncidents.size === 0) return;
    if (!window.confirm(`Delete ${selectedIncidents.size} selected post(s)? This action cannot be undone.`)) return;

    try {
      setSaving(true);
      const deletePromises = Array.from(selectedIncidents).map(id => 
        adminService.deleteReport(id)
      );
      await Promise.all(deletePromises);
      setSelectedIncidents(new Set());
      setSelectAll(false);
      await loadIncidents();
    } catch (error) {
      console.error('Error deleting posts:', error);
      setError('Failed to delete selected posts');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkResolve = async () => {
    if (selectedIncidents.size === 0) return;
    if (!window.confirm(`Mark ${selectedIncidents.size} selected post(s) as resolved?`)) return;

    try {
      setSaving(true);
      const resolvePromises = Array.from(selectedIncidents).map(id => 
        adminService.resolveIncident(id, { updateText: 'Bulk resolved' })
      );
      await Promise.all(resolvePromises);
      setSelectedIncidents(new Set());
      setSelectAll(false);
      await loadIncidents();
    } catch (error) {
      console.error('Error resolving posts:', error);
      setError('Failed to resolve selected posts');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkMarkDuplicate = async () => {
    if (selectedIncidents.size === 0) return;
    if (!window.confirm(`Mark ${selectedIncidents.size} selected post(s) as duplicate?`)) return;

    try {
      setSaving(true);
      const duplicatePromises = Array.from(selectedIncidents).map(id => 
        adminService.updateReportStatus(id, 'duplicate', 'Bulk marked as duplicate')
      );
      await Promise.all(duplicatePromises);
      setSelectedIncidents(new Set());
      setSelectAll(false);
      await loadIncidents();
    } catch (error) {
      console.error('Error marking duplicates:', error);
      setError('Failed to mark selected posts as duplicate');
    } finally {
      setSaving(false);
    }
  };

  const handleLocalAssignResponder = async (incidentId, responder, options = {}) => {
    if (!onAssignResponder) return;
    try {
      setSaving(true);

      // Optimistic update FIRST — unlock 'Mark Resolved' immediately
      const officerName = responder?.full_name || 'Responder';
      const display = options.additionalResponders?.length
        ? `${officerName} + ${options.additionalResponders.length}`
        : officerName;

      setSelectedIncident(prev =>
        prev && prev.id === incidentId
          ? { ...prev, status: 'in_action', assigned_officer: display }
          : prev
      );
      setIncidents(prev =>
        prev.map(i =>
          i.id === incidentId ? { ...i, status: 'in_action', assigned_officer: display } : i
        )
      );

      await onAssignResponder(incidentId, responder, options);
    } catch (error) {
      console.error('Error in local assign responder:', error);
      // Revert optimistic update on failure
      await loadIncidents();
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveTarget) return;
    try {
      setSaving(true);
      let proofUrl = null;
      // Upload proof if provided
      if (resolveProofFile) {
        const ext = resolveProofFile.name.split('.').pop();
        const fileName = `resolve-proof-${resolveTarget.id}-${Date.now()}.${ext}`;
        try {
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(fileName, resolveProofFile, { upsert: true });
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            proofUrl = publicUrl;
          }
        } catch (e) {
          // Fallback: base64
          proofUrl = resolveProofPreview;
        }
      }
      // Optimistic update: reflect resolved immediately in modal
      setSelectedIncident(prev => (prev && prev.id === resolveTarget.id ? { ...prev, status: 'resolved' } : prev));
      setIncidents(prev => prev.map(i => i.id === resolveTarget.id ? { ...i, status: 'resolved' } : i));
      onStatusChange?.(resolveTarget.id, 'resolved');
      await adminService.resolveIncident(resolveTarget.id, { updateText: resolveText, proofUrl: proofUrl });
      await loadIncidents();
      setShowResolveModal(false);
      setResolveTarget(null);
      setResolveText('');
      setResolveProofFile(null);
      setResolveProofPreview('');
    } catch (err) {
      console.error('Error resolving incident:', err);
      setError('Failed to resolve incident');
      await loadIncidents();
    } finally {
      setSaving(false);
    }
  };

  const handleDirectResolve = async (incident) => {
    try {
      setSaving(true);
      await adminService.resolveIncident(incident.id, { updateText: '', proofUrl: null });
      // Optimistic update — real-time subscription will confirm
      setSelectedIncident(prev => prev?.id === incident.id ? { ...prev, status: 'resolved' } : prev);
      setIncidents(prev => prev.map(i => i.id === incident.id ? { ...i, status: 'resolved' } : i));
      onStatusChange?.(incident.id, 'resolved');
    } catch (err) {
      console.error('❌ Error resolving:', err);
      setError('Failed to resolve incident: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevertStatus = async (incidentId, newStatus) => {
    try {
      setSaving(true);
      console.log(`🔄 Reverting incident ${incidentId} to ${newStatus}...`);
      await adminService.updateReportStatus(incidentId, newStatus, `Status reverted to ${newStatus}`);
      
      // Clear assignment data when reverting to open
      const isRevertingToOpen = newStatus === 'pending' || newStatus === 'open';
      const patch = {
        status: newStatus,
        isDuplicate: newStatus === 'duplicate',
        ...(isRevertingToOpen && { 
          assigned_officer: null, 
          assigned_officer_id: null, 
          assigned_at: null 
        })
      };
      
      console.log('✅ Applying revert patch to local state:', patch);
      setSelectedIncident(prev => prev?.id === incidentId ? { ...prev, ...patch } : prev);
      setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, ...patch } : i));
      onStatusChange?.(incidentId, newStatus);
    } catch (err) {
      console.error('❌ Error reverting status:', err);
      setError('Failed to revert status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDuplicate = async (incidentId) => {
    if (!window.confirm('Remove this duplicate post?')) return;
    try {
      setSaving(true);
      setIncidents(prev => prev.filter(i => i.id !== incidentId));
      await adminService.deleteReport(incidentId);
    } catch (error) {
      console.error('Error deleting duplicate:', error);
      await loadIncidents();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (incidentId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    try {
      setSaving(true);
      await adminService.deleteReport(incidentId);
      console.log('✅ Deleted from DB');
      setIncidents(prev => prev.filter(i => i.id !== incidentId));
      setShowModal(false);
      setSelectedIncident(null);
    } catch (error) {
      console.error('❌ Error deleting:', error);
    } finally {
      setSaving(false);
    }
  };

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIncidents(new Set());
    setSelectAll(false);
  }, [searchTerm, filterCategory, filterSeverity, filterStatus]);
  /* ── Checkbox Selection State ── */
  const isAllSelected = filteredIncidents.length > 0 && selectedIncidents.size === filteredIncidents.length;
  const isIndeterminate = selectedIncidents.size > 0 && selectedIncidents.size < filteredIncidents.length;

  // For backwards compat with ReportDetailModal
  const handleApprove = async (id) => handleStartAction(id);
  const handleReject = async (id) => {
    openResolveModal(incidents.find(i => i.id === id));
  };

  return (
    <>
    <div className="zenith-table-moderation">
      {/* Tab Filters */}
      <div className="zenith-tabs">
        <button className={`zenith-tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          All
        </button>
        <button className={`zenith-tab ${filterStatus === 'resolved' ? 'active' : ''}`} onClick={() => setFilterStatus('resolved')}>
          Resolved
        </button>
        <button className={`zenith-tab ${filterStatus === 'in_action' ? 'active' : ''}`} onClick={() => setFilterStatus('in_action')}>
          In Progress
        </button>
        <button className={`zenith-tab ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>
          Open
        </button>
        {stats.duplicate > 0 && (
          <button className={`zenith-tab ${filterStatus === 'duplicate' ? 'active' : ''}`} onClick={() => setFilterStatus('duplicate')}>
            Duplicate
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="zenith-toolbar">
        {selectedIncidents.size > 0 ? (
          <div className="zenith-bulk-actions">
            <span className="zenith-bulk-count">
              {selectedIncidents.size} selected
            </span>
            <button 
              className="zenith-toolbar-btn zenith-btn-success"
              onClick={handleBulkResolve}
              disabled={saving}
            >
              <CheckCircle size={16} /> Resolve
            </button>
            <button 
              className="zenith-toolbar-btn zenith-btn-warning"
              onClick={handleBulkMarkDuplicate}
              disabled={saving}
            >
              <Copy size={16} /> Mark Duplicate
            </button>
            {isSuperAdmin && (
              <button 
                className="zenith-toolbar-btn zenith-btn-danger"
                onClick={handleBulkDelete}
                disabled={saving}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <button 
              className="zenith-toolbar-btn"
              onClick={() => setSelectedIncidents(new Set())}
            >
              <X size={16} /> Clear
            </button>
          </div>
        ) : (
          <>
            <div className="zenith-search">
              <Search size={18} />
              <input type="text" placeholder="Search posts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="zenith-toolbar-actions">
              <button className="zenith-toolbar-btn">
                <SlidersHorizontal size={14} /> Columns
              </button>
              <button className="zenith-toolbar-btn">
                <Upload size={14} /> Export
              </button>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="zenith-table-container">
        {loading ? (
          <div className="zenith-loading-state">
            <RefreshCw size={32} />
            <p>Loading posts...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="zenith-empty-state">
            <AlertTriangle size={48} />
            <h3>No posts found</h3>
            <p>There are currently no posts in the database.</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="zenith-empty-state">
            <AlertTriangle size={48} />
            <h3>No matching posts</h3>
            <p>Try changing your filter settings. ({incidents.length} total posts)</p>
          </div>
        ) : (
          <div className="zenith-table-wrapper">
            <table className="zenith-data-table">
              <thead>
                <tr>
                  <th className="zenith-checkbox-cell">
                    <input
                      type="checkbox"
                      className="zenith-checkbox"
                      checked={isAllSelected}
                      ref={el => {
                        if (el) {
                          el.indeterminate = isIndeterminate;
                        }
                      }}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Post ID</th>
                  <th>Reporter</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="zenith-actions-cell"></th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident, index) => {
                  const status = getStatus(incident);
                  const statusConfig = getStatusConfig(status);
                  const displayLocation = incident.resolvedLocation || incident.location || 'No location provided';
                  const statusClass = status === 'in_action' ? 'in-progress' : status;
                  return (
                    <tr key={incident.id} onClick={() => handleViewIncident(incident)}>
                      <td className="zenith-checkbox-cell" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="zenith-checkbox"
                          checked={selectedIncidents.has(incident.id)}
                          onChange={() => handleSelectIncident(incident.id)}
                        />
                      </td>
                      <td className="zenith-order-cell">
                        {formatDisplayId(index, filteredIncidents.length)}
                      </td>
                      <td>
                        <div className="zenith-customer-cell">
                          <div className="zenith-avatar">
                            {(incident.reporter || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="zenith-customer-info">
                            <div className="zenith-customer-name">{incident.reporter || 'Unknown User'}</div>
                            <div className="zenith-customer-email">{incident.title || 'Untitled Post'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="zenith-product-cell">
                        {displayLocation}
                      </td>
                      <td>
                        <span className={`zenith-status-badge ${statusClass}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="zenith-date-cell">
                        {new Date(incident.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="zenith-actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button className="zenith-actions-btn">
                          <Activity size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && resolveTarget && (
        <div className="resolve-modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="resolve-modal" onClick={e => e.stopPropagation()}>
            <div className="resolve-modal-header">
              <h3>Mark as Resolved</h3>
              <button className="resolve-modal-close" onClick={() => setShowResolveModal(false)}><X size={20} /></button>
            </div>
            <p className="resolve-modal-subtitle">Resolving: <strong>{resolveTarget.title}</strong></p>

            <div className="resolve-option">
              <label><FileText size={16} /> Add Update</label>
              <textarea
                placeholder="Describe what was done to resolve this incident..."
                value={resolveText}
                onChange={e => setResolveText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="resolve-option">
              <label><Upload size={16} /> Upload Proof (optional)</label>
              <div className="proof-upload-area" onClick={() => proofInputRef.current?.click()}>
                {resolveProofPreview ? (
                  <img src={resolveProofPreview} alt="Proof preview" className="proof-preview-img" />
                ) : (
                  <span>Click to upload resolve proof image</span>
                )}
              </div>
              <input
                ref={proofInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProofFileChange}
              />
            </div>

            <div className="resolve-modal-actions">
              <button className="btn-cancel" onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button className="btn-resolve-confirm" onClick={handleResolve} disabled={saving}>
                {saving ? 'Resolving...' : 'Confirm Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportDetailModal
        report={selectedIncident}
        isOpen={showModal}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setShowModal(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onStartAction={handleStartAction}
        onMarkResolved={handleDirectResolve}
        onMarkDuplicate={handleMarkDuplicate}
        onRevertPending={(id) => handleRevertStatus(id, 'pending')}
        onDeleteReport={handleDelete}
        onSaveNote={handleSaveNote}
        onAssignResponder={handleLocalAssignResponder}
        loading={saving}
      />
    </div>
    </>
  );
};

export default IncidentModeration;
