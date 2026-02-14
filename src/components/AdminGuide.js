import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Shield, 
  BarChart3, 
  Users, 
  MapPin, 
  Bell, 
  Settings, 
  Key,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import './AdminGuide.css';

const AdminGuide = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const guideSections = [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      icon: <Shield size={24} />,
      content: {
        description: "The admin dashboard is your central hub for managing UrbanShield. Here you can monitor incidents, manage users, view analytics, and control system settings.",
        features: [
          "Real-time incident monitoring",
          "User management and permissions",
          "Analytics and reporting",
          "System configuration",
          "Invitation code management"
        ],
        tips: [
          "Check the dashboard regularly for new incidents",
          "Use the refresh button to get the latest data",
          "Monitor the statistics cards for quick insights"
        ]
      }
    },
    {
      id: 'incident-management',
      title: 'Incident Management',
      icon: <Eye size={24} />,
      content: {
        description: "Manage all incident reports from users. Review, approve, reject, or delete reports as needed.",
        features: [
          "View all incident reports in real-time",
          "Filter reports by status, category, or date",
          "Approve or reject pending reports",
          "Delete inappropriate or duplicate reports",
          "View detailed incident information"
        ],
        steps: [
          "Navigate to the 'Reports' tab",
          "Review incident details and evidence",
          "Click 'Approve' to accept the report",
          "Click 'Reject' to decline the report",
          "Click 'Delete' to remove the report"
        ],
        tips: [
          "Always review evidence before making decisions",
          "Use the search function to find specific reports",
          "Check the reporter's history for context"
        ]
      }
    },
    {
      id: 'user-management',
      title: 'User Management',
      icon: <Users size={24} />,
      content: {
        description: "Manage user accounts, permissions, and access levels. Control who can access the admin dashboard.",
        features: [
          "View all registered users",
          "Activate or deactivate user accounts",
          "Manage user permissions",
          "View user activity logs",
          "Generate invitation codes for new admins"
        ],
        steps: [
          "Go to the 'Users' tab",
          "View the list of all users",
          "Click on a user to view details",
          "Use the toggle to activate/deactivate accounts",
          "Generate invitation codes in the 'Invitations' tab"
        ],
        tips: [
          "Regularly review user activity",
          "Deactivate suspicious accounts immediately",
          "Keep invitation codes secure and time-limited"
        ]
      }
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: <BarChart3 size={24} />,
      content: {
        description: "View comprehensive analytics and generate reports on incident trends, user activity, and system performance.",
        features: [
          "Incident trend analysis",
          "Category distribution charts",
          "Response time metrics",
          "User activity statistics",
          "Export reports in various formats"
        ],
        steps: [
          "Navigate to the 'Analytics' tab",
          "Select date range for analysis",
          "Choose specific metrics to view",
          "Use filters to narrow down data",
          "Export reports as needed"
        ],
        tips: [
          "Check analytics weekly for trends",
          "Export monthly reports for stakeholders",
          "Use filters to focus on specific areas"
        ]
      }
    },
    {
      id: 'map-view',
      title: 'Map View',
      icon: <MapPin size={24} />,
      content: {
        description: "Visualize incidents on an interactive map to identify patterns and hotspots in your area.",
        features: [
          "Interactive map with incident markers",
          "Filter incidents by category or severity",
          "View incident details on map click",
          "Zoom and pan for detailed analysis",
          "Export map views as images"
        ],
        steps: [
          "Go to the 'Map' tab",
          "Wait for incidents to load on the map",
          "Click on markers to view incident details",
          "Use the legend to understand categories",
          "Zoom in on specific areas of interest"
        ],
        tips: [
          "Use map view to identify problem areas",
          "Check for clustering of similar incidents",
          "Export map screenshots for reports"
        ]
      }
    },
    {
      id: 'invitations',
      title: 'Invitation Management',
      icon: <Key size={24} />,
      content: {
        description: "Generate and manage invitation codes for new admin users. Control who can access the admin dashboard.",
        features: [
          "Generate unique invitation codes",
          "Set expiration dates for codes",
          "Track code usage and status",
          "Revoke unused codes",
          "View invitation history"
        ],
        steps: [
          "Navigate to the 'Invitations' tab",
          "Click 'Generate New Code'",
          "Copy the generated code",
          "Share the code with new admin",
          "Monitor code usage and expiration"
        ],
        tips: [
          "Generate codes only when needed",
          "Set reasonable expiration times",
          "Keep track of who has which codes",
          "Revoke unused codes regularly"
        ]
      }
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell size={24} />,
      content: {
        description: "Manage real-time notifications and alerts for new incidents, system updates, and important events.",
        features: [
          "Real-time incident notifications",
          "System status alerts",
          "User activity notifications",
          "Customizable notification settings",
          "Email and in-app notifications"
        ],
        steps: [
          "Check notification settings in dashboard",
          "Enable/disable specific notification types",
          "Set notification frequency preferences",
          "Configure email notifications",
          "Test notification delivery"
        ],
        tips: [
          "Keep notifications enabled for urgent incidents",
          "Review notification settings regularly",
          "Test notifications after system updates"
        ]
      }
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      icon: <Settings size={24} />,
      content: {
        description: "Configure system-wide settings, security options, and administrative preferences.",
        features: [
          "Security configuration",
          "Database settings",
          "API configuration",
          "Backup and recovery options",
          "System maintenance tools"
        ],
        steps: [
          "Access system settings (admin only)",
          "Review current configuration",
          "Make necessary changes",
          "Test changes in safe environment",
          "Save and apply changes"
        ],
        tips: [
          "Backup settings before making changes",
          "Test changes in development first",
          "Document all configuration changes",
          "Keep security settings up to date"
        ]
      }
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="admin-guide">
      <div className="admin-guide-content">
        {/* Header */}
        <div className="guide-header">
          <div className="guide-header-icon">
            <BookOpen size={60} />
          </div>
          <h1>Admin Guide</h1>
          <p className="guide-subtitle">
            Comprehensive documentation for UrbanShield admin dashboard features and management tools
          </p>
        </div>

        {/* Quick Start */}
        <div className="quick-start">
          <h2>Quick Start</h2>
          <div className="quick-start-grid">
            <div className="quick-start-item">
              <div className="quick-start-number">1</div>
              <h3>Login to Dashboard</h3>
              <p>Use your admin credentials to access the dashboard</p>
            </div>
            <div className="quick-start-item">
              <div className="quick-start-number">2</div>
              <h3>Review Incidents</h3>
              <p>Check the Reports tab for new incident reports</p>
            </div>
            <div className="quick-start-item">
              <div className="quick-start-number">3</div>
              <h3>Take Action</h3>
              <p>Approve, reject, or manage incidents as needed</p>
            </div>
            <div className="quick-start-item">
              <div className="quick-start-number">4</div>
              <h3>Monitor Analytics</h3>
              <p>Use analytics to track trends and performance</p>
            </div>
          </div>
        </div>

        {/* Guide Sections */}
        <div className="guide-sections">
          <h2>Detailed Guide</h2>
          <div className="sections-list">
            {guideSections.map((section) => (
              <div key={section.id} className="guide-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="section-title">
                    <div className="section-icon">{section.icon}</div>
                    <h3>{section.title}</h3>
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
                
                {expandedSection === section.id && (
                  <div className="section-content">
                    <p className="section-description">{section.content.description}</p>
                    
                    <div className="content-section">
                      <h4>Key Features</h4>
                      <ul className="feature-list">
                        {section.content.features.map((feature, index) => (
                          <li key={index}>
                            <CheckCircle size={16} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {section.content.steps && (
                      <div className="content-section">
                        <h4>Step-by-Step Instructions</h4>
                        <ol className="steps-list">
                          {section.content.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {section.content.tips && (
                      <div className="content-section">
                        <h4>Pro Tips</h4>
                        <ul className="tips-list">
                          {section.content.tips.map((tip, index) => (
                            <li key={index}>
                              <div className="tip-icon">💡</div>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="keyboard-shortcuts">
          <h2>Keyboard Shortcuts</h2>
          <div className="shortcuts-grid">
            <div className="shortcut-item">
              <kbd>Ctrl + R</kbd>
              <span>Refresh dashboard data</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl + F</kbd>
              <span>Search in current view</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl + A</kbd>
              <span>Select all items</span>
            </div>
            <div className="shortcut-item">
              <kbd>Esc</kbd>
              <span>Close modals/dialogs</span>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="troubleshooting">
          <h2>Troubleshooting</h2>
          <div className="troubleshooting-list">
            <div className="troubleshooting-item">
              <h3>Dashboard not loading?</h3>
              <p>Try refreshing the page or clearing your browser cache. Check your internet connection.</p>
            </div>
            <div className="troubleshooting-item">
              <h3>Incidents not showing?</h3>
              <p>Check your filters and date range. Try refreshing the data or logging out and back in.</p>
            </div>
            <div className="troubleshooting-item">
              <h3>Map not displaying?</h3>
              <p>Ensure you have a stable internet connection. Check if location services are enabled.</p>
            </div>
            <div className="troubleshooting-item">
              <h3>Can't generate invitation codes?</h3>
              <p>Verify you have admin permissions. Check if there are any system restrictions in place.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGuide;
