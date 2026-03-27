import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff, User, Lock, ArrowLeft, Mail } from 'lucide-react';
import { authService } from '../services/authService';
import './BottomSheetModal.css';

const BottomSheetLoginModal = ({ onClose, onLogin, onSwitchToSignup }) => {
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
      console.log('Attempting to send password reset email to:', forgotPasswordEmail);
      await authService.resetPassword(forgotPasswordEmail);
      console.log('Password reset email sent successfully');
      setForgotPasswordMessage('Password reset email sent! Check your inbox (and spam folder) and follow the instructions to reset your password.');
    } catch (error) {
      console.error('Forgot password error:', error);
      console.error('Error details:', error.message);
      setForgotPasswordMessage(`Failed to send reset email: ${error.message || 'Please check your email address and try again.'}`);
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
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-title">
            <Shield className="bottom-sheet-icon" />
            <h2>{showForgotPassword ? 'Reset Password' : 'Admin Login'}</h2>
          </div>
          <button className="bottom-sheet-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {showForgotPassword ? (
          // Forgot Password Form
          <form onSubmit={handleForgotPassword} className="bottom-sheet-form">
            <div className="forgot-password-info">
              <Mail className="info-icon" />
              <p>Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            {forgotPasswordMessage && (
              <div className={`message ${forgotPasswordMessage.includes('sent') ? 'success' : 'error'}`}>
                {forgotPasswordMessage}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="forgot-email">Email Address</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="email"
                  id="forgot-email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? (
                <div className="loading-spinner" />
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="bottom-sheet-footer">
              <div className="footer-links">
                <button 
                  type="button" 
                  className="back-btn" 
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft size={16} />
                  Back to Admin Login
                </button>
              </div>
            </div>
          </form>
        ) : (
          // Login Form
          <>
            <form onSubmit={handleSubmit} className="bottom-sheet-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <User className="input-icon" />
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
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter your password"
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
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="bottom-sheet-footer">
              <div className="footer-links">
                <button 
                  className="link-btn" 
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot your password?
                </button>
                <p>
                  Don't have an admin account?{' '}
                  <button className="link-btn" onClick={onSwitchToSignup}>
                    Create one here
                  </button>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BottomSheetLoginModal;
