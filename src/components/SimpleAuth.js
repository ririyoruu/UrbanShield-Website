import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Activity, Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { adminService } from '../config/supabase';
import './SimpleAuth.css';

const SimpleAuth = ({ onLoginClick, onSignupClick }) => {
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    totalUsers: 0,
    resolvedToday: 0
  });

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const dashboardStats = await adminService.getDashboardStats();
        setStats({
          totalReports: dashboardStats.totalReports || 0,
          pendingReports: dashboardStats.pendingReports || 0,
          totalUsers: dashboardStats.totalUsers || 0,
          resolvedToday: dashboardStats.resolvedToday || 0
        });
      } catch (error) {
        console.log('Dashboard stats not available, using defaults');
        // Keep default values if database is not accessible
      }
    };

    fetchDashboardStats();
  }, []);
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80; // Approximate height of fixed navigation
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - navHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="landing-page">
      {/* Background Shield */}
      <div className="background-shield">
        <Shield size={400} />
      </div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="nav-logo-wrapper">
              <div className="nav-logo-shield">
                <Shield size={24} />
              </div>
              <img 
                src="/logourb.png" 
                alt="UrbanShield Logo" 
                className="nav-logo"
              />
            </div>
            <span className="nav-brand-text">UrbanShield</span>
          </div>
          
          <ul className="nav-menu">
            <li><a href="#home" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
            <li><a href="#features" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a></li>
            <li><a href="#how-it-works" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works</a></li>
            <li><a href="#contact" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          </ul>

          <div className="nav-actions">
            <button className="nav-btn nav-btn-secondary" onClick={onLoginClick}>
              Log In
            </button>
            <button className="nav-btn nav-btn-primary" onClick={onSignupClick}>
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Shield className="badge-icon" />
              <span>Community Management Platform</span>
            </div>
            
            <h1 className="hero-title">
              Building Safer Communities Together
            </h1>
            
            <p className="hero-subtitle">
              A comprehensive platform for community coordination and management. 
              Monitor activities, analyze patterns, and coordinate responses effectively.
            </p>
            
            <div className="hero-actions">
              <button className="hero-btn hero-btn-primary" onClick={onLoginClick}>
                Go to Dashboard
                <ArrowRight size={20} />
              </button>
              <button className="hero-btn hero-btn-secondary" onClick={onSignupClick}>
                Create Account
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">{stats.totalReports}</div>
                <div className="stat-label">Total Reports</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.pendingReports}</div>
                <div className="stat-label">Pending Review</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-cards">
              <div className="card card-1">
                <AlertTriangle className="card-icon" />
                <div className="card-title">Total Reports</div>
                <div className="card-value">{stats.totalReports}</div>
              </div>
              <div className="card card-2">
                <Users className="card-icon" />
                <div className="card-title">Total Users</div>
                <div className="card-value">{stats.totalUsers}</div>
              </div>
              <div className="card card-3">
                <CheckCircle className="card-icon" />
                <div className="card-title">Resolved Today</div>
                <div className="card-value">{stats.resolvedToday}</div>
              </div>
            </div>
            
            <div className="glow-effect"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Powerful Features for Community Management</h2>
            <p className="features-subtitle">Everything you need to manage community activities effectively</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h3 className="feature-title">Real-time Monitoring</h3>
              <p className="feature-description">Track community activities as they happen with live updates and instant notifications</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Activity size={24} />
              </div>
              <h3 className="feature-title">Smart Analytics</h3>
              <p className="feature-description">Get insights from activity patterns and trends to improve community coordination</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Users size={24} />
              </div>
              <h3 className="feature-title">Team Coordination</h3>
              <p className="feature-description">Seamlessly coordinate response teams and track deployment status in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple steps to get your community management system running</p>
          </div>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Create Account</h3>
              <p className="step-description">Sign up for your admin account and set up your community profile</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Configure System</h3>
              <p className="step-description">Customize settings, add team members, and set up notification preferences</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Start Managing</h3>
              <p className="step-description">Begin monitoring activities, coordinating responses, and analyzing data</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <div className="why-choose-container">
          <div className="why-choose-content">
            <div className="why-choose-text">
              <h2 className="section-title">Why Choose UrbanShield?</h2>
              <p className="section-subtitle">The most comprehensive community management solution</p>
              
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon">✓</div>
                  <div className="benefit-text">
                    <h4>24/7 Monitoring</h4>
                    <p>Round-the-clock activity tracking and alert system</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">✓</div>
                  <div className="benefit-text">
                    <h4>Advanced Analytics</h4>
                    <p>Deep insights into community patterns and trends</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">✓</div>
                  <div className="benefit-text">
                    <h4>Team Collaboration</h4>
                    <p>Seamless coordination between all team members</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">✓</div>
                  <div className="benefit-text">
                    <h4>Mobile Responsive</h4>
                    <p>Access your dashboard from any device, anywhere</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="why-choose-visual">
              <div className="dashboard-preview">
                <div className="preview-header">
                  <div className="preview-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="preview-title">Live Dashboard</div>
                </div>
                <div className="preview-content">
                  <div className="preview-stat">
                    <div className="preview-label">Total Reports</div>
                    <div className="preview-value">{stats.totalReports}</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-label">Pending Review</div>
                    <div className="preview-value">{stats.pendingReports}</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-label">Total Users</div>
                    <div className="preview-value">{stats.totalUsers}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="contact-container">
          <div className="contact-content">
            <h2 className="section-title">Let's Talk About Your Community</h2>
            <p className="section-subtitle">Get started with UrbanShield today</p>
            
            <div className="contact-form">
              <div className="form-row">
                <input type="text" placeholder="Your Name" className="form-input" />
                <input type="email" placeholder="Your Email" className="form-input" />
              </div>
              <div className="form-row">
                <input type="text" placeholder="Organization" className="form-input" />
                <input type="tel" placeholder="Phone Number" className="form-input" />
              </div>
              <textarea placeholder="Tell us about your community needs..." className="form-textarea"></textarea>
              <button className="submit-btn">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo-wrapper">
                <div className="footer-logo-shield">
                  <Shield size={24} />
                </div>
                <img 
                  src="/logourb.png" 
                  alt="UrbanShield Logo" 
                  className="footer-logo"
                />
              </div>
              <span className="footer-brand-text">UrbanShield</span>
              <p className="footer-description">
                Building safer communities through smart management and coordination.
              </p>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4 className="footer-title">Products</h4>
                <ul className="footer-list">
                  <li><a href="#features" className="footer-link">Features</a></li>
                  <li><a href="#how-it-works" className="footer-link">How It Works</a></li>
                  <li><a href="#contact" className="footer-link">Contact</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4 className="footer-title">Company</h4>
                <ul className="footer-list">
                  <li><a href="#" className="footer-link">About Us</a></li>
                  <li><a href="#" className="footer-link">Team</a></li>
                  <li><a href="#" className="footer-link">Careers</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4 className="footer-title">Resources</h4>
                <ul className="footer-list">
                  <li><a href="#" className="footer-link">Documentation</a></li>
                  <li><a href="#" className="footer-link">Support</a></li>
                  <li><a href="#" className="footer-link">Blog</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4 className="footer-title">Legal</h4>
                <ul className="footer-list">
                  <li><a href="#" className="footer-link">Privacy Policy</a></li>
                  <li><a href="#" className="footer-link">Terms of Service</a></li>
                  <li><a href="#" className="footer-link">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="footer-copyright">
                © 2024 UrbanShield. All rights reserved.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link">Twitter</a>
                <a href="#" className="social-link">LinkedIn</a>
                <a href="#" className="social-link">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleAuth;
