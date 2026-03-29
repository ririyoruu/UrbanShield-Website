import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { adminService } from '../config/supabase';
import './LandingPage.css';

const LandingPage = ({ onLoginClick, onSignupClick }) => {
    const [stats, setStats] = useState({ totalReports: 0, resolvedToday: 0, totalUsers: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getDashboardStats();
                if (data) {
                    setStats({
                        totalReports: data.totalReports || 0,
                        resolvedToday: data.resolvedToday || 0,
                        totalUsers: data.totalUsers || 0
                    });
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="landing-root">
            {/* Background with radar and particles */}
            <div className="landing-bg">
                {/* Radar animation */}
                <div className="landing-radar">
                    <div className="landing-radar-ring landing-radar-ring-1" />
                    <div className="landing-radar-ring landing-radar-ring-2" />
                    <div className="landing-radar-ring landing-radar-ring-3" />
                    <div className="landing-radar-sweep" />
                </div>

                {/* Particles */}
                {[...Array(12)].map((_, i) => (
                    <div key={i} className={`landing-particle landing-particle-${i + 1}`} />
                ))}
            </div>

            {/* Navigation */}
            <nav className="landing-nav">
                <div className="landing-nav-brand">
                    <img src="/logourb.png" alt="UrbanShield" className="landing-nav-logo" />
                    <span>UrbanShield</span>
                </div>
                <div className="landing-nav-actions">
                    <button className="landing-nav-btn" onClick={onLoginClick}>
                        Log in
                    </button>
                    <button className="landing-nav-btn-primary" onClick={onSignupClick}>
                        Sign up
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="landing-hero">
                <div className="landing-logo-hero">
                    <img src="/logourb.png" alt="UrbanShield" />
                </div>
                
                <h1 className="landing-title">
                    UrbanShield is the new way<br />
                    to manage urban safety.
                </h1>
                
                <p className="landing-subtitle">
                    Monitor, analyze, and respond to community incidents in real-time.<br />
                    Built for Bohol's safety and security teams.
                </p>

                <button className="landing-cta" onClick={onLoginClick}>
                    Access Admin Portal
                    <ArrowRight size={18} />
                </button>

                {/* Live Stats */}
                {(stats.totalReports > 0 || stats.totalUsers > 0) && (
                    <div className="landing-stats">
                        <div className="landing-stat">
                            <div className="landing-stat-value">{stats.totalReports}</div>
                            <div className="landing-stat-label">Total Incidents</div>
                        </div>
                        <div className="landing-stat">
                            <div className="landing-stat-value">{stats.resolvedToday}</div>
                            <div className="landing-stat-label">Resolved Today</div>
                        </div>
                        <div className="landing-stat">
                            <div className="landing-stat-value">{stats.totalUsers}</div>
                            <div className="landing-stat-label">Active Users</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="landing-footer">
                <p>© {new Date().getFullYear()} UrbanShield. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
