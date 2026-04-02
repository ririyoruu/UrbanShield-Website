import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Camera, Save, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../config/supabase';
import './Settings.css';

const Settings = ({ user, onAvatarChange }) => {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);

  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setEmail(authUser.email || '');

      // Load from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setAvatarUrl(profile.avatar_url || '');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return avatarUrl;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    // Try uploading to Supabase Storage
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        console.log('Avatar uploaded successfully:', publicUrl);
        return publicUrl;
      }
      console.warn('Storage upload failed:', uploadError.message);
    } catch (err) {
      console.warn('Storage upload exception:', err);
    }

    // Fallback: convert to base64 data URL and store directly
    console.log('Using base64 fallback for avatar');
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(avatarUrl);
      reader.readAsDataURL(avatarFile);
    });
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      // Upload avatar if changed
      const newAvatarUrl = await uploadAvatar(authUser.id);

      // Check if email is being changed
      const isEmailChanging = email !== authUser.email;
      let emailUpdateSuccess = false;

      // Update email in Supabase Auth if changed
      if (isEmailChanging) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Please enter a valid email address');
        }

        const { error: emailError, data: emailData } = await supabase.auth.updateUser({ email });
        if (emailError) {
          console.error('Email update error:', emailError);
          throw new Error(emailError.message || 'Failed to update email. This email may already be in use.');
        }
        emailUpdateSuccess = true;
        console.log('Email update initiated:', emailData);
      }

      // Update profiles table (always update name and avatar, update email only if changed)
      const profileUpdates = {
        full_name: fullName,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      };
      
      // Only update email in profiles if it was successfully changed in auth
      if (isEmailChanging && emailUpdateSuccess) {
        profileUpdates.email = email;
      }

      const { error: profileError, data: updatedProfile } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', authUser.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      console.log('Profile updated successfully:', updatedProfile);

      // Also update Supabase Auth user metadata
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          avatar_url: newAvatarUrl
        }
      });

      if (authUpdateError) {
        console.warn('Auth metadata update warning:', authUpdateError);
        // Don't throw - auth metadata is secondary
      }

      // Set appropriate success message
      if (isEmailChanging && emailUpdateSuccess) {
        setProfileMessage({
          type: 'success',
          text: 'Profile updated! Please check your NEW email inbox for a confirmation link to complete the email change.'
        });
      } else {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      }

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview('');
      
      // Notify parent (AdminDashboard) to update sidebar avatar and name
      if (onAvatarChange) onAvatarChange(newAvatarUrl, fullName);
      
      // Force reload profile to ensure state is synced
      await loadProfile();
    } catch (err) {
      console.error('Profile save error:', err);
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMessage({ type: '', text: '' });

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setPasswordLoading(true);

    try {
      // Verify current password by re-authenticating
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
        setPasswordLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 5000);
    }
  };

  const displayAvatar = avatarPreview || avatarUrl;

  return (
    <div className="settings">
      {/* Profile Section */}
      <div className="settings-section">
        <h3 className="section-title">Profile</h3>
        {profileMessage.text && (
          <div className={`settings-message ${profileMessage.type}`}>
            {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{profileMessage.text}</span>
          </div>
        )}
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <div className="avatar-overlay">
                <Camera size={20} />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <p className="avatar-hint">Click to change photo</p>
          </div>

          <div className="profile-fields">
            <div className="field-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="field-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <button
              className="btn-save-profile"
              onClick={handleProfileSave}
              disabled={profileLoading}
            >
              <Save size={16} />
              <span>{profileLoading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="settings-section">
        <h3 className="section-title">
          <Lock size={18} />
          <span>Change Password</span>
        </h3>
        {passwordMessage.text && (
          <div className={`settings-message ${passwordMessage.type}`}>
            {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{passwordMessage.text}</span>
          </div>
        )}
        <div className="password-fields">
          <div className="field-group">
            <label>Current Password</label>
            <div className="password-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <button
                className="toggle-password"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                type="button"
              >
                {showCurrentPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>
          <div className="field-group">
            <label>New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
              />
              <button
                className="toggle-password"
                onClick={() => setShowNewPassword(!showNewPassword)}
                type="button"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="field-group">
            <label>Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                type="button"
              >
                {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>
          <button
            className="btn-change-password"
            onClick={handlePasswordChange}
            disabled={passwordLoading}
          >
            <Lock size={16} />
            <span>{passwordLoading ? 'Changing...' : 'Change Password'}</span>
          </button>
        </div>
      </div>

      {/* Theme Section */}
      <div className="settings-section">
        <h3 className="section-title">Appearance</h3>
        <div className="setting-item">
          <div className="setting-info">
            <label>Theme</label>
            <p>Choose your preferred theme</p>
          </div>
          <div className="theme-toggle">
            <button 
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => theme !== 'light' && toggleTheme()}
            >
              <Sun size={16} />
              <span>Light</span>
            </button>
            <button 
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => theme !== 'dark' && toggleTheme()}
            >
              <Moon size={16} />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
