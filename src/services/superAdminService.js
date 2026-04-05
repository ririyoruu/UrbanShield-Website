import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

// Extract the URL and Key to create a secondary 'creation' client
// This prevents the Super Admin session from being hijacked/logged out when creating a new user
const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const creationClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

/**
 * Super Admin Service
 * Handles all super admin operations including admin management, 
 * system settings, and audit logs
 */

export const superAdminService = {
  // ============================================
  // Admin Management
  // ============================================

  /**
   * Get all admin users (admins and super_admins)
   */
  async getAllAdmins() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_type', ['admin', 'super_admin'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },

  /**
   * Create a new staff member (admin or responder)
   */
  async createStaff(staffData) {
    try {
      const { 
        email, 
        password, 
        full_name, 
        user_type, 
        username, 
        phone, 
        department 
      } = staffData;

      // 1. Create auth user using the creation client (not the main one)
      // This prevents the session from switching to the new user on the website
      const { data: authData, error: authError } = await creationClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            user_type
          }
        }
      });

      if (authError) throw authError;

      // 2. Ensure profile exists and has correct details
      const upsertData = {
        id: authData.user.id,
        email: email,
        user_type,
        full_name,
        verification_status: 'verified',
        is_verified: true, // Explicitly set for automatic verification
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (username) upsertData.username = username;
      if (phone) upsertData.phone = phone;
      if (department) upsertData.department = department;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(upsertData);

      if (profileError) throw profileError;

      // 3. Log audit action
      await this.logAudit({
        action: 'create_staff',
        resource_type: 'staff',
        resource_id: authData.user.id,
        details: { email, full_name, user_type, department }
      });

      return authData.user;
    } catch (error) {
      console.error('Error creating staff member:', error);
      throw error;
    }
  },

  /**
   * Update staff role (promote/demote/change type)
   */
  async updateStaffRole(userId, newUserType) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_type: newUserType,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log audit action
      await this.logAudit({
        action: 'update_staff_role',
        resource_type: 'staff',
        resource_id: userId,
        details: { new_user_type: newUserType }
      });

      return true;
    } catch (error) {
      console.error('Error updating staff role:', error);
      throw error;
    }
  },

  /**
   * Deactivate/activate a staff account
   */
  async toggleStaffStatus(userId, isActive) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: isActive,
          verification_status: isActive ? 'verified' : 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log audit action
      await this.logAudit({
        action: isActive ? 'activate_staff' : 'deactivate_staff',
        resource_type: 'staff',
        resource_id: userId,
        details: { is_active: isActive }
      });

      return true;
    } catch (error) {
      console.error('Error toggling staff status:', error);
      throw error;
    }
  },

  /**
   * Update existing staff details
   */
  async updateStaff(userId, staffData) {
    try {
      const { full_name, username, phone, department, user_type } = staffData;
      
      const updateData = {
        full_name,
        user_type,
        updated_at: new Date().toISOString()
      };

      if (username) updateData.username = username;
      else updateData.username = null;

      if (phone) updateData.phone = phone;
      else updateData.phone = null;

      if (department) updateData.department = department;
      else updateData.department = null;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Log audit action
      await this.logAudit({
        action: 'update_staff_details',
        resource_type: 'staff',
        resource_id: userId,
        details: updateData
      });

      return true;
    } catch (error) {
      console.error('Error updating staff details:', error);
      throw error;
    }
  },

  /**
   * Demote staff member to resident
   */
  async demoteToResident(userId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_type: 'resident',
          is_active: true,
          verification_status: 'verified',
          department: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log audit action
      await this.logAudit({
        action: 'demote_staff_to_resident',
        resource_type: 'staff',
        resource_id: userId
      });

      return true;
    } catch (error) {
      console.error('Error demoting staff:', error);
      throw error;
    }
  },

  /**
   * Delete staff member (Complete removal/deactivation)
   */
  async deleteStaff(userId) {
    try {
      // In this setup, "delete" deactivates the profile and suspends access
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          verification_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log audit action
      await this.logAudit({
        action: 'delete_staff',
        resource_type: 'staff',
        resource_id: userId
      });

      return true;
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },

  /**
   * Reset any user's password (super admin only)
   */
  async resetUserPassword(email, newPassword, userId = null) {
    try {
      const { data, error } = await supabase.functions.invoke('reset-admin-password', {
        body: { email, newPassword, userId }
      });

      if (error || (data && !data.success)) {
        throw new Error(data?.error || error?.message || 'Failed to reset password');
      }

      // Log audit action
      await this.logAudit({
        action: 'reset_user_password',
        resource_type: 'user',
        resource_id: userId,
        details: { email }
      });

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },


  // ============================================
  // System Settings
  // ============================================

  /**
   * Get all system settings
   */
  async getSystemSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  },

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', category);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching settings by category:', error);
      throw error;
    }
  },

  /**
   * Update a system setting
   */
  async updateSetting(settingKey, settingValue) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: settingValue,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      // Log audit action
      await this.logAudit({
        action: 'update_setting',
        resource_type: 'settings',
        resource_id: null,
        details: { setting_key: settingKey, setting_value: settingValue }
      });

      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  },

  /**
   * Create a new system setting
   */
  async createSetting(settingData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('system_settings')
        .insert({
          ...settingData,
          updated_by: user?.id
        });

      if (error) throw error;

      // Log audit action
      await this.logAudit({
        action: 'create_setting',
        resource_type: 'settings',
        resource_id: null,
        details: settingData
      });

      return true;
    } catch (error) {
      console.error('Error creating setting:', error);
      throw error;
    }
  },

  // ============================================
  // Audit Logs
  // ============================================

  /**
   * Get audit logs with optional filters
   */
  async getAuditLogs(filters = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Log an audit action
   */
  async logAudit({ action, resource_type, resource_id = null, details = null }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user profile for additional info
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, user_type')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          user_email: profile?.email || user.email,
          user_type: profile?.user_type,
          action,
          resource_type,
          resource_id,
          details
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging audit action:', error);
      // Don't throw - audit logging should not break main operations
      return null;
    }
  },

  // ============================================
  // Permissions Management
  // ============================================

  /**
   * Get admin permissions
   */
  async getAdminPermissions(userId) {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return data || null;
    } catch (error) {
      console.error('Error fetching admin permissions:', error);
      throw error;
    }
  },

  /**
   * Update admin permissions
   */
  async updateAdminPermissions(userId, permissions) {
    try {
      const { error } = await supabase
        .from('admin_permissions')
        .upsert({
          user_id: userId,
          ...permissions,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log audit action
      await this.logAudit({
        action: 'update_permissions',
        resource_type: 'admin',
        resource_id: userId,
        details: permissions
      });

      return true;
    } catch (error) {
      console.error('Error updating admin permissions:', error);
      throw error;
    }
  },

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Check if current user is super admin
   */
  async isSuperAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.user_type === 'super_admin';
    } catch (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
  },

  /**
   * Get current user's permissions
   */
  async getCurrentUserPermissions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      // Super admins have all permissions
      if (profile?.user_type === 'super_admin') {
        return {
          can_manage_admins: true,
          can_manage_responders: true,
          can_manage_incidents: true,
          can_manage_announcements: true,
          can_view_analytics: true,
          can_manage_settings: true,
          can_view_audit_logs: true
        };
      }

      // Get specific permissions for regular admins
      const permissions = await this.getAdminPermissions(user.id);
      return permissions || {
        can_manage_admins: false,
        can_manage_responders: true,
        can_manage_incidents: true,
        can_manage_announcements: true,
        can_view_analytics: true,
        can_manage_settings: false,
        can_view_audit_logs: false
      };
    } catch (error) {
      console.error('Error getting current user permissions:', error);
      return null;
    }
  }
};

export default superAdminService;
