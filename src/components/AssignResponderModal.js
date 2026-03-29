import React, { useState, useEffect } from 'react';
import { X, Shield, Building2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabase';
import './AssignResponderModal.css';

const AssignResponderModal = ({ incident, isOpen, onClose, onAssign, loading }) => {
  const [responders, setResponders] = useState([]);
  const [loadingResponders, setLoadingResponders] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableResponders();
    }
  }, [isOpen]);

  const loadAvailableResponders = async () => {
    try {
      setLoadingResponders(true);
      
      // Get all responders who are on duty and active
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'responder')
        .eq('duty_status', 'on_duty')
        .eq('is_active', true)
        .eq('verification_status', 'verified')
        .order('full_name', { ascending: true });

      if (error) throw error;

      // Filter out responders already assigned to other incidents
      // For now, show all on-duty responders
      setResponders(data || []);
    } catch (error) {
      console.error('Error loading responders:', error);
      setResponders([]);
    } finally {
      setLoadingResponders(false);
    }
  };

  const handleAssign = () => {
    console.log('handleAssign called', { 
      selectedResponder, 
      hasOnAssign: !!onAssign, 
      incidentId: incident?.id,
      onAssignType: typeof onAssign 
    });
    
    if (!selectedResponder) {
      console.error('No responder selected');
      return;
    }
    
    if (!onAssign || typeof onAssign !== 'function') {
      console.error('onAssign is not a function:', onAssign);
      alert('Assignment function not available. Please refresh the page.');
      return;
    }
    
    if (!incident?.id) {
      console.error('No incident ID');
      return;
    }
    
    console.log('Calling onAssign with:', incident.id, selectedResponder);
    onAssign(incident.id, selectedResponder);
    onClose();
  };

  if (!isOpen) return null;

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <div className="arm-backdrop" onClick={onClose} />
      <div className="arm-modal">
        <div className="arm-header">
          <div>
            <h3>Assign Responder</h3>
            <p className="arm-subtitle">Select an on-duty responder for this incident</p>
          </div>
          <button className="arm-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="arm-body">
          {loadingResponders ? (
            <div className="arm-loading">
              <RefreshCw size={32} className="spinning" />
              <p>Loading available responders...</p>
            </div>
          ) : responders.length === 0 ? (
            <div className="arm-empty">
              <AlertCircle size={48} />
              <h4>No Responders Available</h4>
              <p>There are no responders currently on duty.</p>
            </div>
          ) : (
            <div className="arm-responder-list">
              {responders.map((responder) => {
                const initials = getInitials(responder.full_name);
                const isSelected = selectedResponder?.id === responder.id;
                
                return (
                  <div
                    key={responder.id}
                    className={`arm-responder-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedResponder(responder)}
                  >
                    <div className="arm-responder-avatar" style={{ backgroundColor: '#3b82f6' }}>
                      {initials}
                    </div>
                    <div className="arm-responder-info">
                      <div className="arm-responder-name">{responder.full_name}</div>
                      <div className="arm-responder-details">
                        {responder.department && (
                          <span className="arm-detail">
                            <Building2 size={12} />
                            {responder.department}
                          </span>
                        )}
                        <span className="arm-duty-badge">
                          <span className="arm-duty-dot"></span>
                          On Duty
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="arm-check-icon">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="arm-footer">
          <button className="arm-btn arm-btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="arm-btn arm-btn-assign"
            onClick={handleAssign}
            disabled={!selectedResponder || loading}
          >
            {loading ? 'Assigning...' : 'Assign Responder'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AssignResponderModal;
