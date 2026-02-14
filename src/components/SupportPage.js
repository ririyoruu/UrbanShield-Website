import React, { useState } from 'react';
import { 
  HelpCircle, 
  Mail, 
  Shield, 
  MessageCircle, 
  Phone, 
  Clock, 
  CheckCircle,
  ExternalLink,
  Search,
  ChevronDown
} from 'lucide-react';
import AdminGuide from './AdminGuide';
import './SupportPage.css';

const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showAdminGuide, setShowAdminGuide] = useState(false);

  const faqs = [
    {
      id: 1,
      question: "How do I manage incident reports?",
      answer: "Use the Admin Dashboard to view, approve, reject, or delete incident reports. Navigate to the 'Reports' tab to see all pending and processed incidents. Click on individual reports to view details and take action."
    },
    {
      id: 2,
      question: "How do I generate invitation codes for new admins?",
      answer: "Go to the 'Invitations' tab in your Admin Dashboard. Click 'Generate New Code' to create invitation codes for new admin users. Each code can only be used once and expires after 7 days."
    },
    {
      id: 3,
      question: "How do I view analytics and statistics?",
      answer: "The Analytics tab shows incident trends, category distributions, response times, and other key metrics. Use the date filters to view data for specific time periods and export reports as needed."
    },
    {
      id: 4,
      question: "How do I manage user accounts?",
      answer: "In the 'Users' tab, you can view all registered users, activate/deactivate accounts, and manage user permissions. Only admins can access the full user management features."
    },
    {
      id: 5,
      question: "How do I access the map view?",
      answer: "The Map View shows all incidents plotted on an interactive map. Use it to visualize incident patterns, locations, and density. Click on map markers to view incident details."
    },
    {
      id: 6,
      question: "How do I set up real-time notifications?",
      answer: "Real-time notifications are automatically enabled. You'll receive instant updates when new incidents are reported, when reports are processed, and for system alerts. Check your notification settings in the dashboard."
    }
  ];

  const supportOptions = [
    {
      icon: <HelpCircle size={40} />,
      title: "Admin Guide",
      description: "Comprehensive documentation for admin dashboard features and management tools",
      action: "View Admin Guide",
      color: "#ef4444"
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleAdminGuideClick = () => {
    setShowAdminGuide(true);
  };

  const handleBackToSupport = () => {
    setShowAdminGuide(false);
  };

  // Show Admin Guide if requested
  if (showAdminGuide) {
    return (
      <div className="support-page">
        <div className="support-page-content">
          <div className="admin-guide-header">
            <button className="back-to-support-btn" onClick={handleBackToSupport}>
              ← Back to Support
            </button>
          </div>
          <AdminGuide />
        </div>
      </div>
    );
  }


  return (
    <div className="support-page">
      <div className="support-page-content">
        {/* Hero Section */}
        <section className="support-hero">
          <div className="support-hero-content">
            <div className="support-hero-icon">
              <HelpCircle size={80} />
            </div>
            <h1>Admin Support</h1>
            <p className="support-hero-subtitle">
              Get help with UrbanShield admin dashboard and find answers to your administrative questions
            </p>
          </div>
        </section>

        {/* Support Options */}
        <section className="support-options">
          <div className="support-options-grid">
            {supportOptions.map((option, index) => (
              <div key={index} className="support-option-card">
                <div className="support-option-icon" style={{ color: option.color }}>
                  {option.icon}
                </div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
                <button 
                  className="support-option-btn" 
                  style={{ borderColor: option.color, color: option.color }}
                  onClick={option.title === 'Admin Guide' ? handleAdminGuideClick : undefined}
                >
                  {option.action}
                  <ExternalLink size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="support-faq">
          <h2>Admin Frequently Asked Questions</h2>
          
          {/* Search Bar */}
          <div className="faq-search">
            <div className="search-input-container">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="faq-search-input"
              />
            </div>
          </div>

          {/* FAQ List */}
          <div className="faq-list">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown 
                    size={20} 
                    className={`faq-chevron ${expandedFaq === faq.id ? 'expanded' : ''}`}
                  />
                </button>
                {expandedFaq === faq.id && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="support-contact">
          <h2>Still Need Admin Support?</h2>
          <p>Can't find what you're looking for? Our technical support team is here to help with admin dashboard issues.</p>
          
          <div className="contact-methods">
            <div className="contact-method">
              <div className="contact-icon">
                <Mail size={24} />
              </div>
              <div className="contact-info">
                <h3>Admin Email Support</h3>
                <p>admin-support@urbanshield.com</p>
                <span>Response within 24 hours</span>
              </div>
            </div>
            
            <div className="contact-method">
              <div className="contact-icon">
                <Phone size={24} />
              </div>
              <div className="contact-info">
                <h3>Admin Hotline</h3>
                <p>+1 (555) 123-4567</p>
                <span>Mon-Fri, 9AM-6PM EST</span>
              </div>
            </div>
            
            <div className="contact-method">
              <div className="contact-icon">
                <MessageCircle size={24} />
              </div>
              <div className="contact-info">
                <h3>Admin Chat</h3>
                <p>Available 24/7</p>
                <span>Priority admin support</span>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <h3>Send admin support a message</h3>
            <form>
              <div className="form-row">
                <input type="text" placeholder="Your Name" />
                <input type="email" placeholder="Your Email" />
              </div>
              <input type="text" placeholder="Subject" />
              <textarea placeholder="Your Message" rows="5"></textarea>
              <button type="submit" className="submit-btn">
                <Mail size={16} />
                Send Message
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SupportPage;
