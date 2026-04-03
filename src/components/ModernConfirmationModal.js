import React from 'react';
import { X, AlertTriangle, CheckCircle, Copy, Key, ShieldCheck } from 'lucide-react';
import './Modal.css'; // Reusing base modal styles if they exist, or I will update them

const ModernConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel',
  type = 'warning', // 'warning', 'success', 'info'
  generatedPassword = null,
  onCopy = null
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="mcm-icon-success" size={48} />;
      case 'info': return <ShieldCheck className="mcm-icon-info" size={48} />;
      default: return <AlertTriangle className="mcm-icon-warning" size={48} />;
    }
  };

  return (
    <div className="udm-backdrop" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="mcm-panel" onClick={e => e.stopPropagation()}>
        <button className="mcm-close" onClick={onClose}><X size={20} /></button>
        
        <div className="mcm-content">
          <div className="mcm-icon-wrap">
            {getIcon()}
          </div>
          
          <h2 className="mcm-title">{title}</h2>
          <p className="mcm-message">{message}</p>
          
          {generatedPassword && (
            <div className="mcm-pass-box">
              <div className="mcm-pass-label">Temporary Password</div>
              <div className="mcm-pass-value-wrap">
                <code className="mcm-pass-value">{generatedPassword}</code>
                <button className="mcm-copy-btn" onClick={() => onCopy && onCopy(generatedPassword)}>
                  <Copy size={16} />
                </button>
              </div>
              <p className="mcm-pass-hint">Please copy and share this password securely with the user.</p>
            </div>
          )}
        </div>

        <div className="mcm-footer">
          <button className="mcm-btn-cancel" onClick={onClose}>{cancelLabel}</button>
          {!generatedPassword && (
            <button className={`mcm-btn-confirm ${type}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          )}
          {generatedPassword && (
            <button className="mcm-btn-confirm success" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .mcm-panel {
          background: #fff;
          width: 420px;
          border-radius: 20px;
          padding: 32px;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          animation: mcmSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: center;
        }

        @keyframes mcmSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .mcm-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .mcm-close:hover {
          background: #f4f4f5;
          color: #18181b;
        }

        .mcm-icon-wrap {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }

        .mcm-icon-warning { color: #f59e0b; }
        .mcm-icon-success { color: #10b981; }
        .mcm-icon-info { color: #3b82f6; }

        .mcm-title {
          font-size: 24px;
          font-weight: 700;
          color: #18181b;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }

        .mcm-message {
          font-size: 15px;
          color: #71717a;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .mcm-pass-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
        }

        .mcm-pass-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .mcm-pass-value-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 8px;
        }

        .mcm-pass-value {
          flex: 1;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: 0.05em;
        }

        .mcm-copy-btn {
          background: #f1f5f9;
          border: none;
          color: #475569;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .mcm-copy-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .mcm-pass-hint {
          font-size: 12px;
          color: #94a3b8;
          margin: 12px 0 0;
          font-style: italic;
        }

        .mcm-footer {
          display: flex;
          gap: 12px;
        }

        .mcm-footer button {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mcm-btn-cancel {
          background: #fff;
          border: 1px solid #e4e4e7;
          color: #52525b;
        }

        .mcm-btn-cancel:hover {
          background: #f4f4f5;
          border-color: #d4d4d8;
        }

        .mcm-btn-confirm {
          border: none;
          color: #fff;
        }

        .mcm-btn-confirm.warning { background: #f59e0b; }
        .mcm-btn-confirm.warning:hover { background: #d97706; }
        
        .mcm-btn-confirm.success { background: #10b981; }
        .mcm-btn-confirm.success:hover { background: #059669; }

        .mcm-btn-confirm.info { background: #3b82f6; }
        .mcm-btn-confirm.info:hover { background: #2563eb; }

        [data-theme="dark"] .mcm-panel {
          background: #18181b;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        [data-theme="dark"] .mcm-title { color: #fafafa; }
        [data-theme="dark"] .mcm-pass-box { background: #09090b; border-color: #27272a; }
        [data-theme="dark"] .mcm-pass-value-wrap { background: #18181b; border-color: #27272a; }
        [data-theme="dark"] .mcm-pass-value { color: #fafafa; }
        [data-theme="dark"] .mcm-copy-btn { background: #27272a; color: #a1a1aa; }
        [data-theme="dark"] .mcm-btn-cancel { background: #18181b; border-color: #3f3f46; color: #a1a1aa; }
      `}</style>
    </div>
  );
};

export default ModernConfirmationModal;
