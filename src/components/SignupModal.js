import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff, User, Lock, Mail, Key } from 'lucide-react';
import './Modal.css';

const SignupModal = ({ onClose, onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'admin', // Always admin for this system
    invitationCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Real-time field validation errors
  const [fieldErrors, setFieldErrors] = useState({
    password: '',
    confirmPassword: '',
    invitationCode: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.invitationCode.trim()) {
      setError('Invitation code is required');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await onSignup(formData.email, formData.password, {
        name: formData.name,
        userType: formData.userType,
        invitationCode: formData.invitationCode
      });
      
      if (result.success) {
        setSuccess(result.message || 'Account created successfully!');
        setTimeout(() => {
          onClose();
        }, 3000); // Give more time to read the message
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (confirmPassword.length === 0) return '';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const validateInvitationCode = (code) => {
    if (code.length === 0) return '';
    if (code.length < 4) return 'Code must be at least 4 characters';
    return '';
  };

  const handleChange = (e) => {
    let value = e.target.value;
    const name = e.target.name;
    
    // Real-time validation
    let fieldError = '';
    if (name === 'password') {
      fieldError = validatePassword(value);
      // Also validate confirm password if it has a value
      if (formData.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: validateConfirmPassword(value, formData.confirmPassword)
        }));
      }
    } else if (name === 'confirmPassword') {
      fieldError = validateConfirmPassword(formData.password, value);
    } else if (name === 'invitationCode') {
      fieldError = validateInvitationCode(value);
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Shield className="modal-icon" />
            <h2>Create Admin Account</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              {success}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className={`input-wrapper ${fieldErrors.password ? 'error' : ''}`}>
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={`input-wrapper ${fieldErrors.confirmPassword ? 'error' : ''}`}>
              <Lock className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <div className="field-error">{fieldErrors.confirmPassword}</div>
            )}
          </div>


          <div className="form-group">
            <label htmlFor="invitationCode">Invitation Code</label>
            <div className={`input-wrapper ${fieldErrors.invitationCode ? 'error' : ''}`}>
              <Key className="input-icon" />
              <input
                type="text"
                id="invitationCode"
                name="invitationCode"
                value={formData.invitationCode}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your invitation code"
                required
              />
            </div>
            {fieldErrors.invitationCode && (
              <div className="field-error">{fieldErrors.invitationCode}</div>
            )}
          </div>

          <div className="form-group">
            <div className="admin-notice">
              <Shield size={20} />
              <span>This system is for administrators only. All accounts created will have admin privileges.</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary modal-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="modal-footer">
          <p>
            Already have an account?{' '}
            <button className="link-btn" onClick={onSwitchToLogin}>
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
