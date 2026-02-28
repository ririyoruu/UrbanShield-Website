import React, { useState, useEffect } from 'react';
import {
    Eye, EyeOff, Mail, Lock, ArrowLeft, Shield,
    AlertTriangle, Activity, Users, BarChart3, TrendingUp,
    CheckCircle, X, Key, User, Phone, Smartphone, Download, QrCode
} from 'lucide-react';
import { adminService } from '../config/supabase';
import { authService } from '../services/authService';
import EmailDomainSuggestions from './EmailDomainSuggestions';
import TermsAndConditions from './TermsAndConditions';
import './AdminLogin.css';

/* ─────────── View constants ─────────── */
const VIEW = { LOGIN: 'login', SIGNUP: 'signup', FORGOT: 'forgot', RESET_CODE: 'reset_code' };

const AdminLogin = ({ onLogin, onSignup }) => {
    const [view, setView] = useState(VIEW.LOGIN);
    const [stats, setStats] = useState({ totalReports: 0, pendingReports: 0, totalUsers: 0, resolvedToday: 0 });

    /* ── Login state ── */
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    /* ── Signup state ── */
    const [signupData, setSignupData] = useState({
        name: '', email: '', password: '', confirmPassword: '', invitationCode: '', phone: '', termsAccepted: false
    });
    const [showTerms, setShowTerms] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);
    const [signupError, setSignupError] = useState('');
    const [signupSuccess, setSignupSuccess] = useState('');

    /* ── Forgot password state ── */
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNew, setConfirmNew] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');

    /* ── Load live stats ── */
    useEffect(() => {
        adminService.getDashboardStats().then(s => {
            if (s) setStats({ totalReports: s.totalReports || 0, pendingReports: s.pendingReports || 0, totalUsers: s.totalUsers || 0, resolvedToday: s.resolvedToday || 0 });
        }).catch(() => { });
    }, []);

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
        if (signupData.password.length < 6) return setSignupError('Password must be at least 6 characters');
        if (!signupData.invitationCode.trim()) return setSignupError('Invitation code is required');
        setSignupLoading(true);
        const result = await onSignup(signupData.email, signupData.password, {
            name: signupData.name, userType: 'admin', phone: signupData.phone, invitationCode: signupData.invitationCode
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

    /* ──────────────────────────────────────────
       LEFT PANEL — shared for all views
    ────────────────────────────────────────── */
    const LeftPanel = () => (
        <div className="al-left">
            {/* ── Background Radar & Map Widget ── */}
            <div className="al-left-bg-widget">
                <div className="al-bg-radar-wrap">
                    {/* Concentric radar rings */}
                    <div className="al-bg-radar-ring al-bg-ring-1" />
                    <div className="al-bg-radar-ring al-bg-ring-2" />
                    <div className="al-bg-radar-ring al-bg-ring-3" />
                    <div className="al-bg-radar-ring al-bg-ring-4" />
                    <div className="al-bg-radar-line al-bg-line-h" />
                    <div className="al-bg-radar-line al-bg-line-v" />

                    {/* Rotating sweep */}
                    <div className="al-bg-radar-sweep" />

                    {/* SVG Bohol outline overlaying the radar */}
                    <svg viewBox="0 0 200 200" className="al-bg-map-svg">
                        <path d="
                            M 100,20 C 130,10 160,20 170,40 C 180,60 170,100 160,110
                            C 150,120 160,140 140,160 C 120,180 90,190 70,180
                            C 40,170 30,150 20,120 C 10,90 20,60 30,40
                            C 40,20 70,30 100,20 Z
                        " />
                    </svg>

                    {/* Radar Pins */}
                    {/* Tagbilaran */}
                    <g className="al-bg-pin al-bg-pin-1" style={{ top: '60%', left: '30%' }}>
                        <div className="al-pin-pulse" />
                        <div className="al-pin-dot" />
                    </g>
                    {/* Jagna */}
                    <g className="al-bg-pin al-bg-pin-2" style={{ top: '75%', left: '70%' }}>
                        <div className="al-pin-pulse" />
                        <div className="al-pin-dot" />
                    </g>
                    {/* Ubay */}
                    <g className="al-bg-pin al-bg-pin-3" style={{ top: '25%', left: '75%' }}>
                        <div className="al-pin-pulse" />
                        <div className="al-pin-dot" />
                    </g>
                    {/* Tubigon */}
                    <g className="al-bg-pin al-bg-pin-4" style={{ top: '30%', left: '25%' }}>
                        <div className="al-pin-pulse" />
                        <div className="al-pin-dot" />
                    </g>
                </div>
            </div>

            <div className="al-left-inner">
                {/* Logo */}
                <div className="al-brand">
                    <img src="/logourb.png" alt="UrbanShield" className="al-brand-logo" />
                    <div>
                        <p className="al-brand-name">UrbanShield</p>
                        <p className="al-brand-sub">Admin Portal</p>
                    </div>
                </div>

                {/* Headline */}
                <div className="al-headline">
                    <h1>Manage incidents.<br />Protect communities.</h1>
                    <p>
                        A centralized command center for monitoring, analyzing, and responding to
                        community incidents in real-time.
                    </p>
                </div>

                {/* Live stats */}
                <div className="al-stats">
                    <div className="al-stat">
                        <div className="al-stat-icon" style={{ background: 'rgba(239,68,68,.15)' }}>
                            <BarChart3 size={18} style={{ color: '#f87171' }} />
                        </div>
                        <div>
                            <p className="al-stat-value">{stats.totalReports}</p>
                            <p className="al-stat-label">Total Posts</p>
                        </div>
                    </div>
                    <div className="al-stat">
                        <div className="al-stat-icon" style={{ background: 'rgba(245,158,11,.15)' }}>
                            <Activity size={18} style={{ color: '#fbbf24' }} />
                        </div>
                        <div>
                            <p className="al-stat-value">{stats.pendingReports}</p>
                            <p className="al-stat-label">Pending Review</p>
                        </div>
                    </div>
                    <div className="al-stat">
                        <div className="al-stat-icon" style={{ background: 'rgba(16,185,129,.15)' }}>
                            <TrendingUp size={18} style={{ color: '#34d399' }} />
                        </div>
                        <div>
                            <p className="al-stat-value">{stats.resolvedToday}</p>
                            <p className="al-stat-label">Resolved Today</p>
                        </div>
                    </div>
                    <div className="al-stat">
                        <div className="al-stat-icon" style={{ background: 'rgba(99,102,241,.15)' }}>
                            <Users size={18} style={{ color: '#818cf8' }} />
                        </div>
                        <div>
                            <p className="al-stat-value">{stats.totalUsers}</p>
                            <p className="al-stat-label">Active Users</p>
                        </div>
                    </div>
                </div>

                {/* Download App Section */}
                <div className="al-download-section">
                    <div className="al-download-info">
                        <div className="al-download-icon">
                            <Smartphone size={24} style={{ color: '#6366f1' }} />
                        </div>
                        <div>
                            <p className="al-download-title">Citizen App</p>
                            <p className="al-download-desc">For reporters and users</p>
                            <a href="https://expo.dev/accounts/ririyoru/projects/urbanshield/builds/cccee896-9c1a-456c-b22d-cd5ca4027e9d" target="_blank" rel="noopener noreferrer" className="al-download-btn">
                                <Download size={14} /> Download App
                            </a>
                        </div>
                    </div>
                    <div className="al-download-qr">
                        <div className="al-qr-placeholder" title="Scan to download">
                            <img src="/qr.png" alt="QR Code" />
                        </div>
                        <p>Scan to Install</p>
                    </div>
                </div>

                {/* Footer */}
                <p className="al-left-footer">© {new Date().getFullYear()} UrbanShield · Admin Control Panel</p>
            </div>
        </div>
    );

    /* ──────────────────────────────────────────
       RIGHT PANEL — changes with view
    ────────────────────────────────────────── */
    return (
        <div className="al-root">
            <LeftPanel />

            <div className="al-right">
                <div className="al-form-wrap">
                    {/* ── MOBILE DOWNLOAD BANNER (Visible only on mobile) ── */}
                    <div className="al-mobile-download">
                        <div className="al-mobile-dl-icon">
                            <Smartphone size={20} style={{ color: '#4f46e5' }} />
                        </div>
                        <div className="al-mobile-dl-text">
                            <h4>Citizen App</h4>
                            <p>Get the mobile app</p>
                        </div>
                        <a href="https://expo.dev/accounts/ririyoru/projects/urbanshield/builds/cccee896-9c1a-456c-b22d-cd5ca4027e9d" target="_blank" rel="noopener noreferrer" className="al-btn-primary al-mobile-dl-btn">
                            Download
                        </a>
                    </div>

                    {/* ── LOGIN ── */}
                    {view === VIEW.LOGIN && (
                        <>
                            <div className="al-form-header">
                                <h2>Welcome back</h2>
                                <p>Sign in to your admin account</p>
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
                                        <Mail size={15} className="al-input-icon" />
                                        <input
                                            type="email" required autoComplete="email"
                                            placeholder="admin@domain.com"
                                            value={loginData.email}
                                            onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                                        />
                                        <EmailDomainSuggestions
                                            emailValue={loginData.email}
                                            onChange={v => setLoginData(p => ({ ...p, email: v }))}
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
                                        <Lock size={15} className="al-input-icon" />
                                        <input
                                            type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                                            placeholder="••••••••"
                                            value={loginData.password}
                                            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                                        />
                                        <button type="button" className="al-toggle-pw" onClick={() => setShowPassword(v => !v)}>
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="al-btn-primary" disabled={loginLoading}>
                                    {loginLoading ? <span className="al-spinner" /> : 'Sign In to Dashboard'}
                                </button>
                            </form>

                            <p className="al-switch-text">
                                Don't have an account?{' '}
                                <button className="al-text-btn" onClick={() => setView(VIEW.SIGNUP)}>Create one</button>
                            </p>
                        </>
                    )}

                    {/* ── SIGNUP ── */}
                    {view === VIEW.SIGNUP && (
                        <>
                            <div className="al-form-header">
                                <button className="al-back-btn" onClick={() => setView(VIEW.LOGIN)}>
                                    <ArrowLeft size={16} /> Back to sign in
                                </button>
                                <h2>Create account</h2>
                                <p>Join the incident management team</p>
                            </div>

                            {signupError && <div className="al-alert error"><AlertTriangle size={15} /> {signupError}</div>}
                            {signupSuccess && <div className="al-alert success"><CheckCircle size={15} /> {signupSuccess}</div>}

                            <form onSubmit={handleSignup} className="al-form">
                                <div className="al-field">
                                    <label>Full name</label>
                                    <div className="al-input-wrap">
                                        <User size={15} className="al-input-icon" />
                                        <input type="text" required placeholder="John Smith"
                                            value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} />
                                    </div>
                                </div>

                                <div className="al-field">
                                    <label>Email address</label>
                                    <div className="al-input-wrap">
                                        <Mail size={15} className="al-input-icon" />
                                        <input type="email" required placeholder="admin@domain.com"
                                            value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
                                        <EmailDomainSuggestions emailValue={signupData.email}
                                            onChange={v => setSignupData(p => ({ ...p, email: v }))} />
                                    </div>
                                </div>

                                <div className="al-field-row-grid">
                                    <div className="al-field">
                                        <label>Password</label>
                                        <div className="al-input-wrap">
                                            <Lock size={15} className="al-input-icon" />
                                            <input type={showSignupPassword ? 'text' : 'password'} required placeholder="••••••••"
                                                value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
                                            <button type="button" className="al-toggle-pw" onClick={() => setShowSignupPassword(v => !v)}>
                                                {showSignupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="al-field">
                                        <label>Confirm password</label>
                                        <div className="al-input-wrap">
                                            <Lock size={15} className="al-input-icon" />
                                            <input type="password" required placeholder="••••••••"
                                                value={signupData.confirmPassword} onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="al-field">
                                    <label>Invitation code <span className="al-required">*</span></label>
                                    <div className="al-input-wrap">
                                        <Key size={15} className="al-input-icon" />
                                        <input type="text" required placeholder="Enter your invitation code"
                                            value={signupData.invitationCode} onChange={e => setSignupData({ ...signupData, invitationCode: e.target.value })} />
                                    </div>
                                </div>

                                <div className="al-field">
                                    <label>Phone <span className="al-optional">(optional)</span></label>
                                    <div className="al-input-wrap">
                                        <Phone size={15} className="al-input-icon" />
                                        <input type="tel" placeholder="+63 9XX XXX XXXX"
                                            value={signupData.phone} onChange={e => setSignupData({ ...signupData, phone: e.target.value })} />
                                    </div>
                                </div>

                                <div className="al-notice">
                                    <Shield size={14} />
                                    <span>This is a private system. All accounts are granted administrative access for incident management.</span>
                                </div>

                                <div className="al-terms-checkbox">
                                    <input
                                        type="checkbox"
                                        id="al-terms"
                                        required
                                        checked={signupData.termsAccepted}
                                        onChange={e => setSignupData({ ...signupData, termsAccepted: e.target.checked })}
                                    />
                                    <label htmlFor="al-terms">
                                        I have read and agree to the <button type="button" className="al-text-btn al-terms-btn" onClick={() => setShowTerms(true)}>Terms & Conditions</button>
                                    </label>
                                </div>

                                <button type="submit" className="al-btn-primary" disabled={signupLoading}>
                                    {signupLoading ? <span className="al-spinner" /> : 'Create Account'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ── FORGOT PASSWORD ── */}
                    {view === VIEW.FORGOT && (
                        <>
                            <div className="al-form-header">
                                <button className="al-back-btn" onClick={() => setView(VIEW.LOGIN)}>
                                    <ArrowLeft size={16} /> Back to sign in
                                </button>
                                <h2>Reset password</h2>
                                <p>Enter your admin email to receive a reset code</p>
                            </div>

                            {forgotMsg && (
                                <div className={`al-alert ${forgotMsg.startsWith('Error') ? 'error' : 'success'}`}>
                                    {forgotMsg.startsWith('Error') ? <AlertTriangle size={15} /> : <CheckCircle size={15} />} {forgotMsg}
                                </div>
                            )}

                            <form onSubmit={handleForgot} className="al-form">
                                <div className="al-field">
                                    <label>Email address</label>
                                    <div className="al-input-wrap">
                                        <Mail size={15} className="al-input-icon" />
                                        <input type="email" required placeholder="admin@domain.com"
                                            value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                                        <EmailDomainSuggestions emailValue={forgotEmail} onChange={setForgotEmail} />
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
                                <button className="al-back-btn" onClick={() => setView(VIEW.FORGOT)}>
                                    <ArrowLeft size={16} /> Back
                                </button>
                                <h2>Enter reset code</h2>
                                <p>Check your email for the 6-digit verification code</p>
                            </div>

                            {forgotMsg && <div className="al-alert success"><CheckCircle size={15} /> {forgotMsg}</div>}
                            {resetError && <div className="al-alert error"><AlertTriangle size={15} /> {resetError}</div>}

                            <form onSubmit={handleResetCode} className="al-form">
                                <div className="al-field">
                                    <label>Verification code</label>
                                    <div className="al-input-wrap">
                                        <Key size={15} className="al-input-icon" />
                                        <input type="text" required placeholder="123456" maxLength="6"
                                            value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                                    </div>
                                </div>
                                <div className="al-field">
                                    <label>New password</label>
                                    <div className="al-input-wrap">
                                        <Lock size={15} className="al-input-icon" />
                                        <input type="password" required placeholder="••••••••"
                                            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                    </div>
                                </div>
                                <div className="al-field">
                                    <label>Confirm new password</label>
                                    <div className="al-input-wrap">
                                        <Lock size={15} className="al-input-icon" />
                                        <input type="password" required placeholder="••••••••"
                                            value={confirmNew} onChange={e => setConfirmNew(e.target.value)} />
                                    </div>
                                </div>
                                <button type="submit" className="al-btn-primary" disabled={resetLoading}>
                                    {resetLoading ? <span className="al-spinner" /> : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}

                </div>
            </div>

            {/* ── TERMS MODAL ── */}
            {showTerms && (
                <div className="al-modal-overlay">
                    <div className="al-modal-content">
                        <div className="al-modal-header">
                            <div className="al-modal-title">
                                <Shield size={18} className="al-modal-icon" />
                                <h3>Terms & Conditions</h3>
                            </div>
                            <button className="al-modal-close" onClick={() => setShowTerms(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="al-modal-body">
                            <TermsAndConditions />
                        </div>
                        <div className="al-modal-footer">
                            <button className="al-btn-secondary" onClick={() => setShowTerms(false)}>Cancel</button>
                            <button className="al-btn-primary" onClick={() => { setSignupData({ ...signupData, termsAccepted: true }); setShowTerms(false); }}>
                                I Agree
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLogin;
