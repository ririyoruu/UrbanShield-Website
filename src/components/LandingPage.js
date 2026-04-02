import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, ArrowRight, Zap, Bell, Users, MapPin, Download, Smartphone, QrCode } from 'lucide-react';
import { adminService } from '../config/supabase';
import './LandingPage.css';

const LandingPage = ({ onLoginClick, onSignupClick }) => {
    const [stats, setStats] = useState({ totalReports: 0, resolvedToday: 0, totalUsers: 0 });
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getDashboardStats();
                if (data) {
                    setStats({
                        totalReports: data.totalReports || 0,
                        resolvedToday: data.resolvedToday || 0,
                        totalUsers: data.totalUsers || 1500
                    });
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        };
        fetchStats();
    }, []);

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="landing-root">
            {/* Main Background with animated gradients */}
            <div className="landing-global-bg">
                <div className="bg-blob blob-1" />
                <div className="bg-blob blob-2" />

                {/* Data Flow / Scanning Lines */}
                <div className="bg-data-lines">
                    <motion.div
                        className="data-line horizontal"
                        animate={{ y: [-100, 1000] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="data-line vertical"
                        animate={{ x: [-100, 2000] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 5 }}
                    />
                </div>

                <div className="bg-grid-overlay" />

                <div className="bg-grid-overlay" />
                
                {/* Tactical Radar Sweep Only */}
                <div className="bg-radar-layer">
                    <motion.div 
                        className="radar-beam"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </div>

            {/* Navigation */}
            <motion.nav
                className="landing-nav-wrapper"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="landing-nav-container">
                    <motion.div
                        className="landing-nav-brand"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{ cursor: 'pointer' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <img src="/logourb.png" alt="UrbanShield" className="landing-nav-logo" />
                        <span>UrbanShield</span>
                    </motion.div>
                    <div className="landing-nav-links">
                        <a 
                            href="#" 
                            className="landing-nav-link"
                            onClick={(e) => {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            Home
                        </a>
                        <a 
                            href="#features" 
                            className="landing-nav-link"
                            onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById('features');
                                if (element) {
                                    window.scrollTo({ 
                                        top: element.offsetTop - 80, 
                                        behavior: 'smooth' 
                                    });
                                }
                            }}
                        >
                            Features
                        </a>
                        <a 
                            href="#app" 
                            className="landing-nav-link"
                            onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById('app');
                                if (element) {
                                    window.scrollTo({ 
                                        top: element.offsetTop - 80, 
                                        behavior: 'smooth' 
                                    });
                                }
                            }}
                        >
                            App
                        </a>
                    </div>
                    <div className="landing-nav-actions">
                        <button className="landing-nav-btn-primary" onClick={onLoginClick}>
                            Admin Portal Login <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <motion.section
                className="landing-hero-section"
                style={{ opacity, scale }}
            >
                <motion.div
                    className="hero-content"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={fadeInUp} className="hero-badge">
                        <Zap size={14} className="icon-pulse" />
                        <span>Empowering Modern Incident Response</span>
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="hero-title">
                        Seconds count.<br />
                        <span className="text-gradient">UrbanShield</span> matters.
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="hero-subtitle">
                        The ultimate real-time monitoring and reporting ecosystem designed for modern public safety and emergency management.
                    </motion.p>

                    <motion.div variants={fadeInUp} className="hero-actions">
                        <button className="cta-primary" onClick={onSignupClick}>
                            Launch Admin Dashboard
                            <ArrowRight size={18} />
                        </button>
                        <a href="#app" className="cta-secondary">
                            Get the App
                        </a>
                    </motion.div>

                    {/* Quick Stats Floating */}
                    <motion.div variants={fadeInUp} className="hero-stats-floating">
                        <div className="floating-stat-item">
                            <span className="stat-val">{stats.totalReports}+</span>
                            <span className="stat-lab">Incidents Tracked</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="floating-stat-item">
                            <span className="stat-val">99.9%</span>
                            <span className="stat-lab">System Uptime</span>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* Features Grid */}
            <section id="features" className="landing-features">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.3 }}
                        variants={fadeInUp}
                    >
                        <h2 className="section-title">Built for Urban Safety</h2>
                        <p className="section-subtitle">Real-time tools to help responders react faster and smarter.</p>
                    </motion.div>

                    <motion.div
                        className="features-grid"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.2 }}
                    >
                        {[
                            { icon: <MapPin />, title: "Live Tracking", desc: "Real-time geographical incident mapping for immediate situational awareness." },
                            { icon: <Bell />, title: "Instant Alerts", desc: "Smart notification system that syncs directly with field responders." },
                            { icon: <Shield />, title: "Active Security", desc: "Enterprise-grade data encryption and secure administrative controls." },
                            { icon: <Users />, title: "Community Driven", desc: "Seamless incident reporting from citizens directly to relevant authorities." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                className="feature-card"
                                variants={fadeInUp}
                                whileHover={{ y: -10, boxShadow: "0 20px 40px rgba(37, 99, 235, 0.15)" }}
                            >
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Grid ... Existing code ... */}

            {/* Documentation Mockup Section */}
            <section id="documentation" className="landing-docs-section">
                <div className="container">
                    <motion.div 
                        className="section-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.3 }}
                        variants={fadeInUp}
                    >
                        <h2 className="section-title">Knowledge Base</h2>
                        <p className="section-subtitle">Comprehensive guides to master the UrbanShield ecosystem.</p>
                    </motion.div>

                    <div className="docs-grid">
                        {[
                            { icon: <Shield size={32} />, title: "Getting Started", desc: "A complete step-by-step guide for first-time administrators and agencies." },
                            { icon: <Smartphone size={32} />, title: "Mobile Integration", desc: "Setting up citizen reporting tools and incident notification systems." },
                            { icon: <Zap size={32} />, title: "API Reference", desc: "Technical documentation for building custom integrations and data exports." },
                            { icon: <MapPin size={32} />, title: "Map Management", desc: "Advanced geographical tools for real-time situational tracking and analysis." }
                        ].map((doc, i) => (
                            <motion.div 
                                key={i}
                                className="docs-card"
                                whileHover={{ x: 10, backgroundColor: "rgba(37, 99, 235, 0.1)" }}
                            >
                                <div className="docs-icon">{doc.icon}</div>
                                <div className="docs-info">
                                    <h3>{doc.title}</h3>
                                    <p>{doc.desc}</p>
                                    <span className="docs-link">Explore Article <ArrowRight size={14} /></span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* App Promotion Section ... Existing code ... */}
            <section id="app" className="landing-app-section">
                <div className="container">
                    <div className="app-grid">
                        <motion.div
                            className="app-mockup-wrapper"
                            initial={{ x: -50, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ duration: 0.8 }}
                        >
                            <img
                                src="/urbanshield_mobile_mockup.png"
                                alt="UrbanShield Mobile App"
                                className="app-mockup"
                            />
                            <div className="mockup-glow" />
                        </motion.div>

                        <motion.div
                            className="app-content"
                            initial={{ x: 50, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="app-tag">Mobile Experience</span>
                            <h2 className="app-title">UrbanShield in your pocket.</h2>
                            <p className="app-desc">
                                Safety shouldn't be confined to an office. Report incidents, receive local alerts, and stay connected with your community on the go.
                            </p>

                            <div className="app-qr-area">
                                <div className="qr-container">
                                    <img src="/urbanshield_qr_code.png" alt="Scan to Download" className="qr-img" />
                                    <div className="qr-overlay">
                                        <QrCode size={24} />
                                    </div>
                                </div>
                                <div className="qr-text">
                                    <p>Scan to download</p>
                                    <span>Available for Android</span>
                                </div>
                            </div>

                            <div className="app-buttons">
                                <button className="app-btn">
                                    <Smartphone size={20} />
                                    <span>Download APK</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer-modern">
                <div className="container">
                    <div className="footer-top">
                        <div className="footer-brand-info">
                            <img src="/logourb.png" alt="UrbanShield" className="footer-logo" />
                            <h3>UrbanShield</h3>
                            <p>Innovating public safety through real-time communication and analysis.</p>
                        </div>
                        <div className="footer-links">
                            <div>
                                <h4>System</h4>
                                <a href="#features">Features</a>
                                <a href="#app">Mobile App</a>
                                <a href="/login">Admin Login</a>
                            </div>
                            <div>
                                <h4>Support</h4>
                                <a href="#documentation" onClick={(e) => { e.preventDefault(); alert('Documentation Portal coming soon!'); }}>Documentation</a>
                                <a href="mailto:ninamarieantonio13@gmail.com,urbanshield.ad@gmail.com?subject=UrbanShield Support Request">Contact Us</a>
                                <a href="https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html" target="_blank" rel="noopener noreferrer">Safety Resources</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© {new Date().getFullYear()} UrbanShield Safety Systems. All rights reserved.</p>
                        <div className="social-links">
                            {/* Icons could go here */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
