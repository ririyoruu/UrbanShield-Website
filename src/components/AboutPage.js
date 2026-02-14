import React from 'react';
import { Shield, Users, Target, Award, CheckCircle, Globe, Smartphone, BarChart3 } from 'lucide-react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-page-content">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-content">
            <div className="about-hero-icon">
              <Shield size={80} />
            </div>
            <h1>About UrbanShield</h1>
            <p className="about-hero-subtitle">
              Your comprehensive platform for urban safety management and community protection
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="about-mission">
          <div className="about-mission-content">
            <h2>Our Mission</h2>
            <p>
              UrbanShield is dedicated to creating safer urban environments by empowering communities 
              with real-time safety information, incident reporting, and emergency management tools. 
              We believe that every citizen deserves to feel safe and informed in their community.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="about-features">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Smartphone size={40} />
              </div>
              <h3>Real-time Reporting</h3>
              <p>Report incidents instantly with location tracking and photo evidence for faster response times.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 size={40} />
              </div>
              <h3>Analytics Dashboard</h3>
              <p>Comprehensive analytics and insights to help administrators make data-driven safety decisions.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Globe size={40} />
              </div>
              <h3>Interactive Maps</h3>
              <p>Visualize safety incidents and patterns on interactive maps for better understanding of urban safety.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Users size={40} />
              </div>
              <h3>Community Engagement</h3>
              <p>Foster community involvement through social media-style news feeds and verified incident updates.</p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="about-values">
          <h2>Our Values</h2>
          <div className="values-list">
            <div className="value-item">
              <CheckCircle size={24} />
              <div>
                <h3>Transparency</h3>
                <p>Open and honest communication about safety incidents and community concerns.</p>
              </div>
            </div>
            
            <div className="value-item">
              <CheckCircle size={24} />
              <div>
                <h3>Reliability</h3>
                <p>Consistent and dependable service that communities can trust for their safety needs.</p>
              </div>
            </div>
            
            <div className="value-item">
              <CheckCircle size={24} />
              <div>
                <h3>Innovation</h3>
                <p>Continuously improving our platform with cutting-edge technology and user feedback.</p>
              </div>
            </div>
            
            <div className="value-item">
              <CheckCircle size={24} />
              <div>
                <h3>Community First</h3>
                <p>Putting the needs and safety of our communities at the center of everything we do.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="about-stats">
          <h2>Impact by Numbers</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Incidents Reported</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Communities Served</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Monitoring</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-number">99%</div>
              <div className="stat-label">Response Accuracy</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-cta">
          <div className="cta-content">
            <h2>Ready to Make Your Community Safer?</h2>
            <p>Join UrbanShield today and be part of the solution for urban safety management.</p>
            <div className="cta-buttons">
              <button className="btn-primary">Get Started</button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
