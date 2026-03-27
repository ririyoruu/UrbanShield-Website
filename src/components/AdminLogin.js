import React, { useState, useEffect } from 'react';
import {
    Eye, EyeOff, Mail, Lock, ArrowLeft, Shield,
    AlertTriangle, CheckCircle, X, Key, User, Phone, Smartphone, Download
} from 'lucide-react';
import { adminService } from '../config/supabase';
import { authService } from '../services/authService';
import EmailDomainSuggestions from './EmailDomainSuggestions';
import TermsAndConditions from './TermsAndConditions';
import './AdminLogin.css';

/* ─────────── View constants ─────────── */
const VIEW = { LOGIN: 'login', SIGNUP: 'signup', FORGOT: 'forgot', RESET_CODE: 'reset_code' };

/* ──────────────────────────────────────────
   LEFT PANEL — defined OUTSIDE AdminLogin
   so it never remounts on re-renders
────────────────────────────────────────── */
const LeftPanel = ({ stats }) => (
    <div className="al-left">
        {/* ── Animated background ── */}
        <div className="al-bg">
            <div className="al-bg-orb al-bg-orb-1" />
            <div className="al-bg-orb al-bg-orb-2" />
            <div className="al-bg-grid" />

            {/* Radar only */}
            <div className="al-radar-wrap">
                <div className="al-radar-ring al-radar-ring-1" />
                <div className="al-radar-ring al-radar-ring-2" />
                <div className="al-radar-ring al-radar-ring-3" />
                <div className="al-radar-sweep" />
                <div className="al-radar-pin al-radar-pin-1"><div className="al-pin-pulse" /><div className="al-pin-dot" /></div>
                <div className="al-radar-pin al-radar-pin-2"><div className="al-pin-pulse" /><div className="al-pin-dot" /></div>
                <div className="al-radar-pin al-radar-pin-3"><div className="al-pin-pulse" /><div className="al-pin-dot" /></div>
                <div className="al-radar-pin al-radar-pin-4"><div className="al-pin-pulse" /><div className="al-pin-dot" /></div>
            </div>

            {[...Array(8)].map((_, i) => (
                <div key={i} className={`al-particle al-particle-${i + 1}`} />
            ))}
        </div>

        <div className="al-left-inner">
            {/* Brand */}
            <div className="al-brand al-anim-1">
                <div className="al-brand-icon">
                    <img src="/logourb.png" alt="UrbanShield" className="al-brand-logo" />
                </div>
                <div>
                    <p className="al-brand-name">UrbanShield</p>
                    <p className="al-brand-sub">Admin Control Panel</p>
                </div>
            </div>

            {/* Headline */}
            <div className="al-headline al-anim-2">
                <h1>
                    Protect your<br />
                    <span className="al-headline-accent">community</span><br />
                    in real-time.
                </h1>
                <p>Monitor, analyze, and respond to incidents across Bohol — all from one centralized dashboard.</p>
            </div>

            {/* Live stats */}
            <div className="al-stats al-anim-3">
                <div className="al-stat">
                    <p className="al-stat-value">{stats.totalReports}</p>
                    <p className="al-stat-label">Total Posts</p>
                    <div className="al-stat-bar" style={{ '--bar-color': '#f87171' }} />
                </div>
                <div className="al-stat">
                    <p className="al-stat-value">{stats.pendingReports}</p>
                    <p className="al-stat-label">Pending</p>
                    <div className="al-stat-bar" style={{ '--bar-color': '#fbbf24' }} />
                </div>
                <div className="al-stat">
                    <p className="al-stat-value">{stats.resolvedToday}</p>
                    <p className="al-stat-label">Resolved</p>
                    <div className="al-stat-bar" style={{ '--bar-color': '#34d399' }} />
                </div>
                <div className="al-stat">
                    <p className="al-stat-value">{stats.totalUsers}</p>
                    <p className="al-stat-label">Users</p>
                    <div className="al-stat-bar" style={{ '--bar-color': '#818cf8' }} />
                </div>
            </div>

            {/* Download */}
            <div className="al-download-section al-anim-4">
                <div className="al-download-left">
                    <div className="al-download-icon"><Smartphone size={18} /></div>
                    <div>
                        <p className="al-download-title">Get the mobile app</p>
                        <p className="al-download-desc">For residents & reporters</p>
                    </div>
                </div>
                <div className="al-download-right">
                    <div className="al-qr-wrap">
                        <img src="/qr.png" alt="Scan to download" />
                    </div>
                    <a href="https://expo.dev/accounts/yorfu/projects/urbanshield/builds/40296135-1354-455e-8238-c8d95f771984" target="_blank" rel="noopener noreferrer" className="al-download-btn">
                        <Download size={13} /> Download APK
                    </a>
                </div>
            </div>

            {/* Footer */}
            <p className="al-left-footer al-anim-5">© {new Date().getFullYear()} UrbanShield · Bohol</p>
        </div>
    </div>
);

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
        let isMounted = true;
        let subscription = null;
        
        const fetchStats = async () => {
            try {
                const s = await adminService.getDashboardStats();
                if (isMounted && s) {
                    setStats({ 
                        totalReports: s.totalReports || 0, 
                        pendingReports: s.pendingReports || 0, 
                        totalUsers: s.totalUsers || 0, 
                        resolvedToday: s.resolvedToday || 0 
                    });
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        };
        
        // Initial fetch
        fetchStats();
        
        // Setup real-time subscription for stats updates
        subscription = adminService.subscribeToReports((payload) => {
            console.log('🔄 Landing page: Real-time incident update received:', payload);
            if (isMounted) {
                fetchStats(); // Refresh stats when incidents change
            }
        });
        
        // Also subscribe to user profile changes for user count updates
        const userSubscription = adminService.subscribeToProfiles((payload) => {
            console.log('🔄 Landing page: Real-time user profile update received:', payload);
            if (isMounted) {
                fetchStats(); // Refresh stats when users change
            }
        });
        
        return () => {
            isMounted = false;
            if (subscription) {
                subscription.unsubscribe();
                console.log('✅ Landing page: Real-time subscription cleaned up');
            }
            if (userSubscription) {
                userSubscription.unsubscribe();
                console.log('✅ Landing page: User subscription cleaned up');
            }
        };
    }, []); // Empty dependency array - run only once on mount

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
       RIGHT PANEL — changes with view
    ────────────────────────────────────────── */
    return (
        <div className="al-root">
            <LeftPanel stats={stats} />

            <div className="al-right">
                <div className="al-form-wrap">
                    {/* ── MOBILE DOWNLOAD BANNER (Visible only on mobile) ── */}
                    <div className="al-mobile-download">
                        <div className="al-mobile-dl-icon">
                            <Smartphone size={20} style={{ color: '#4f46e5' }} />
                        </div>
                        <div className="al-mobile-dl-text">
                            <h4>UrbanShield</h4>
                            <p>Get the mobile app</p>
                        </div>
                        <a href="https://www.mediafire.com/file/jlzydwcutixrpfu/UrbanShield.apk/file" target="_blank" rel="noopener noreferrer" className="al-btn-primary al-mobile-dl-btn">
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
                                            type="email" required autoComplete="off"
                                            placeholder="admin@domain.com"
                                            value={loginData.email}
                                            onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                                        />
                                    </div>
                                    <EmailDomainSuggestions
                                        emailValue={loginData.email}
                                        onChange={(value) => setLoginData(prev => ({ ...prev, email: value }))}
                                        textColor="black"
                                    />
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
                                            {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
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
                                    <EmailDomainSuggestions
                                        emailValue={signupData.email}
                                        onChange={(value) => setSignupData(prev => ({ ...prev, email: value }))}
                                        textColor="black"
                                    />
                                        <Mail size={15} className="al-input-icon" />
                                        <input type="email" required autoComplete="off" placeholder="admin@domain.com"
                                            value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
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
                                                {showSignupPassword ? <Eye size={15} /> : <EyeOff size={15} />}
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
                                        <input type="email" required autoComplete="off" placeholder="admin@domain.com"
                                            value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                                    </div>
                                    <EmailDomainSuggestions
                                        textColor="black"
                                        emailValue={forgotEmail}
                                        onChange={setForgotEmail}
                                    />
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
