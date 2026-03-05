import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database service functions for admin operations
export const adminService = {
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

  // Helper: parse PostGIS WKB hex → {lat, lng}
  parsePostGISLocation(hex) {
    try {
      if (!hex || typeof hex !== 'string') return null;
      const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
      
      // Determine offset based on WKB header
      let offset = -1;
      if (clean.startsWith('0101000020E6100000')) offset = 18;      // geography SRID 4326 (fixed offset)
      else if (clean.startsWith('0101000000')) offset = 10;          // geometry
      if (offset < 0 || clean.length < offset + 32) return null;
      
      // Read little-endian IEEE 754 double from hex (16 chars = 8 bytes)
      const readLE = (h) => {
        const buf = new ArrayBuffer(8);
        const dv = new DataView(buf);
        for (let i = 0; i < 8; i++) {
          dv.setUint8(i, parseInt(h.substring(i * 2, i * 2 + 2), 16));
        }
        return dv.getFloat64(0, true);
      };
      
      // WKB Point stores X (longitude) first, then Y (latitude)
      const x = readLE(clean.substring(offset, offset + 16));
      const y = readLE(clean.substring(offset + 16, offset + 32));
      
      // x = longitude, y = latitude in standard WKB
      // Validate and return
      if (y >= -90 && y <= 90 && x >= -180 && x <= 180) {
        return { lat: y, lng: x };
      }
      // Sometimes stored as lat,lng instead of lng,lat — try swapped
      if (x >= -90 && x <= 90 && y >= -180 && y <= 180) {
        return { lat: x, lng: y };
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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching announcements:', error);
      throw error;
    }
  },

  async createAnnouncement(announcement) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title: announcement.title,
          description: announcement.description,
          content: announcement.content,
          target_audience: announcement.target_audience,
          priority: announcement.priority,
          expiration_date: announcement.expiration_date || null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
          description: announcement.description,
          content: announcement.content,
          target_audience: announcement.target_audience,
          priority: announcement.priority,
          expiration_date: announcement.expiration_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
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

  async updateReportStatus(reportId, status, adminNotes = null) {
    try {
      // Only update fields that actually exist in the incidents table
      const updateData = { 
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }
      
      const { data, error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', reportId)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  },

  async startAction(reportId) {
    try {
      const updateData = {
        status: 'in_action',
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', reportId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error starting action:', error);
      throw error;
    }
  },

  async resolveIncident(reportId, { updateText, proofUrl } = {}) {
    try {
      const updateData = {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (updateText) updateData.admin_notes = updateText;
      if (proofUrl) updateData.proof_url = proofUrl;

      const { data, error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', reportId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error resolving incident:', error);
      throw error;
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
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating user report status:', error);
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
      
      // Pending reports (status = 'pending')
      const { data: pendingData, error: pendingError } = await supabase
        .from('incidents')
        .select('id')
        .eq('status', 'pending');
      
      const pendingReports = pendingError ? 0 : (pendingData?.length || 0);

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
        .select('id', { count: 'exact' });
      
      const activeUsers = usersError ? 0 : (usersData?.length || 0);

      return {
        totalReports,
        pendingReports,
        resolvedToday,
        activeUsers
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to zeros so UI still renders
      return {
        totalReports: 0,
        pendingReports: 0,
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
      .channel('incidents')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'incidents' 
        }, 
        (payload) => {
          console.log('Supabase real-time payload:', payload);
          // Transform Supabase payload to our expected format
          const transformedPayload = {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table,
            schema: payload.schema
          };
          callback(transformedPayload);
        }
      )
      .subscribe();
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
        .select();
      
      if (error) throw error;
      
      console.log('✅ User verification updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating user verification:', error);
      throw error;
      console.error('Error updating user verification:', error);
      // Re-throw with more context
      if (error.message) {
        throw error;
      }
      throw new Error(`Failed to update user verification: ${error.message || 'Unknown error'}`);
    }
  },

  // Admin Profile Management Functions
  async getAdminProfile(adminId) {
    try {
      console.log('Fetching admin profile for:', adminId);
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('admin_id', adminId)
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
        .from('admin_profiles')
        .upsert({
          admin_id: adminId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
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
      console.log('Updating email across all tables:', { userId, newEmail, otherData });
      
      // Get current email before updating
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      const oldEmail = currentProfile?.email;
      
      // Prepare data for profiles table (only basic fields)
      const profileUpdateData = {
        email: newEmail,
        full_name: otherData.full_name,
        phone_number: otherData.phone_number,
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
      
      // Prepare data for admin_profiles table (includes department and position)
      const adminUpdateData = {
        email: newEmail,
        full_name: otherData.full_name,
        phone: otherData.phone_number,
        department: otherData.department,
        position: otherData.position,
        updated_at: new Date().toISOString()
      };
      
      // Update in admin_profiles table if it exists
      const { data: adminData, error: adminError } = await supabase
        .from('admin_profiles')
        .upsert({
          admin_id: userId,
          ...adminUpdateData
        })
        .select()
        .single();
      
      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Error updating admin_profiles table:', adminError);
        // Don't throw error here as admin_profiles might not exist for all users
      }
      
      // Log the email change for security purposes
      if (oldEmail && oldEmail !== newEmail) {
        console.log(`Email changed for user ${userId}: ${oldEmail} -> ${newEmail}`);
        // You could also store this in a separate audit log table if needed
      }
      
      console.log('Email updated successfully in all tables');
      return { profileData, adminData };
    } catch (error) {
      console.error('Error updating email in all tables:', error);
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
      console.log('Uploading avatar for admin:', adminId);
      
      // For now, we'll simulate the upload process
      // In a real implementation, you would upload to Supabase Storage
      const file = formData.get('avatar');
      const fileName = `admin-${adminId}-${Date.now()}.${file.name.split('.').pop()}`;
      
      // Simulate upload success
      const avatarUrl = `https://example.com/avatars/${fileName}`;
      
      // Update the profile with the new avatar URL
      await this.updateAdminProfile(adminId, { avatar_url: avatarUrl });
      
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
      console.log('Updating security settings for admin:', adminId, settings);
      
      const { data, error } = await supabase
        .from('admin_profiles')
        .update({
          security: settings,
          updated_at: new Date().toISOString()
        })
        .eq('admin_id', adminId)
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
      console.log('Toggling two-factor for admin:', adminId, enabled);
      
      // Get current security settings
      const { data: profile, error: fetchError } = await supabase
        .from('admin_profiles')
        .select('security')
        .eq('admin_id', adminId)
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
        .from('admin_profiles')
        .upsert({
          admin_id: adminId,
          security: updatedSecurity,
          updated_at: new Date().toISOString()
        })
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
        .from('invitation_codes')
        .select(`
          *,
          used_by_profile:profiles!invitation_codes_used_by_fkey(full_name, email)
        `)
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
        .select();
      
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

