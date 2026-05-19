import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Shield, Bell, MapPin, Clock, ChevronRight, Flame, Zap } from 'lucide-react';
import './CentralNotification.css';

const DISPLAY_SECONDS = 12;

const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'high':
      return { label: '⚠ HIGH PRIORITY ALERT', icon: AlertTriangle, colorClass: 'high', btnLabel: 'Respond Now' };
    case 'low':
      return { label: 'New Report', icon: Shield, colorClass: 'low', btnLabel: 'View Report' };
    default:
      return { label: 'New Incident', icon: Bell, colorClass: 'medium', btnLabel: 'Investigate Incident' };
  }
};

const getCategoryIcon = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('fire')) return Flame;
  if (cat.includes('storm') || cat.includes('electric') || cat.includes('power')) return Zap;
  if (cat.includes('crime') || cat.includes('theft')) return AlertTriangle;
  return Shield;
};

const CentralNotification = ({ notification, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(DISPLAY_SECONDS);

  useEffect(() => {
    if (!notification) return;
    setTimeLeft(DISPLAY_SECONDS);

    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [notification, onClose]);

  if (!notification) return null;

  const severity = notification.severity || 'medium';
  const config = getSeverityConfig(severity);
  const CategoryIcon = getCategoryIcon(notification.category);
  const IconComponent = config.icon;
  const progress = (timeLeft / DISPLAY_SECONDS) * 100;

  return (
    <div className="cn-overlay" onClick={onClose}>
      <div className={`cn-card ${config.colorClass}`} onClick={e => e.stopPropagation()}>

        {/* Progress bar */}
        <div className="cn-progress-bar">
          <div className="cn-progress-fill" style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
        </div>

        {/* Header */}
        <div className="cn-header">
          <div className={`cn-badge ${config.colorClass}`}>
            <IconComponent size={11} />
            <span>{config.label}</span>
          </div>
          <button className="cn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="cn-body">
          <div className={`cn-icon-wrapper ${config.colorClass}`}>
            <CategoryIcon size={30} />
            {severity === 'high' && <span className="cn-pulse-ring" />}
          </div>
          <div className="cn-content">
            <span className="cn-category-tag">{notification.category || 'Incident'}</span>
            <h3 className="cn-title">{notification.title || 'New Incident Reported'}</h3>
            {(notification.address || notification.location) && (
              <div className="cn-location">
                <MapPin size={12} />
                <span>{notification.address || notification.location}</span>
              </div>
            )}
            {notification.description && (
              <p className="cn-description">{notification.description}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="cn-footer">
          <div className="cn-timer">
            <Clock size={12} />
            <span>Closing in {timeLeft}s</span>
          </div>
          <button className="cn-action-btn" onClick={() => {
            if (notification.onClick) notification.onClick();
            onClose();
          }}>
            {config.btnLabel}
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CentralNotification;
