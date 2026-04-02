import React, { useState, useEffect } from 'react';
import { Plus, Copy, Check, Clock, User, Mail } from 'lucide-react';
import { invitationService } from '../config/supabase';
import './InvitationManager.css';

const InvitationManager = ({ user }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    if (!user || !user.id) {
      console.warn('InvitationManager: No user ID available yet');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await invitationService.getInvitationsByAdmin(user.id);
      setInvitations(data || []);
    } catch (err) {
      console.error('Error loading invitations:', err);
      setError(`Failed to load invitations: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateInvitationCode = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');

      const newInvitation = await invitationService.generateInvitationCode(user.id);
      
      setSuccess(`New invitation code generated: ${newInvitation.code}`);
      await loadInvitations(); // Refresh the list
    } catch (err) {
      console.error('Error generating invitation:', err);
      setError('Failed to generate invitation code');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (dateString) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="invitation-manager">
      <div className="invitation-header">
        <h3>Admin Invitation Codes</h3>
        <button 
          className="btn-primary generate-btn"
          onClick={generateInvitationCode}
          disabled={generating}
        >
          {generating ? (
            <>
              <div className="loading-spinner-small" />
              Generating...
            </>
          ) : (
            <>
              <Plus size={20} />
              Generate New Code
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="invitations-list">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="empty-state">
            <User size={48} />
            <h4>No invitation codes yet</h4>
            <p>Generate your first invitation code to invite new admins</p>
          </div>
        ) : (
          <div className="invitations-grid">
            {invitations.map((invitation) => (
              <div 
                key={invitation.id} 
                className={`invitation-card ${invitation.is_used ? 'used' : ''} ${isExpired(invitation.expires_at) ? 'expired' : ''}`}
              >
                <div className="invitation-code">
                  <span className="code-text">{invitation.code}</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(invitation.code)}
                    disabled={invitation.is_used || isExpired(invitation.expires_at)}
                  >
                    {copiedCode === invitation.code ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>

                <div className="invitation-details">
                  <div className="detail-row">
                    <Clock size={16} />
                    <span>Created: {formatDate(invitation.created_at)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <Clock size={16} />
                    <span>Expires: {formatDate(invitation.expires_at)}</span>
                  </div>

                  {invitation.invited_email && (
                    <div className="detail-row">
                      <Mail size={16} />
                      <span>For: {invitation.invited_email}</span>
                    </div>
                  )}

                  {invitation.is_used && (
                    <div className="detail-row">
                      <User size={16} />
                      <span>Used by: {invitation.used_by_name || invitation.used_by_email || 'Verified User'}</span>
                    </div>
                  )}
                  {invitation.is_used && (
                    <div className="detail-row">
                      <Clock size={16} />
                      <span>At: {formatDate(invitation.used_at)}</span>
                    </div>
                  )}
                </div>

                <div className="invitation-status">
                  {invitation.is_used ? (
                    <span className="status-used">Used</span>
                  ) : isExpired(invitation.expires_at) ? (
                    <span className="status-expired">Expired</span>
                  ) : (
                    <span className="status-active">Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationManager;
