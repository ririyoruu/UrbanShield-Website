import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
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
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    
    try {
      await authService.resetPassword(forgotPasswordEmail);
      setForgotPasswordMessage('Password reset email sent! Check your inbox and follow the instructions.');
    } catch (error) {
      setForgotPasswordMessage(`Failed to send reset email: ${error.message || 'Please try again.'}`);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordMessage('');
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
              ? 'Enter your email to receive reset instructions'
              : 'Sign in to manage your incident dashboard'
            }
          </p>
        </div>

        <div className="auth-modal-body">
          {showForgotPassword ? (
            // Forgot Password Form
            <>
              {forgotPasswordMessage && (
                <div className={`auth-message ${forgotPasswordMessage.includes('sent') ? 'success' : 'error'}`}>
                  {forgotPasswordMessage.includes('sent') ? <Mail size={20} /> : <X size={20} />}
                  {forgotPasswordMessage}
                </div>
              )}
              
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
                </div>

                <button type="submit" className="auth-submit" disabled={forgotPasswordLoading}>
                  {forgotPasswordLoading ? (
                    <div className="auth-loading" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

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
                    className="auth-input"
                    placeholder="Email address"
                    required
                  />
                  <Mail className="auth-input-icon" size={20} />
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
