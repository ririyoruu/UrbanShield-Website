import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import './DispatchNotification.css';

const DispatchNotification = ({ responder, incident, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="dispatch-notification">
      <div className="notification-icon">
        <CheckCircle size={24} />
      </div>
      <div className="notification-content">
        <h4>Dispatched</h4>
        <p>
          <strong>{responder.name}</strong> → {incident.title}
        </p>
      </div>
      <button className="notification-close" onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
};

export default DispatchNotification;
