import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import EmailDomainSuggestions from './EmailDomainSuggestions';
import './ModernAuth.css';

const ModernLoginModal = ({ onClose, onLogin, onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await onLogin(formData.email, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('LoginModal: Unexpected error:', err);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    
    try {
      const result = await authService.resetPassword(forgotPasswordEmail);
      
      if (result.requiresCode) {
        setForgotPasswordMessage('Verification code sent! Check your email.');
        setShowVerificationCode(true);
      } else {
        setForgotPasswordMessage('Password reset instructions sent to your email.');
      }
    } catch (error) {
      setForgotPasswordMessage(`Failed to send reset code: ${error.message || 'Please try again.'}`);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowVerificationCode(false);
    setForgotPasswordEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotPasswordMessage('');
  };

  const handleVerificationCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setResetLoading(true);
    
    try {
      
      const result = await authService.verifyCodeAndResetPassword(
        forgotPasswordEmail,
        verificationCode,
        newPassword
      );
      
      if (result.success) {
        setForgotPasswordMessage('Password reset successfully! You can now log in with your new password.');
        setTimeout(() => {
          handleBackToLogin();
        }, 3000);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while resetting password');
    } finally {
      setResetLoading(false);
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
          
          <h1 className="auth-title">
            {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {showForgotPassword 
              ? 'Enter your admin email to receive reset instructions'
              : 'Sign in to manage your incident dashboard'
            }
          </p>
        </div>

        <div className="auth-modal-body">
          {showForgotPassword ? (
            // Forgot Password Form
            <>
              {forgotPasswordMessage && (
                <div className={`auth-message ${forgotPasswordMessage.includes('sent') || forgotPasswordMessage.includes('Verification code sent') ? 'success' : 'error'}`}>
                  {forgotPasswordMessage.includes('sent') || forgotPasswordMessage.includes('Verification code sent') ? <Mail size={20} /> : <X size={20} />}
                  {forgotPasswordMessage}
                </div>
              )}
              
              {!showVerificationCode ? (
                <form onSubmit={handleForgotPassword} className="auth-form">
                  <div className="auth-input-group">
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="auth-input"
                      placeholder="Enter your email address"
                      required
                    />
                    <Mail className="auth-input-icon" size={20} />
                    <EmailDomainSuggestions
                      emailValue={forgotPasswordEmail}
                      onChange={setForgotPasswordEmail}
                    />
                  </div>

                  <button type="submit" className="auth-submit" disabled={forgotPasswordLoading}>
                    {forgotPasswordLoading ? (
                      <div className="auth-loading" />
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerificationCodeSubmit} className="auth-form">
                  <div className="auth-input-group">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="auth-input"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      pattern="\d{6}"
                      title="Please enter exactly 6 digits"
                      required
                    />
                    <Mail className="auth-input-icon" size={20} />
                  </div>

                  <div className="auth-input-group">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="auth-input"
                      placeholder="New password"
                      required
                    />
                    <Lock className="auth-input-icon" size={20} />
                  </div>

                  <div className="auth-input-group">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="auth-input"
                      placeholder="Confirm new password"
                      required
                    />
                    <Lock className="auth-input-icon" size={20} />
                  </div>

                  {error && (
                    <div className="auth-message error">
                      <X size={20} />
                      {error}
                    </div>
                  )}

                  <button type="submit" className="auth-submit" disabled={resetLoading}>
                    {resetLoading ? (
                      <div className="auth-loading" />
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              )}

              <div className="auth-footer">
                <a href="#" className="auth-back-btn" onClick={handleBackToLogin}>
                  <ArrowLeft size={16} />
                  Back to sign in
                </a>
              </div>
            </>
          ) : (
            // Login Form
            <>
              {error && (
                <div className="auth-message error">
                  <X size={20} />
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="auth-form">
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
                    placeholder="Password"
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

                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="auth-loading" />
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <div className="auth-footer">
                <a href="#" className="auth-link" onClick={() => setShowForgotPassword(true)}>
                  Forgot your password?
                </a>
                <p className="auth-footer-text">
                  Don't have an admin account?{' '}
                  <a href="#" className="auth-link" onClick={onSwitchToSignup}>
                    Create one here
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernLoginModal;
