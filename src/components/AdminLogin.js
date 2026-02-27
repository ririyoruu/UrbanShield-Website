import React, { useState, useEffect } from 'react';
import {
    Eye, EyeOff, Mail, Lock, ArrowLeft, Shield,
    AlertTriangle, Activity, Users, BarChart3, TrendingUp,
    CheckCircle, X, Key, User, Phone
} from 'lucide-react';
import { adminService } from '../config/supabase';
import { authService } from '../services/authService';
import EmailDomainSuggestions from './EmailDomainSuggestions';
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
        name: '', email: '', password: '', confirmPassword: '', invitationCode: '', phone: ''
    });
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
            {/* Subtle background pattern */}
            <div className="al-left-pattern" />

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
        </div>
    );
};

export default AdminLogin;
