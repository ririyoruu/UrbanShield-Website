import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Camera,
  Save, 
  X,
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Crown,
  Award,
  Activity,
  Users,
  AlertTriangle,
  FileText,
  Link,
  Globe,
  Shield,
  Key,
  Smartphone,
  Clock,
  LogOut,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Calendar,
  Bell
} from 'lucide-react';
import { adminService, supabase } from '../config/supabase';
import './AdminProfile.css';

const AdminProfile = ({ user, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);

  // Profile Data - Simplified to only essential fields
  const [profileData, setProfileData] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    department: '',
    position: '',
    avatar_url: user?.avatar_url || null
  });

  // Security Data
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    loginNotifications: true,
    suspiciousActivityAlerts: true
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      // Load profile data from database
      const data = await adminService.getAdminProfile(user.id);
      if (data) {
        setProfileData(prev => ({ ...prev, ...data }));
        if (data.avatar_url) {
          setPreviewImage(data.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Image size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await adminService.uploadAvatar(user.id, formData);
      if (response.success) {
        setProfileData(prev => ({ ...prev, avatar_url: response.url }));
        showMessage('success', 'Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', 'Failed to upload profile picture');
    } finally {
      setSaving(false);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    setProfileData(prev => ({ ...prev, avatar_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate phone number if provided
      if (profileData.phone) {
        const digitsOnly = profileData.phone.replace(/\D/g, '');
        if (digitsOnly.length !== 11) {
          throw new Error('Phone number must be exactly 11 digits (e.g., 09123456789)');
        }
      }
      
      setSaving(true);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Check if email has changed
      const emailChanged = profileData.email !== user.email;
      
      if (emailChanged) {
        // Check rate limiting for email changes
        const lastEmailChange = localStorage.getItem(`emailChange_${user.id}`);
        const now = Date.now();
        const EMAIL_CHANGE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (lastEmailChange && (now - parseInt(lastEmailChange)) < EMAIL_CHANGE_COOLDOWN) {
          const hoursLeft = Math.ceil((EMAIL_CHANGE_COOLDOWN - (now - parseInt(lastEmailChange))) / (60 * 60 * 1000));
          throw new Error(`Email can only be changed once every 24 hours. Please wait ${hoursLeft} more hours before changing your email again.`);
        }
        
        // Show confirmation dialog for email change
        const confirmed = window.confirm(
          `You are about to change your email from "${user.email}" to "${profileData.email}".\n\n` +
          `This will:\n` +
          `• Send a confirmation email to your new address\n` +
          `• Require you to verify the new email\n` +
          `• Prevent login with your old email\n\n` +
          `Are you sure you want to continue?`
        );
        
        if (!confirmed) {
          setSaving(false);
          return;
        }
        
        // First, try to update email in Supabase Auth
        try {
          const { error: authError } = await supabase.auth.updateUser({
            email: profileData.email
          });
          
          if (authError) {
            // If auth update fails, provide more specific error handling
            if (authError.message.includes('invalid')) {
              throw new Error('The email address format is invalid. Please check and try again.');
            } else if (authError.message.includes('already')) {
              throw new Error('This email address is already in use by another account.');
            } else {
              throw new Error(`Email update failed: ${authError.message}`);
            }
          }
          
          // Record the email change timestamp
          localStorage.setItem(`emailChange_${user.id}`, now.toString());
          
          showMessage('success', 'Email change initiated! Please check your new email for verification instructions.');
        } catch (authError) {
          // If auth update fails, ask user if they want to continue with database update only
          console.warn('Auth email update failed, but continuing with database update:', authError.message);
          
          // Show a warning message but continue with database update
          showMessage('warning', 'Email update in authentication system failed, but profile data will still be updated. You may need to use your current email for login.');
        }
      }
      
      // Update email and profile in the central profiles table
      await adminService.updateUserEmailInAllTables(user.id, profileData.email, {
        full_name: profileData.full_name,
        phone: profileData.phone,
        department: profileData.department,
        position: profileData.position
      });
      
      if (!emailChanged) {
        showMessage('success', 'Profile updated successfully');
      }
      
      if (onProfileUpdate) {
        onProfileUpdate(profileData);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('error', `Failed to save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);

      // Validate passwords
      if (securityData.newPassword !== securityData.confirmPassword) {
        showMessage('error', 'New passwords do not match');
        return;
      }
      
      if (securityData.newPassword.length < 8) {
        showMessage('error', 'Password must be at least 8 characters long');
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: securityData.newPassword
      });

      if (error) throw error;

      showMessage('success', 'Password updated successfully!');
      
      // Reset password fields
      setSecurityData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', `Failed to update password: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      setSaving(true);

      // Update other security settings
      const securitySettings = {
        twoFactorEnabled: securityData.twoFactorEnabled,
        loginNotifications: securityData.loginNotifications,
        suspiciousActivityAlerts: securityData.suspiciousActivityAlerts
      };

      await adminService.updateSecuritySettings(user.id, securitySettings);
      showMessage('success', 'Security settings updated successfully');
      
    } catch (error) {
      console.error('Error saving security settings:', error);
      showMessage('error', 'Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleTwoFactor = async () => {
    try {
      setSaving(true);
      const newTwoFactorState = !securityData.twoFactorEnabled;
      await adminService.toggleTwoFactor(user.id, newTwoFactorState);
      setSecurityData(prev => ({ ...prev, twoFactorEnabled: newTwoFactorState }));
      showMessage('success', `Two-factor authentication ${newTwoFactorState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling two-factor:', error);
      showMessage('error', 'Failed to update two-factor authentication');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="admin-profile">
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                <User size={48} />
              </div>
            )}
            <div className="avatar-overlay">
              <button 
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                <Camera size={20} />
              </button>
              {previewImage && (
                <button 
                  className="avatar-remove-btn"
                  onClick={removeImage}
                  disabled={saving}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <div className="avatar-info">
            <h2>{profileData.full_name || 'Admin User'}</h2>
            <p>{profileData.position || 'Administrator'}</p>
            <span className="admin-badge">
              <Crown size={16} />
              Super Admin
            </span>
          </div>
        </div>

      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          Profile
        </button>
        <button 
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={18} />
          Security
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h3>Profile Information</h3>
          <div className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label><User size={16} /> Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label><Mail size={16} /> Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><Phone size={16} /> Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setProfileData(prev => ({ ...prev, phone: val }));
                  }}
                  placeholder="e.g. 09123456789"
                  maxLength={11}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><Building size={16} /> Department</label>
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter your department"
                />
              </div>
              <div className="form-group">
                <label><Award size={16} /> Position</label>
                <input
                  type="text"
                  value={profileData.position}
                  onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Enter your position"
                />
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button 
              className="btn-save"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
        )}

        {activeTab === 'security' && (
          <div className="security-section">
            <h3>Security Settings</h3>
            
            <div className="password-management-section">
              <div className="password-header">
                <h4><Key size={20} /> Change Password</h4>
                <p>Update your account password for better security</p>
              </div>
              
              <div className="password-form">
                <div className="password-field">
                  <label><Lock size={16} /> New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className="password-input"
                    />
                    <button 
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="password-requirements">
                    <p>Password must be at least 8 characters long</p>
                  </div>
                </div>

                <div className="password-field">
                  <label><Lock size={16} /> Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="password-input"
                    />
                    <button 
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="password-actions">
                  <button 
                    className="btn-update-password"
                    onClick={handleChangePassword}
                    disabled={saving || !securityData.newPassword || !securityData.confirmPassword}
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={16} className="spinning" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="security-features-section">
              <div className="security-header">
                <h4><Shield size={20} /> Security Features</h4>
                <p>Manage your account security settings</p>
              </div>
              
              <div className="security-options">
                <div className="security-option">
                  <div className="option-content">
                    <div className="option-info">
                      <h5><Smartphone size={18} /> Two-Factor Authentication</h5>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securityData.twoFactorEnabled}
                        onChange={toggleTwoFactor}
                        disabled={saving}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-content">
                    <div className="option-info">
                      <h5><Bell size={18} /> Login Notifications</h5>
                      <p>Get notified when someone logs into your account</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securityData.loginNotifications}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="security-option">
                  <div className="option-content">
                    <div className="option-info">
                      <h5><AlertTriangle size={18} /> Suspicious Activity Alerts</h5>
                      <p>Receive alerts for unusual account activity</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={securityData.suspiciousActivityAlerts}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, suspiciousActivityAlerts: e.target.checked }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                className="btn-save"
                onClick={handleSaveSecurity}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Security Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;
