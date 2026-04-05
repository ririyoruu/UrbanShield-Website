import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database service functions for admin operations
export const adminService = {
  // Global search across multiple tables
  async globalSearch(query) {
    if (!query || query.trim().length < 2) return { incidents: [], profiles: [] };
    const q = query.trim();

    try {
      // 1. Search incidents (posts)
      const { data: incidents, error: incError } = await supabase
        .from('incidents')
        .select('id, title, address, status, category, severity')
        .or(`title.ilike.%${q}%,address.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5);

      if (incError) console.error('Global search (incidents) error:', incError);

      // 2. Search profiles (users/staff)
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, email, user_type, verification_status')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(5);

      if (profError) console.error('Global search (profiles) error:', profError);

      return {
        incidents: incidents || [],
        profiles: profiles || []
      };
    } catch (err) {
      console.error('CRITICAL SEARCH ERROR:', err);
      return { incidents: [], profiles: [] };
    }
  },

  // Reports CRUD operations
  async getAllReports() {
    try {
      console.log('Fetching all incidents from database...');
      // Only select columns that actually exist - use * to get all columns from incidents table
      // Then join with profiles to get reporter name
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          reporter:reporter_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process location data
      const processedData = (data || []).map(incident => {
        const processed = { ...incident };

        // Log ALL fields to find where coordinates live
        console.log(`📍 Incident ${incident.id} raw fields:`, {
          location: incident.location,
          location_type: typeof incident.location,
          latitude: incident.latitude,
          longitude: incident.longitude,
          coordinates: incident.coordinates,
          address: incident.address,
          city: incident.city,
          all_keys: Object.keys(incident)
        });

        // Extract coordinates from PostGIS geography if available
        if (incident.location && typeof incident.location === 'string') {
          console.log(`🔍 Parsing location for ${incident.id}:`, incident.location);
          const coords = this.parsePostGISLocation(incident.location);
          if (coords) {
            processed.latitude = coords.lat;
            processed.longitude = coords.lng;
            console.log(`✅ Parsed coords for ${incident.id}: lat=${coords.lat}, lng=${coords.lng}`);
          } else {
            console.warn(`⚠️ Could not parse location for incident ${incident.id}:`, incident.location.substring(0, 60));
          }
        }

        return processed;
      });

      // Log all incidents
      console.log(`✅ Successfully fetched ${processedData?.length || 0} incidents from database`);
      if (processedData && processedData.length > 0) {
        console.log('=== INCIDENTS FETCHED ===');
        processedData.forEach((report, idx) => {
          console.log(`\n📋 Incident ${idx + 1} (ID: ${report.id}):`);
          console.log(`   Title: ${report.title || 'No title'}`);
          console.log(`   Location: ${report.location || 'No location'}`);
          console.log(`   Category: ${report.category || report.type || 'N/A'}`);
          console.log(`   Severity: ${report.severity || report.priority || 'N/A'}`);
          console.log(`   Status: ${report.status || 'N/A'}`);
          console.log(`   Created: ${report.created_at || 'N/A'}`);
          // Log extracted coordinates
          if (report.latitude !== undefined) console.log(`   Latitude: ${report.latitude}`);
          if (report.longitude !== undefined) console.log(`   Longitude: ${report.longitude}`);
        });
        console.log('=====================================\n');
      } else {
        console.warn('⚠️ No incidents found in database');
      }

      return processedData;
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      throw error;
    }
  },

  async getIncidentById(incidentId) {
    try {
      if (!incidentId) throw new Error('Missing incidentId');
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          reporter:reporter_id (
            full_name
          )
        `)
        .eq('id', incidentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error fetching incident by id:', error);
      throw error;
    }
  },

  async getResponders() {
    try {
      const allUsers = await this.getAllUsers();
      const allowedTypes = new Set([
        'responder'
      ]);
      return (allUsers || [])
        .filter(profile => {
          const userType = (profile.user_type || '').toLowerCase().trim();
          const isAllowedRole = allowedTypes.has(userType);
          const verificationState = (profile.verification_status || '').toLowerCase().trim();
          const isVerified = profile.is_verified === true || verificationState === 'verified';
          return isAllowedRole && isVerified;
        })
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } catch (error) {
      console.error('Error fetching responders:', error);
      return [];
    }
  },

  // Helper: parse PostGIS WKB hex or WKT → {lat, lng}
  parsePostGISLocation(hex) {
    try {
      if (!hex || typeof hex !== 'string') return null;

      // Handle WKT (Well-known Text) format: POINT(lng lat)
      if (hex.startsWith('POINT(')) {
        const match = hex.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
          const x = parseFloat(match[1]); // Longitude
          const y = parseFloat(match[2]); // Latitude
          // Philippines bounds check for auto-correction (~4-21 lat, ~116-127 lng)
          if (y >= 4 && y <= 21 && x >= 116 && x <= 127) return { lat: y, lng: x };
          if (x >= 4 && x <= 21 && y >= 116 && y <= 127) return { lat: x, lng: y };
          return { lat: y, lng: x };
        }
      }

      const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
      let offset = -1;
      if (clean.startsWith('0101000020E6100000')) offset = 18;      // geography SRID 4326 (fixed offset)
      else if (clean.startsWith('0101000000')) offset = 10;          // geometry
      if (offset < 0 || clean.length < offset + 32) return null;

      const readLE = (h) => {
        const buf = new ArrayBuffer(8);
        const dv = new DataView(buf);
        for (let i = 0; i < 8; i++) {
          dv.setUint8(i, parseInt(h.substring(i * 2, i * 2 + 2), 16));
        }
        return dv.getFloat64(0, true);
      };

      const x = readLE(clean.substring(offset, offset + 16));
      const y = readLE(clean.substring(offset + 16, offset + 32));

      if (y >= -90 && y <= 90 && x >= -180 && x <= 180) {
        if (y >= 4 && y <= 21 && x >= 116 && x <= 127) return { lat: y, lng: x };
        if (x >= 4 && x <= 21 && y >= 116 && y <= 127) return { lat: x, lng: y };
        return { lat: y, lng: x };
      }
    } catch (e) {
      console.error('PostGIS parse error:', e);
    }
    return null;
  },

  // Announcements CRUD operations
  async getAllAnnouncements() {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Log success for debugging
      console.log(`✅ Loaded ${data?.length || 0} announcements`);

      // Normalize data and handle potential missing author data safely
      return (data || []).map(ann => ({
        ...ann,
        alert_level: ann.alert_level || 'info',
        alert_type: ann.alert_type || '',
        areas: ann.areas || '',
        action_items: ann.action_items || [],
        author_name: ann.author_name || 'System Administrator',
        author_department: ann.author_department || 'UrbanShield Hub'
      }));
    } catch (error) {
      console.error('❌ Error fetching announcements:', error);
      throw error;
    }
  },

  async createAnnouncement(announcement) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 📝 STAGE 1: Minimal Payload FIRST (Guarantees success)
      const payload = {
        title: announcement.title,
        content: announcement.content,
        alert_level: announcement.alert_level || 'info',
        alert_type: announcement.alert_type || null,
        user_id: user?.id,
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add advanced fields ONLY if the table has been migrated (Safely handled by try-catch below)
      if (announcement.areas) payload.areas = announcement.areas;
      if (announcement.action_items) payload.action_items = announcement.action_items.filter(i => i.trim());

      const { data, error } = await supabase
        .from('announcements')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('⚠️ Advanced insert failed, retrying with minimal payload...', error.message);
        // RETRY with ONLY the columns you provided in your SQL: title/content/alert_level
        const { data: retryData, error: retryError } = await supabase
          .from('announcements')
          .insert([{
            title: announcement.title,
            content: announcement.content,
            alert_level: announcement.alert_level || 'info',
          }])
          .select()
          .single();

        if (retryError) {
          console.error('📋 RETRY FAILED:', retryError.message);
          throw retryError;
        }
        return { success: true, data: retryData };
      }

      console.log('✅ Announcement saved, now broadcasting notifications...');

      // 📣 DECOUPLED BROADCAST (Everyone—Responders, Admins, Residents—gets the alert)
      try {
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id');

        if (allUsers && allUsers.length > 0) {
          const alertEmoji = {
            critical: '🔴', warning: '🟡', info: '🔵', notice: '⚫'
          }[announcement.alert_level] || '📢';

          const notificationEntries = allUsers.map(user => ({
            user_id: user.id,
            type: 'announcement',
            title: `${alertEmoji} ${announcement.title}`,
            message: announcement.content,
            incident_id: null,
            is_read: false,
            created_at: new Date().toISOString()
          }));

          // Batch insert notifications (handle in chunks of 500 if needed)
          await supabase.from('notifications').insert(notificationEntries);
          console.log(`📣 Dispatched ${notificationEntries.length} notifications to residents.`);
        }
      } catch (broadcastError) {
        console.warn('⚠️ Announcement saved, but notification broadcast failed:', broadcastError.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      throw error;
    }
  },

  async updateAnnouncement(id, announcement) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update({
          title: announcement.title,
          content: announcement.content,
          alert_level: announcement.alert_level || 'info',
          alert_type: announcement.alert_type || null,
          areas: announcement.areas || null,
          action_items: announcement.action_items?.filter(i => i.trim()) || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Announcement Update Details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      return data;
    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      throw error;
    }
  },

  async deleteAnnouncement(id) {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      throw error;
    }
  },

  async getReportsByStatus(status) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          reporter:reporter_id (
            full_name
          )
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching reports by status:', error);
      throw error;
    }
  },

  async updateReportStatus(reportId, status) {
    console.log('📡 Standardized Status Update:', { reportId, status });
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      // Ensure assignment state is cleared on revert
      if (status === 'open') {
        updateData.status_updated_by = null;
        updateData.status_updated_by_name = null;
        updateData.dispatched_departments = [];
        updateData.assigned_responders = [];
      }

      const { data, error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      // 📣 SILENT NOTIFICATION: Notify Reporter
      try {
        const { data: reportMeta } = await supabase.from('incidents').select('reporter_id').eq('id', reportId).single();

        // 📜 Handle Activity Log (Reset slate if reverting)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (status === 'open') {
          console.log(`🧹 Clearing previous activity logs for incident ${reportId} (REVERT)`);
          await supabase.from('incident_activity_log').delete().eq('incident_id', reportId);
        }

        const adminName = user?.user_metadata?.full_name || user?.email || 'Administrator';

        await supabase.from('incident_activity_log').insert([{
          incident_id: reportId,
          action: status === 'open' ? 'status_change' : (status === 'in_progress' ? 'start_action' : (status === 'resolved' ? 'resolved' : 'status_change')),
          performed_by: user?.id,
          details: {
            new_status: status,
            message: status === 'open' ? `Incident reverted back to open by ${adminName}` : `Status updated to ${status} by ${adminName}`
          }
        }]);

        if (reportMeta?.reporter_id) {
          const config = {
            'in_progress': { type: 'status_update', title: 'Incident In Progress', message: 'Your incident is now being handled' },
            'resolved': { type: 'resolved', title: 'Incident Resolved', message: 'Your incident has been resolved' },
            'open': { type: 'status_update', title: 'Incident Reverted', message: 'Your incident has been moved back to open status' }
          }[status];

          if (config) {
            await supabase.from('notifications').insert([{
              user_id: reportMeta.reporter_id,
              type: config.type,
              title: config.title,
              message: config.message,
              incident_id: reportId,
              is_read: false,
              created_at: new Date().toISOString()
            }]);
          }
        }
      } catch (notifErr) {
        console.warn('⚠️ Notification/Log Engine Skipped:', notifErr.message);
      }

      return { success: true, data };
    } catch (err) {
      console.error('❌ Status update failed:', err);
      throw err;
    }
  },

  async assignResponder(incidentId, responderId, options = {}) {
    console.log('🚀 Executing Specialized Dispatch Phase:', { incidentId, responderId, options });
    try {
      const { additionalResponders = [], departments = [], action_started_at } = options;

      let display = 'Action Started';
      const responderIds = responderId ? [responderId, ...(additionalResponders.map(r => r.id || r))] : [];

      if (responderId) {
        const { data: resp } = await supabase.from('profiles').select('full_name').eq('id', responderId).single();
        display = additionalResponders.length > 0 ? `${resp?.full_name || 'Responder'} + ${additionalResponders.length}` : (resp?.full_name || 'Responder');
      } else if (departments.length > 0) {
        display = `Departments: ${departments.join(', ')}`;
      }

      // 📝 STAGE 1: Commit Incident State
      const { error: updateError } = await supabase
        .from('incidents')
        .update({
          status: 'in_progress',
          status_updated_by: responderId || null,
          status_updated_by_name: display,
          dispatched_departments: departments,
          assigned_responders: responderIds,
          action_started_at: action_started_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (updateError) throw updateError;

      // 📜 LOG ACTION
      await this.addActivityLog(incidentId, 'start_action', { 
        message: `Dispatched ${display} to incident`,
        details: { departments, responders: responderIds } 
      });

      // 📣 SILENT NOTIFICATION: Multi-Responder Assignment Loop
      try {
        const { data: reportMeta } = await supabase.from('incidents').select('reporter_id, title, category').eq('id', incidentId).single();
        if (!reportMeta) throw new Error('Metadata fetch failed');

        const notificationBatch = [];

        // A. Loop through EACH responder
        if (responderIds.length > 0) {
          responderIds.forEach(id => {
            notificationBatch.push({
              user_id: id,
              type: 'assignment',
              title: 'New Assignment',
              message: 'You have been assigned to an incident',
              incident_id: incidentId,
              is_read: false,
              created_at: new Date().toISOString()
            });
          });
        }

        // B. Notify Reporter (In Progress)
        if (reportMeta.reporter_id) {
          notificationBatch.push({
            user_id: reportMeta.reporter_id,
            type: 'status_update',
            title: 'Incident In Progress',
            message: 'Your incident is now being handled',
            incident_id: incidentId,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }

        if (notificationBatch.length > 0) {
          await supabase.from('notifications').insert(notificationBatch);
        }
      } catch (notifErr) {
        console.warn('⚠️ Dispatch notification Engine Skipped:', notifErr.message);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Sequential Dispatch Failure:', error);
      throw error;
    }
  },

  async setIncidentVerified(reportId, isVerified) {
    try {
      console.log('🛡️ Verifying incident:', reportId, isVerified);
      const { error } = await supabase
        .from('incidents')
        .update({
          is_under_review: !isVerified,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error verifying incident:', error);
      throw error;
    }
  },

  async startAction(reportId) {
    // 💡 Reuse the unified logic for consistency
    return this.updateReportStatus(reportId, 'in_progress');
  },

  async resolveIncident(reportId, options = {}) {
    const { updateText, proofUrl } = options;
    console.log('🔄 Resolving incident:', reportId);

    try {
      // 1. Primary Update: This MUST succeed
      const { error: updateError } = await supabase
        .from('incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          admin_notes: updateText || 'Incident resolved.',
          proof_url: proofUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) throw updateError;
      
      // 📜 LOG ACTION
      await this.addActivityLog(reportId, 'resolved', { 
        message: `Incident marked as resolved by Administrator`,
        admin_notes: updateText 
      });

      // 2. Secondary Notification: This can fail silently
      try {
        const { data: incident } = await supabase.from('incidents').select('reporter_id').eq('id', reportId).single();
        if (incident?.reporter_id) {
          await supabase.from('notifications').insert([{
            user_id: incident.reporter_id,
            type: 'resolved',
            title: 'Incident Resolved',
            message: 'Your incident has been resolved',
            incident_id: reportId,
            is_read: false,
            created_at: new Date().toISOString()
          }]);
        }
      } catch (e) {
        console.warn('⚠️ Notification skipped');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Resolve failed:', error);
      throw error;
    }
  },

  async addActivityLog(incidentId, action, details = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('incident_activity_log').insert([{
        incident_id: incidentId,
        action: action,
        performed_by: user?.id,
        details: {
          ...details,
          message: details.message || `Admin action: ${action}`
        }
      }]);
      if (error) throw error;
    } catch (err) {
      console.warn('⚠️ Log entry failed:', err.message);
    }
  },
  async deleteReport(reportId) {
    try {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  async getIncidentActivityLog(incidentId) {
    try {
      const { data, error } = await supabase
        .from('incident_activity_log')
        .select(`
          *,
          performer:profiles(full_name, email)
        `)
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching activity log:', err);
      return [];
    }
  },

  // User Reports (reports about incidents/posts/content)
  async getUserReports() {
    try {
      console.log('Fetching reports from database...');
      // Fetch from 'reports' table - only select columns that exist, no joins if relationship doesn't exist
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching reports:', error);
        // Return empty array instead of throwing - don't show errors to user
        return [];
      }

      // Try to enrich with reporter and incident data separately if needed
      if (data && data.length > 0) {
        // Get unique reporter IDs and incident IDs
        const reporterIds = [...new Set(data.map(r => r.reporter_id).filter(Boolean))];
        const incidentIds = [...new Set(data.map(r => r.incident_id).filter(Boolean))];

        // Fetch reporter names
        let reportersMap = {};
        if (reporterIds.length > 0) {
          try {
            const { data: reporters } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', reporterIds);

            if (reporters) {
              reporters.forEach(r => {
                reportersMap[r.id] = r;
              });
            }
          } catch (e) {
            console.warn('Could not fetch reporter info:', e);
          }
        }

        // Fetch incident details
        let incidentsMap = {};
        if (incidentIds.length > 0) {
          try {
            const { data: incidents } = await supabase
              .from('incidents')
              .select('id, title, description, location, category, severity')
              .in('id', incidentIds);

            if (incidents) {
              incidents.forEach(i => {
                incidentsMap[i.id] = i;
              });
            }
          } catch (e) {
            console.warn('Could not fetch incident info:', e);
          }
        }

        // Enrich reports with fetched data
        const enrichedData = data.map(report => ({
          ...report,
          reporter: reportersMap[report.reporter_id] || null,
          incident: incidentsMap[report.incident_id] || null
        }));

        console.log(`✅ Successfully fetched ${enrichedData.length} reports from database`);
        return enrichedData;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user reports:', error);
      // Return empty array instead of throwing - don't show errors to user
      return [];
    }
  },

  async updateUserReportStatus(reportId, status, adminNotes = null, reviewedBy = null) {
    try {
      const updateData = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      // If resolving or dismissing, set reviewed_at and reviewed_by
      if (status === 'resolved' || status === 'dismissed' || status === 'reviewed') {
        updateData.reviewed_at = new Date().toISOString();
        if (reviewedBy) {
          updateData.reviewed_by = reviewedBy;
        }
      }

      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId)
        .select()
        .single();

      if (error) {
        console.error('Database error updating report status:', error);
        throw error;
      }

      // If resolving, hide the post. If dismissing, unhide the post.
      if (data && data.incident_id) {
        if (status === 'resolved') {
          await this.hideIncident(data.incident_id);
        } else if (status === 'dismissed') {
          await this.unhideIncident(data.incident_id);
        }
      }

      return data;
    } catch (error) {
      console.error('Error updating user report status:', error);
      throw error;
    }
  },

  async hideIncident(incidentId) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .update({ is_flagged: true, updated_at: new Date().toISOString() })
        .eq('id', incidentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error hiding incident:', error);
      throw error;
    }
  },

  async unhideIncident(incidentId) {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .update({ is_flagged: false, updated_at: new Date().toISOString() })
        .eq('id', incidentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error unhiding incident:', error);
      throw error;
    }
  },

  async resetAllReportsToPending() {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .update({
          is_verified: null,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resetting reports to pending:', error);
      throw error;
    }
  },

  // Analytics functions
  async getAnalyticsData() {
    try {
      console.log('Fetching analytics data...');

      // Get monthly incident data for the last 6 months
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('incidents')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

      if (monthlyError) {
        console.error('Monthly data error:', monthlyError);
        throw monthlyError;
      }

      console.log('Monthly data fetched:', monthlyData?.length || 0, 'records');

      // Get incident category distribution - show all reports
      // Focus on category field for incident types
      const { data: typeData, error: typeError } = await supabase
        .from('incidents')
        .select('category');

      if (typeError) {
        console.error('Type data error:', typeError);
        throw typeError;
      }

      console.log('Type data fetched:', typeData?.length || 0, 'records');
      console.log('Sample type data:', typeData?.slice(0, 3));

      // Process monthly data
      const monthlyStats = this.processMonthlyData(monthlyData || []);
      console.log('Processed monthly stats:', monthlyStats);

      // Process type distribution
      const typeDistribution = this.processTypeDistribution(typeData || []);
      console.log('Processed type distribution:', typeDistribution);

      return {
        monthlyStats,
        typeDistribution
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  },

  async getResponseTimeAnalytics() {
    try {
      console.log('Fetching response time analytics...');

      // Get all incidents that have been resolved
      const { data: incidents, error } = await supabase
        .from('incidents')
        .select('created_at, updated_at, resolved_at, status')
        .eq('status', 'resolved');

      if (error) {
        console.error('Response time data error:', error);
        throw error;
      }

      console.log('Response time data fetched:', incidents?.length || 0, 'records');

      if (!incidents || incidents.length === 0) {
        return {
          averageResponseTime: 0,
          fastestResponse: 0,
          resolutionRate: 0
        };
      }

      // Calculate response times in minutes using resolved_at
      const responseTimes = incidents
        .map(incident => {
          const created = new Date(incident.created_at);
          const resolved = incident.resolved_at ? new Date(incident.resolved_at) :
            incident.updated_at ? new Date(incident.updated_at) : null;

          if (!resolved) return null;

          const diffMs = resolved - created;
          return diffMs / (1000 * 60); // Convert to minutes
        })
        .filter(time => time !== null && time >= 0);

      if (responseTimes.length === 0) {
        return {
          averageResponseTime: 0,
          fastestResponse: 0,
          resolutionRate: 0
        };
      }

      // Calculate metrics
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const fastestResponse = Math.min(...responseTimes);

      // Resolution rate is 100% since we only fetch resolved incidents
      const resolutionRate = 100;

      return {
        averageResponseTime: Math.round(averageResponseTime * 10) / 10, // Round to 1 decimal
        fastestResponse: Math.round(fastestResponse * 10) / 10,
        resolutionRate: Math.round(resolutionRate * 10) / 10
      };
    } catch (error) {
      console.error('Error fetching response time analytics:', error);
      // Return defaults on error
      return {
        averageResponseTime: 0,
        fastestResponse: 0,
        resolutionRate: 0
      };
    }
  },

  processMonthlyData(data) {
    console.log('Processing monthly data:', data);

    // Build the last 6 months labels dynamically ending with current month
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // e.g., 2024-10
      buckets.push({
        key,
        name: d.toLocaleString(undefined, { month: 'short' }),
        incidents: 0,
        resolved: 0
      });
    }

    console.log('Created buckets:', buckets);

    const bucketIndexByKey = new Map(buckets.map((b, idx) => [b.key, idx]));

    data.forEach(report => {
      console.log('Processing report:', report);
      const date = new Date(report.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      console.log('Report date key:', key);
      const idx = bucketIndexByKey.get(key);
      console.log('Bucket index:', idx);
      if (idx !== undefined) {
        buckets[idx].incidents++;
        if (report.status === 'resolved') {
          buckets[idx].resolved++;
        }
        console.log('Updated bucket:', buckets[idx]);
      }
    });

    const result = buckets.map(({ name, incidents, resolved }) => ({ name, incidents, resolved }));
    console.log('Final monthly data result:', result);
    return result;
  },

  processTypeDistribution(data) {
    console.log('Processing type distribution data:', data);

    // Count incidents per type; normalize empty values
    const typeCount = {};
    data.forEach(report => {
      console.log('Processing report for type distribution:', report);

      // Use category field specifically for incident types
      const categoryValue = report.category;

      console.log('Category value found:', categoryValue);

      const key = (categoryValue && String(categoryValue).trim()) || 'Uncategorized';
      console.log('Using key:', key);

      typeCount[key] = (typeCount[key] || 0) + 1;
      console.log('Type count updated:', typeCount);
    });

    // Bright, high-contrast palette for dark theme (cycles if > palette length)
    const palette = [
      '#ef4444', // red
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#a855f7', // purple
      '#eab308', // yellow
      '#06b6d4', // cyan
      '#fb7185'  // rose
    ];

    const entries = Object.entries(typeCount);
    console.log('Type distribution entries:', entries);

    if (entries.length === 0) {
      console.log('No type distribution entries found, returning empty array');
      return [];
    }

    const result = entries.map(([type, count], idx) => ({
      name: type,
      value: count,
      color: palette[idx % palette.length]
    }));

    console.log('Final type distribution result:', result);
    return result;
  },
  async getDashboardStats() {
    try {
      // Get total reports count
      const { data: totalData, error: totalError } = await supabase
        .from('incidents')
        .select('id, status, created_at, updated_at, reporter_id');

      if (totalError) throw totalError;

      const totalReports = totalData?.length || 0;

      // Open reports (status = 'open')
      const { data: openData, error: openError } = await supabase
        .from('incidents')
        .select('id')
        .eq('status', 'open');

      const openReports = openError ? 0 : (openData?.length || 0);

      // Resolved today (status = 'resolved' and resolved_at today)
      const today = new Date().toISOString().split('T')[0];
      const { data: resolvedData, error: resolvedError } = await supabase
        .from('incidents')
        .select('id')
        .eq('status', 'resolved')
        .gte('resolved_at', today);

      const resolvedToday = resolvedError ? 0 : (resolvedData?.length || 0);

      // Active users = total number of users in the system
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      const activeUsers = usersError ? 0 : (usersData?.length || 0);

      // Pending users for verification
      const { data: pendingUsersData, error: pendingUsersError } = await supabase
        .from('profiles')
        .select('id')
        .or('verification_status.is.null,verification_status.eq.pending')
        .neq('user_type', 'admin');

      const pendingUsers = pendingUsersError ? 0 : (pendingUsersData?.length || 0);

      return {
        totalReports,
        openReports,
        resolvedToday,
        activeUsers,
        pendingUsers
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to zeros so UI still renders
      return {
        totalReports: 0,
        openReports: 0,
        resolvedToday: 0,
        activeUsers: 0
      };
    }
  },

  // Public statistics (no auth required)
  async getPublicStats() {
    try {
      // Get total reports count
      const { data: incidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('id, status, created_at, updated_at');

      if (incidentsError) throw incidentsError;

      const incidentsData = Array.isArray(incidents) ? incidents : [];

      // Total reports filed
      const totalReports = incidentsData.length;

      // Issues resolved (status = 'resolved')
      const resolvedReports = incidentsData.filter(i => i.status === 'resolved').length;

      // Active users count
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      const activeUsers = usersError ? 0 : (usersData?.length || 0);

      // Average response time (calculate from resolved incidents using resolved_at)
      const resolvedIncidents = incidentsData.filter(i =>
        i.status === 'resolved' && i.resolved_at && i.created_at
      );

      let avgResponseTime = 0;
      if (resolvedIncidents.length > 0) {
        const responseTimes = resolvedIncidents.map(incident => {
          const created = new Date(incident.created_at);
          const resolved = new Date(incident.resolved_at);
          const diffMs = resolved - created;
          return diffMs / (1000 * 60); // Convert to minutes
        }).filter(time => time >= 0);

        if (responseTimes.length > 0) {
          const sum = responseTimes.reduce((a, b) => a + b, 0);
          avgResponseTime = Math.round((sum / responseTimes.length) * 10) / 10;
        }
      }

      return {
        totalReports,
        resolvedReports,
        activeUsers,
        avgResponseTime
      };
    } catch (error) {
      console.error('Error fetching public stats:', error);
      return {
        totalReports: 0,
        resolvedReports: 0,
        activeUsers: 0,
        avgResponseTime: 0
      };
    }
  },

  // Real-time subscriptions
  subscribeToReports(callback) {
    return supabase
      .channel('incidents-updates')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents'
        },
        (payload) => {
          console.log('🔄 Real-time incident update:', {
            event: payload.eventType,
            table: payload.table,
            id: payload.new?.id || payload.old?.id,
            timestamp: new Date().toISOString()
          });

          // Transform Supabase payload to our expected format
          const transformedPayload = {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table,
            schema: payload.schema,
            timestamp: new Date().toISOString()
          };
          callback(transformedPayload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for incidents');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
          callback({ eventType: 'CONNECTION_ERROR', error: 'Connection failed' });
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Real-time subscription timed out');
          callback({ eventType: 'CONNECTION_ERROR', error: 'Connection timed out' });
        }
      });
  },

  // Subscribe to user reports for content moderation
  subscribeToUserReports(callback) {
    return supabase
      .channel('user-reports')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          console.log('🔄 Real-time user report update:', {
            event: payload.eventType,
            table: payload.table,
            id: payload.new?.id || payload.old?.id,
            timestamp: new Date().toISOString()
          });

          const transformedPayload = {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table,
            schema: payload.schema,
            timestamp: new Date().toISOString()
          };
          callback(transformedPayload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for user reports');
        }
      });
  },

  // Subscribe to profiles for user management
  subscribeToProfiles(callback) {
    return supabase
      .channel('profile-updates')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔄 Real-time profile update:', {
            event: payload.eventType,
            table: payload.table,
            id: payload.new?.id || payload.old?.id,
            timestamp: new Date().toISOString()
          });

          const transformedPayload = {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table,
            schema: payload.schema,
            timestamp: new Date().toISOString()
          };
          callback(transformedPayload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for profiles');
        }
      });
  },

  // User Management Functions
  async getAllUsers() {
    try {
      console.log('Fetching users from profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Users fetch result:', { data, error });

      if (data && data.length > 0) {
        console.log('🔍 Profile columns found:', Object.keys(data[0]));
        console.log('🔍 Sample user data:', data[0]);
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async deleteUsers(userIds) {
    try {
      if (!userIds || !userIds.length) return { error: 'No user IDs provided' };
      console.log('🗑️ Requesting total deletion of users:', userIds);

      // Use count: 'exact' to see how many were actually deleted
      const { error, count } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .in('id', userIds);

      if (error) throw error;

      // 2. Clear Auth Access via Edge Function
      try {
        console.log('🛡️ Safeguarding: Clearing Auth access for deleted users...');
        await supabase.functions.invoke('delete-user', {
          body: { userIds }
        });
      } catch (authError) {
        // We log but don't fail, as the profile is already gone. 
        // This prevents the UI from thinking the delete failed if only the auth cleanup glitched.
        console.warn('⚠️ Profile deleted, but Auth cleanup failed:', authError);
      }

      return { success: true, count };
    } catch (error) {
      console.error('❌ Error deleting users:', error);
      throw error;
    }
  },

  async updateUserVerification(userId, isVerified, verificationStatus = null) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Determine verification_status based on isVerified if not explicitly provided
      // Database accepts: 'pending', 'verified', 'rejected', 'suspended'
      let status = verificationStatus;
      if (!status) {
        status = isVerified ? 'verified' : 'pending';
      }

      // Update both is_verified (boolean) and verification_status (text)
      const updateData = {
        is_verified: isVerified,
        verification_status: status,
        updated_at: new Date().toISOString()
      };

      console.log('Updating user verification:', { userId, updateData });

      // Update profiles table
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)


      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error updating user verification:', error);
      throw error;
    }
  },

  // Admin Profile Management Functions
  async getAdminProfile(adminId) {
    try {
      console.log('Fetching admin profile for:', adminId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching admin profile:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      throw error;
    }
  },

  async updateAdminProfile(adminId, profileData) {
    try {
      console.log('Updating admin profile:', { adminId, profileData });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select()
        .single();

      if (error) throw error;
      console.log('Admin profile updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  },

  async updateUserProfile(userId, profileData) {
    try {
      console.log('Updating user profile:', { userId, profileData });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      console.log('User profile updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async updateUserEmailInAllTables(userId, newEmail, otherData = {}) {
    try {
      console.log('Updating user email:', { userId, newEmail, otherData });

      // Get current email before updating
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      const oldEmail = currentProfile?.email;

      // Prepare data for profiles table (all-in-one source of truth)
      const profileUpdateData = {
        email: newEmail,
        full_name: otherData.full_name,
        phone: otherData.phone_number,
        department: otherData.department,
        position: otherData.position,
        updated_at: new Date().toISOString()
      };

      // Update in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        console.error('Error updating profiles table:', profileError);
        throw profileError;
      }

      // Log the email change for security purposes
      if (oldEmail && oldEmail !== newEmail) {
        console.log(`Email changed for user ${userId}: ${oldEmail} -> ${newEmail}`);
      }

      console.log('User info updated successfully in profiles table');
      return { profileData, adminData: profileData }; // adminData is now the same as profileData
    } catch (error) {
      console.error('Error updating user info:', error);
      throw error;
    }
  },

  async validateEmailForLogin(email) {
    try {
      // Check if email exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type')
        .eq('email', email)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        return {
          isValid: false,
          error: 'Email address not found. Please use your current email address.'
        };
      }

      if (profileError) {
        return {
          isValid: false,
          error: 'Unable to verify email address. Please try again.'
        };
      }

      return {
        isValid: true,
        profile: profileData
      };
    } catch (error) {
      console.error('Email validation error:', error);
      return {
        isValid: false,
        error: 'Email validation failed. Please try again.'
      };
    }
  },


  async uploadAvatar(adminId, formData) {
    try {
      console.log('Uploading avatar for user:', adminId);
      const file = formData.get('avatar');
      const fileName = `user-${adminId}-${Date.now()}.${file.name.split('.').pop()}`;
      const avatarUrl = `https://example.com/avatars/${fileName}`;

      // Update the profile directly
      await this.updateUserProfile(adminId, { avatar_url: avatarUrl });

      return {
        success: true,
        url: avatarUrl,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  async updateSecuritySettings(adminId, settings) {
    try {
      console.log('Updating security settings for user:', adminId, settings);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          security: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select()
        .single();

      if (error) throw error;
      console.log('Security settings updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  async toggleTwoFactor(adminId, enabled) {
    try {
      console.log('Toggling two-factor for user:', adminId, enabled);

      // Get current security settings
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('security')
        .eq('id', adminId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const currentSecurity = profile?.security || {};
      const updatedSecurity = {
        ...currentSecurity,
        two_factor_enabled: enabled
      };

      const { data, error } = await supabase
        .from('profiles')
        .update({
          security: updatedSecurity,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select()
        .single();

      if (error) throw error;
      console.log('Two-factor toggled successfully:', data);
      return data;
    } catch (error) {
      console.error('Error toggling two-factor:', error);
      throw error;
    }
  }

};

// Invitation code service functions
export const invitationService = {
  // Generate a new invitation code
  async generateInvitationCode(createdBy, invitedEmail = null, expiresInHours = 24) {
    try {
      // Generate a random 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const { data, error } = await supabase
        .from('invitation_codes')
        .insert({
          code,
          created_by: createdBy,
          invited_email: invitedEmail,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating invitation code:', error);
      throw error;
    }
  },

  // Validate and use an invitation code
  async validateAndUseInvitationCode(code, usedBy) {
    try {
      // First, check if code exists and is valid
      const { data: invitation, error: fetchError } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invalid or expired invitation code');
      }

      // Mark the code as used
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('invitation_codes')
        .update({
          is_used: true,
          used_by: usedBy,
          used_at: new Date().toISOString()
        })
        .eq('id', invitation.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedInvitation;
    } catch (error) {
      console.error('Error validating invitation code:', error);
      throw error;
    }
  },

  // Get all invitation codes created by an admin
  async getInvitationsByAdmin(adminId) {
    try {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .eq('created_by', adminId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  },

  // Settings Functions
  getSystemSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        id: null,
        site_name: 'UrbanShield',
        site_description: 'Urban Safety Management System',
        maintenance_mode: false,
        max_file_size: 10485760, // 10MB
        allowed_file_types: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
        notification_email: 'admin@urbanshield.com',
        auto_approve_threshold: 0.8,
        incident_retention_days: 365,
        map_center_lat: 9.6500,
        map_center_lng: 123.8600,
        map_zoom_level: 12,
        theme_color: '#ef4444',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  },

  updateSystemSettings: async (settings) => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  },

  getNotificationSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        id: null,
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        incident_alerts: true,
        system_alerts: true,
        weekly_reports: true,
        admin_notifications: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  updateNotificationSettings: async (settings) => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  getSecuritySettings: async () => {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        id: null,
        require_invitation_codes: true,
        invitation_code_expiry_hours: 168, // 7 days
        max_login_attempts: 5,
        lockout_duration_minutes: 30,
        password_min_length: 8,
        require_special_chars: true,
        session_timeout_hours: 24,
        two_factor_auth: false,
        ip_whitelist: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching security settings:', error);
      throw error;
    }
  },

  updateSecuritySettings: async (settings) => {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  // Admin Settings Functions
  getAdminSettings: async () => {
    try {
      console.log('Fetching admin settings...');
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      console.log('Settings query result:', { data, error });

      if (error) {
        console.error('Settings query error:', error);
        // Return empty object instead of throwing error
        return {};
      }

      // Convert array to object for easier use
      const settings = {};
      if (data && data.length > 0) {
        data.forEach(setting => {
          let value = setting.setting_value;

          // Try to convert based on value content
          if (value === 'true' || value === 'false') {
            value = value === 'true';
          } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
            value = parseFloat(value);
          }

          settings[setting.setting_key] = value;
        });
      }

      console.log('Processed settings:', settings);
      return settings;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      // Return empty object instead of throwing error
      return {};
    }
  },

  updateAdminSettings: async (settings) => {
    try {
      console.log('Updating admin settings:', settings);

      const updates = Object.entries(settings).map(([key, value]) => {
        let settingValue = value;

        // Convert value to string for storage
        if (typeof value === 'boolean') {
          settingValue = value.toString();
        } else if (typeof value === 'number') {
          settingValue = value.toString();
        } else if (typeof value === 'object') {
          settingValue = JSON.stringify(value);
        }

        return {
          setting_key: key,
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        };
      });

      console.log('Settings updates to apply:', updates);

      const { data, error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'setting_key' })


      console.log('Update result:', { data, error });

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  }
};

export default supabase;

