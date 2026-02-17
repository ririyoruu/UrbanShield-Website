import React, { useState, useEffect } from 'react';
import { Shield, Activity, Users, BarChart3, Lock, TrendingUp } from 'lucide-react';
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
    <div className="admin-landing-page">
      {/* Animated Background Shield */}
      <div className="background-shield-animated">
        <Shield size={600} />
      </div>
      
      {/* Navigation */}
      <nav className="admin-navbar">
        <div className="admin-nav-container">
          <div className="admin-nav-brand">
            <img 
              src="/logourb.png" 
              alt="UrbanShield Logo" 
              className="admin-nav-logo"
            />
            <span className="admin-brand-text">UrbanShield Admin</span>
          </div>
          
          <div className="admin-nav-actions">
            <button className="admin-login-btn" onClick={onLoginClick}>
              <Lock size={18} />
              Admin Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="admin-hero-section">
        <div className="admin-hero-container">
          <div className="admin-hero-left">
            <img 
              src="/logourb.png" 
              alt="UrbanShield Logo" 
              className="admin-hero-logo"
            />
            
            <h1 className="admin-hero-title">
              UrbanShield Admin Dashboard
            </h1>
            
            <p className="admin-hero-subtitle">
              Centralized incident management and community oversight platform.
              Monitor, analyze, and respond to community incidents in real-time.
            </p>
            
            <button className="admin-hero-btn" onClick={onLoginClick}>
              <Lock size={20} />
              Access Dashboard
            </button>
          </div>

          <div className="admin-hero-right">
            {/* Live Stats Dashboard Preview */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <BarChart3 size={24} style={{ color: '#ef4444' }} />
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{stats.totalReports}</div>
                  <div className="admin-stat-label">Total Incidents</div>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <Activity size={24} style={{ color: '#f59e0b' }} />
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{stats.pendingReports}</div>
                  <div className="admin-stat-label">Pending Review</div>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <TrendingUp size={24} style={{ color: '#10b981' }} />
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{stats.resolvedToday}</div>
                  <div className="admin-stat-label">Resolved Today</div>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <Users size={24} style={{ color: '#3b82f6' }} />
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-value">{stats.totalUsers}</div>
                  <div className="admin-stat-label">Active Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="admin-footer">
        <div className="admin-footer-container">
          <div className="admin-footer-content">
            <div className="admin-footer-brand">
              <Shield size={24} />
              <span>UrbanShield Admin</span>
            </div>
            <p className="admin-footer-text">
              © 2024 UrbanShield. Administrative Control Panel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleAuth;
