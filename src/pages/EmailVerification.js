import React, { useState, useEffect } from 'react';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          setStatus('error');
          setMessage('Invalid verification link. Please request a new verification email.');
          return;
        }

        // Verify the email using the tokens
        const { data, error } = await authService.supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          setStatus('error');
          setMessage('Email verification failed. The link may have expired.');
          return;
        }

        // Check if email is now confirmed
        if (data.user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in to your account.');
        } else {
          setStatus('error');
          setMessage('Email verification failed. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during email verification.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate('/', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(148, 163, 184, 0.2)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 2rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                     status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                     'rgba(59, 130, 246, 0.1)'
        }}>
          {status === 'loading' && <Mail size={40} style={{ color: '#3b82f6' }} />}
          {status === 'success' && <CheckCircle size={40} style={{ color: '#10b981' }} />}
          {status === 'error' && <AlertCircle size={40} style={{ color: '#ef4444' }} />}
        </div>

        <h1 style={{
          color: '#f1f5f9',
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '1rem'
        }}>
          {status === 'loading' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p style={{
          color: '#94a3b8',
          fontSize: '1.125rem',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          {message}
        </p>

        {status !== 'loading' && (
          <button
            onClick={handleGoToLogin}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#b91c1c';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#dc2626';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
