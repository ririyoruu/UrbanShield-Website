import React, { useState, useEffect, useMemo } from 'react';
import { X, Shield, Building2, CheckCircle, Search, Users, Thermometer, Flame, Activity, Heart, HardHat, RefreshCw, Crown } from 'lucide-react';
import { supabase } from '../config/supabase';
import './AssignResponderModal.css';

const AssignResponderModal = ({ incident, isOpen, onClose, onAssign, loading }) => {
  const [responders, setResponders] = useState([]);
  const [loadingResponders, setLoadingResponders] = useState(false);
  const [selectedResponders, setSelectedResponders] = useState(new Set());
  const [selectedDepts, setSelectedDepts] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Tubigon, Bohol expanded departments
  const DEPARTMENTS = [
    { id: 'PNP', label: 'PNP (POLICE)', icon: <Shield size={16} /> },
    { id: 'BFP', label: 'BFP (FIRE)', icon: <Flame size={16} /> },
    { id: 'MHO', label: 'MHO (HEALTH)', icon: <Heart size={16} /> },
    { id: 'Hospital', label: 'COMMUNITY HOSPITAL', icon: <Building2 size={16} /> },
    { id: 'MSWDO', label: 'MSWDO (SOCIAL)', icon: <Users size={16} /> },
    { id: 'TERSSU', label: 'TERSSU (EMERGENCY)', icon: <Activity size={16} /> },
    { id: 'Waterworks', label: 'WATERWORKS', icon: <Activity size={16} /> },
    { id: 'Barangay Office', label: 'BARANGAY', icon: <Building2 size={16} /> }
  ];

  useEffect(() => {
    if (isOpen) {
      loadAvailableResponders();
      setSelectedResponders(new Set());
      setSelectedDepts(new Set());
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadAvailableResponders = async () => {
    try {
      setLoadingResponders(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'responder')
        .eq('is_active', true)
        .eq('verification_status', 'verified')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setResponders(data || []);
    } catch (error) {
      console.error('Error loading responders:', error);
      setResponders([]);
    } finally {
      setLoadingResponders(false);
    }
  };

  const toggleDept = (deptId) => {
    setSelectedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const toggleResponder = (responderId) => {
    setSelectedResponders(prev => {
      const next = new Set(prev);
      if (next.has(responderId)) next.delete(responderId);
      else next.add(responderId);
      return next;
    });
  };

  const filteredResponders = useMemo(() => {
    let list = responders;
    const query = searchQuery.toLowerCase().trim();

    if (selectedDepts.size > 0) {
      list = list.filter(r => {
        const dept = (r.department || '').toUpperCase();
        // Match specific IDs or similar strings
        return Array.from(selectedDepts).some(d => 
          dept.includes(d) || 
          (d === 'RHU' && (dept.includes('MEDICAL') || dept.includes('HEALTH'))) ||
          (d === 'PNP' && dept.includes('POLICE')) ||
          (d === 'BFP' && dept.includes('FIRE'))
        );
      });
    }

    if (query) {
      list = list.filter(r => 
        r.full_name?.toLowerCase().includes(query) ||
        r.department?.toLowerCase().includes(query)
      );
    }

    return list;
  }, [responders, selectedDepts, searchQuery]);

  const handleDispatch = () => {
    console.log('📦 MODAL DISPATCH START:', incident?.id, { 
      selectedResponders: selectedResponders.size,
      selectedDepts: selectedDepts.size 
    });
    
    if (selectedResponders.size === 0 && selectedDepts.size === 0) return;
    
    // We send the array of selected responders and departments to onAssign
    const selectedList = responders.filter(r => selectedResponders.has(r.id));
    const deptsList = Array.from(selectedDepts);
    
    console.log('📦 Dispatching Action with Departments:', deptsList);
    
    onAssign(incident.id, selectedList[0] || null, { 
      additionalResponders: selectedList.slice(1),
      departments: deptsList,
      action_started_at: new Date().toISOString()
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="arm-zenith-backdrop" onClick={onClose} />
      <div className="arm-zenith-modal">
        <div className="arm-zenith-header">
          <div className="arm-zenith-title-area">
            <div className="arm-zenith-step">TUBIGON BOHOL — DISPATCH ENGINE</div>
            <h2 className="arm-zenith-title">START ACTION</h2>
          </div>
          <button className="arm-zenith-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="arm-zenith-body">
          <div className="arm-zenith-section">
            <div className="arm-zenith-search-bar">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search department or name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <p className="arm-zenith-subtitle">LOCAL DEPARTMENTS</p>
            <div className="arm-zenith-chips">
              {DEPARTMENTS.map(dept => (
                <button 
                  key={dept.id}
                  className={`arm-chip ${selectedDepts.has(dept.id) ? 'active' : ''}`}
                  onClick={() => toggleDept(dept.id)}
                >
                  {dept.id}
                </button>
              ))}
            </div>
          </div>

          <div className="arm-zenith-divider" />

          <div className="arm-zenith-section">
            <p className="arm-zenith-subtitle">AVAILABLE FOR DISPATCH ({filteredResponders.length})</p>
            {loadingResponders ? (
              <div className="arm-zenith-loading">
                <RefreshCw size={24} className="spinning" />
                <p>Connecting to Tubigon Emergency Network...</p>
              </div>
            ) : filteredResponders.length === 0 ? (
              <div className="arm-zenith-empty">
                <Users size={32} />
                <p>No responders found matching your search</p>
              </div>
            ) : (
              <div className="arm-zenith-list">
                {filteredResponders.map(responder => {
                  const isBusy = responder.duty_status === 'busy' || responder.current_incident_id;
                  const statusLabel = isBusy ? 'BUSY' : 'AVAILABLE';
                  const isSelected = selectedResponders.has(responder.id);
                  
                  return (
                    <div 
                      key={responder.id} 
                      className={`arm-responder-item ${isSelected ? 'active' : ''} ${isBusy ? 'busy' : ''}`}
                      onClick={() => toggleResponder(responder.id)}
                    >
                      <div className="arm-responder-selection">
                        {isSelected ? <CheckCircle size={18} fill="#000" color="#fff" /> : <div className="arm-check-placeholder" />}
                      </div>
                      <div className="arm-responder-info">
                        <span className="arm-responder-name">{responder.full_name}</span>
                        <span className="arm-responder-dept">{responder.department || 'GENERAL'}</span>
                      </div>
                      <div className={`arm-status-badge ${isBusy ? 'busy' : 'available'}`}>
                        {statusLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="arm-zenith-footer">
          <div className="arm-zenith-selection-count">
            {selectedResponders.size} SELECTED
          </div>
          <button 
            className="arm-zenith-dispatch-btn"
            disabled={selectedResponders.size === 0}
            onClick={handleDispatch}
          >
            DISPATCH RESPONDERS
          </button>
        </div>
      </div>
    </>
  );
};

export default AssignResponderModal;
