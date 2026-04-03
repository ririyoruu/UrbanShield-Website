import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff, Mail, Lock, User, Key } from 'lucide-react';
import EmailDomainSuggestions from './EmailDomainSuggestions';
import './ModernAuth.css';

const ModernSignupModal = ({ onClose, onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'admin',
    invitationCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Email domain validation
    const emailStr = formData.email.toLowerCase().trim();
    const domain = emailStr.split('@')[1];
    const popularDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
      'icloud.com', 'msn.com', 'live.com', 'me.com', 
      'aol.com', 'ymail.com', 'rocketmail.com', 'protonmail.com', 
      'proton.me', 'zoho.com', 'gmx.com', 'mail.com'
    ];

    if (!domain || !popularDomains.includes(domain)) {
      setError(`Please use a legitimate email provider (e.g., Gmail, Yahoo, Outlook). '${domain || 'unknown'}' is not recognized.`);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.invitationCode.trim()) {
      setError('Invitation code is required for admin account creation');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await onSignup(formData.email, formData.password, {
        name: formData.name,
        userType: formData.userType,
        invitationCode: formData.invitationCode
      });
      
      if (result.requiresEmailVerification) {
        // Email verification required
        setSuccess(result.message || 'Account created! Please check your email to verify your account.');
        setTimeout(() => {
          onClose();
          onSwitchToLogin(); // Switch to login modal after showing message
        }, 5000);
      } else if (result.success || result.user) {
        // Direct login (no verification needed)
        setSuccess('Account created successfully!');
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(result.error || 'Account creation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailKeyDown = (e) => {
    // Let the EmailDomainSuggestions component handle keyboard navigation
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      // The event will be handled by the EmailDomainSuggestions component
      return;
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <button className="auth-close" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="auth-logo">
            <img src="/logourb.png" alt="UrbanShield" />
          </div>
          
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join the incident management team
          </p>
        </div>

        <div className="auth-modal-body">
          {error && (
            <div className="auth-message error">
              <X size={20} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="auth-message success">
              <Shield size={20} />
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="auth-input"
                placeholder="Full name"
                required
              />
              <User className="auth-input-icon" size={20} />
            </div>

            <div className="auth-input-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={handleEmailKeyDown}
                className="auth-input"
                placeholder="Email address"
                required
              />
              <Mail className="auth-input-icon" size={20} />
              <EmailDomainSuggestions
                emailValue={formData.email}
                onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
              />
            </div>

            <div className="auth-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="Create password"
                required
              />
              <Lock className="auth-input-icon" size={20} />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            <div className="auth-input-group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="auth-input"
                placeholder="Confirm password"
                required
              />
              <Lock className="auth-input-icon" size={20} />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            <div className="auth-input-group">
              <input
                type="text"
                name="invitationCode"
                value={formData.invitationCode}
                onChange={handleChange}
                className="auth-input"
                placeholder="Invitation code"
                required
              />
              <Key className="auth-input-icon" size={20} />
            </div>

            <div className="auth-notice">
              <Shield className="auth-notice-icon" size={20} />
              <span className="auth-notice-text">
                This is a private admin system. All created accounts will have administrative privileges for incident management.
              </span>
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? (
                <div className="auth-loading" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?{' '}
              <a href="#" className="auth-link" onClick={onSwitchToLogin}>
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernSignupModal;
