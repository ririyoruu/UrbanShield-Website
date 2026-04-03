import React, { useState, useRef } from 'react';
import {
    Eye, EyeOff, Mail, Lock, ArrowLeft,
    AlertTriangle, CheckCircle, X, Key, User
} from 'lucide-react';
import { authService } from '../services/authService';
import { supabase } from '../config/supabase';
import EmailDomainSuggestions from './EmailDomainSuggestions';
import TermsAndConditions from './TermsAndConditions';
import './AdminLogin.css';

const VIEW = { LOGIN: 'login', SIGNUP: 'signup', FORGOT: 'forgot', RESET_CODE: 'reset_code' };

// Password validation helper
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('one special character');
    return errors;
};

const AdminLogin = ({ onLogin, onSignup, initialView = 'login' }) => {
    const [view, setView] = useState(initialView === 'signup' ? VIEW.SIGNUP : VIEW.LOGIN);
    const [showBackButton, setShowBackButton] = useState(true);

    /* ── Login state ── */
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    /* ── Signup state ── */
    const [signupData, setSignupData] = useState({
        name: '', email: '', password: '', confirmPassword: '', invitationCode: '', termsAccepted: false
    });
    const [showTerms, setShowTerms] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);
    const [signupError, setSignupError] = useState('');
    const [signupSuccess, setSignupSuccess] = useState('');
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [invitationStatus, setInvitationStatus] = useState('empty'); // 'empty', 'checking', 'valid', 'invalid'
    const invitationTimeoutRef = useRef(null);
    const [invitationValid, setInvitationValid] = useState(null); // null = unchecked, true = valid, false = invalid
    const [invitationChecking, setInvitationChecking] = useState(false);

    /* ── Forgot password state ── */
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNew, setConfirmNew] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');

    /* ────── Login ────── */
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true); setLoginError('');
        const result = await onLogin(loginData.email, loginData.password);
        if (!result.success) setLoginError(result.error || 'Login failed');
        setLoginLoading(false);
    };

    /* ────── Signup ────── */
    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError(''); setSignupSuccess('');
        if (!signupData.termsAccepted) return setSignupError('You must accept the Terms and Conditions');
        if (signupData.password !== signupData.confirmPassword) return setSignupError('Passwords do not match');
        
        const pwdErrors = validatePassword(signupData.password);
        if (pwdErrors.length > 0) return setSignupError(`Password must contain ${pwdErrors.join(', ')}`);
        
        if (!signupData.invitationCode.trim()) return setSignupError('Invitation code is required');
        
        setSignupLoading(true);
        const result = await onSignup(signupData.email, signupData.password, {
            name: signupData.name, userType: 'admin', invitationCode: signupData.invitationCode
        });
        if (result.success || result.requiresEmailVerification) {
            setSignupSuccess(result.message || 'Account created! Please check your email.');
            setTimeout(() => setView(VIEW.LOGIN), 4000);
        } else {
            setSignupError(result.error || 'Account creation failed');
        }
        setSignupLoading(false);
    };

    /* ────── Forgot password ────── */
    const handleForgot = async (e) => {
        e.preventDefault(); setForgotLoading(true); setForgotMsg('');
        try {
            const result = await authService.resetPassword(forgotEmail);
            if (result.requiresCode) { setForgotMsg('Verification code sent! Check your email.'); setView(VIEW.RESET_CODE); }
            else setForgotMsg('Password reset link sent to your email.');
        } catch (err) { setForgotMsg(`Error: ${err.message}`); }
        setForgotLoading(false);
    };

    const handleResetCode = async (e) => {
        e.preventDefault(); setResetError('');
        if (newPassword !== confirmNew) return setResetError('Passwords do not match');
        setResetLoading(true);
        try {
            const result = await authService.verifyCodeAndResetPassword(forgotEmail, resetCode, newPassword);
            if (result.success) { setForgotMsg('Password reset successfully! You can now sign in.'); setTimeout(() => setView(VIEW.LOGIN), 3000); }
            else setResetError(result.error || 'Reset failed');
        } catch (err) { setResetError(err.message || 'An error occurred'); }
        setResetLoading(false);
    };

    // Check invitation code against database in real-time
    const checkInvitationCode = async (code) => {
        if (!code || code.length < 4) {
            setInvitationStatus('empty');
            return;
        }
        
        setInvitationStatus('checking');
        try {
            const { data, error } = await supabase
                .from('invitation_codes')
                .select('code, is_used, expires_at')
                .eq('code', code)
                .eq('is_used', false)
                .gt('expires_at', new Date().toISOString())
                .single();
            
            if (error || !data) {
                setInvitationStatus('invalid');
            } else {
                setInvitationStatus('valid');
            }
        } catch (err) {
            setInvitationStatus('invalid');
        }
    };

    // Debounced invitation code handler
    const handleInvitationChange = (e) => {
        const value = e.target.value;
        setSignupData({ ...signupData, invitationCode: value });
        
        if (invitationTimeoutRef.current) {
            clearTimeout(invitationTimeoutRef.current);
        }
        
        invitationTimeoutRef.current = setTimeout(() => {
            checkInvitationCode(value);
        }, 500);
    };

    return (
        <div className="al-root">
            {/* Background particles */}
            <div className="al-bg">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className={`al-particle al-particle-${i + 1}`} />
                ))}
            </div>

            {/* Back button - upper left corner */}
            {showBackButton && (
                <button className="al-back-btn" onClick={() => window.history.back()}>
                    <ArrowLeft size={16} /> Back
                </button>
            )}

            {/* Centered form container */}
            <div className="al-form-container">

                {/* ── LOGIN ── */}
                {view === VIEW.LOGIN && (
                    <>
                        <div className="al-form-header">
                            <h2>Welcome back</h2>
                            <p>Login to your account</p>
                        </div>

                        {loginError && (
                            <div className="al-alert error">
                                <AlertTriangle size={15} /> {loginError}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="al-form">
                            <div className="al-field">
                                <label>Email address</label>
                                <div className="al-input-wrap">
                                    <input
                                        type="email" required
                                        placeholder="name@example.com"
                                        value={loginData.email}
                                        onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="al-field">
                                <div className="al-field-row">
                                    <label>Password</label>
                                    <button type="button" className="al-text-btn" onClick={() => setView(VIEW.FORGOT)}>
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="al-input-wrap">
                                    <input
                                        type={showPassword ? 'text' : 'password'} required
                                        placeholder="Enter your password"
                                        value={loginData.password}
                                        onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                                    />
                                    <button type="button" className="al-toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="al-btn-primary" disabled={loginLoading}>
                                {loginLoading ? <span className="al-spinner" /> : 'Sign In with Email'}
                            </button>
                        </form>

                        <p className="al-switch-text">
                            Don't have an account? <button className="al-text-btn" onClick={() => setView(VIEW.SIGNUP)}>Sign Up</button>
                        </p>
                    </>
                )}

                {/* ── SIGNUP ── */}
                {view === VIEW.SIGNUP && (
                    <>
                        <div className="al-form-header">
                            <h2>Welcome to UrbanShield</h2>
                            <p>Sign up for an account</p>
                        </div>

                        {signupError && <div className="al-alert error"><AlertTriangle size={15} /> {signupError}</div>}
                        {signupSuccess && <div className="al-alert success"><CheckCircle size={15} /> {signupSuccess}</div>}

                        <form onSubmit={handleSignup} className="al-form">
                            <div className="al-field">
                                <label>Full Name <span className="al-required">*</span></label>
                                <div className="al-input-wrap">
                                    <input type="text" required placeholder="John Doe"
                                        value={signupData.name}
                                        onChange={e => setSignupData({ ...signupData, name: e.target.value })} />
                                </div>
                            </div>

                            <div className="al-field">
                                <label>Email <span className="al-required">*</span></label>
                                <div className="al-input-wrap">
                                    <input type="email" required placeholder="name@example.com"
                                        value={signupData.email}
                                        onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
                                </div>
                            </div>

                            <div className="al-field">
                                <label>Password <span className="al-required">*</span></label>
                                <div className="al-input-wrap">
                                    <input type={showSignupPassword ? 'text' : 'password'} required 
                                        placeholder="Min. 8 chars, uppercase, lowercase, number, special char"
                                        value={signupData.password}
                                        onChange={e => {
                                            setSignupData({ ...signupData, password: e.target.value });
                                            setPasswordErrors(validatePassword(e.target.value));
                                        }} />
                                    <button type="button" className="al-toggle-pw" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                                        {showSignupPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                </div>
                                {passwordErrors.length > 0 && signupData.password && (
                                    <>
                                        <p className="al-field-error">Password must contain: {passwordErrors.join(', ')}</p>
                                    </>
                                )}
                                {passwordErrors.length === 0 && signupData.password && signupData.password.length >= 8 && (
                                    <p className="al-field-success">✓ Password meets all requirements</p>
                                )}
                            </div>

                            <div className="al-field">
                                <label>Confirm Password <span className="al-required">*</span></label>
                                <div className="al-input-wrap">
                                    <input type="password" required placeholder="Re-enter password"
                                        value={signupData.confirmPassword}
                                        onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} />
                                </div>
                                {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                                    <p className="al-field-error">Passwords do not match</p>
                                )}
                                {signupData.confirmPassword && signupData.password === signupData.confirmPassword && signupData.password && (
                                    <p className="al-field-success">✓ Passwords match</p>
                                )}
                            </div>

                            <div className="al-field">
                                <label>Invitation Code <span className="al-required">*</span></label>
                                <div className={`al-input-wrap ${invitationStatus === 'invalid' ? 'error' : invitationStatus === 'valid' ? 'success' : ''}`}>
                                    <input type="text" required placeholder="Enter invitation code"
                                        value={signupData.invitationCode}
                                        onChange={handleInvitationChange} />
                                </div>
                                {invitationStatus === 'checking' && (
                                    <p className="al-field-hint">Checking...</p>
                                )}
                                {invitationStatus === 'invalid' && (
                                    <p className="al-field-error">Invalid or expired invitation code</p>
                                )}
                                {invitationStatus === 'valid' && (
                                    <p className="al-field-success">✓ Valid invitation code</p>
                                )}
                            </div>

                            <div className="al-terms-checkbox">
                                <input type="checkbox" id="terms" checked={signupData.termsAccepted}
                                    onChange={e => setSignupData({ ...signupData, termsAccepted: e.target.checked })} />
                                <label htmlFor="terms">
                                    I agree to the <button type="button" className="al-terms-btn" onClick={() => setShowTerms(true)}>Terms and Conditions</button>
                                </label>
                            </div>

                            <button type="submit" className="al-btn-primary" 
                                disabled={
                                    signupLoading || 
                                    passwordErrors.length > 0 || 
                                    signupData.password !== signupData.confirmPassword ||
                                    !signupData.password ||
                                    !signupData.termsAccepted
                                }>
                                {signupLoading ? <span className="al-spinner" /> : 'Create Account'}
                            </button>
                        </form>

                        <p className="al-switch-text">
                            Already have an account? <button className="al-text-btn" onClick={() => setView(VIEW.LOGIN)}>Sign In</button>
                        </p>
                    </>
                )}

                {/* ── FORGOT PASSWORD ── */}
                {view === VIEW.FORGOT && (
                    <>
                        <div className="al-form-header">
                            <h2>Reset password</h2>
                            <p>Enter your email to receive a reset code</p>
                        </div>

                        {forgotMsg && <div className="al-notice"><X size={14} /> {forgotMsg}</div>}

                        <form onSubmit={handleForgot} className="al-form">
                            <div className="al-field">
                                <label>Email address</label>
                                <div className="al-input-wrap">
                                    <input type="email" required placeholder="name@example.com"
                                        value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)} />
                                </div>
                            </div>

                            <button type="submit" className="al-btn-primary" disabled={forgotLoading}>
                                {forgotLoading ? <span className="al-spinner" /> : 'Send Reset Code'}
                            </button>
                        </form>
                    </>
                )}

                {/* ── RESET CODE ── */}
                {view === VIEW.RESET_CODE && (
                    <>
                        <div className="al-form-header">
                            <h2>Enter reset code</h2>
                            <p>Check your email for the verification code</p>
                        </div>

                        {resetError && <div className="al-alert error"><AlertTriangle size={15} /> {resetError}</div>}
                        {forgotMsg && <div className="al-alert success"><CheckCircle size={15} /> {forgotMsg}</div>}

                        <form onSubmit={handleResetCode} className="al-form">
                            <div className="al-field">
                                <label>Verification Code</label>
                                <div className="al-input-wrap">
                                    <input type="text" required placeholder="6-digit code"
                                        value={resetCode}
                                        onChange={e => setResetCode(e.target.value)} />
                                </div>
                            </div>

                            <div className="al-field">
                                <label>New Password</label>
                                <div className="al-input-wrap">
                                    <input type="password" required placeholder="Min. 6 characters"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)} />
                                </div>
                            </div>

                            <div className="al-field">
                                <label>Confirm New Password</label>
                                <div className="al-input-wrap">
                                    <input type="password" required placeholder="Re-enter password"
                                        value={confirmNew}
                                        onChange={e => setConfirmNew(e.target.value)} />
                                </div>
                            </div>

                            <button type="submit" className="al-btn-primary" disabled={resetLoading}>
                                {resetLoading ? <span className="al-spinner" /> : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Terms Modal */}
            {showTerms && (
                <div className="al-modal-overlay" onClick={() => setShowTerms(false)}>
                    <div className="al-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="al-modal-header">
                            <div className="al-modal-title">
                                <h3>Terms and Conditions</h3>
                            </div>
                            <button className="al-modal-close" onClick={() => setShowTerms(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="al-modal-body">
                            <TermsAndConditions />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLogin;
