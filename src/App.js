import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import EmailVerification from './pages/EmailVerification';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';
import './styles/common.css';

// Wrapper component to use useNavigate hook
const LandingPageWrapper = () => {
  const navigate = useNavigate();
  return (
    <LandingPage 
      onLoginClick={() => navigate('/login')} 
      onSignupClick={() => navigate('/signup')} 
    />
  );
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          const userType = currentUser.profile?.user_type;
          if (userType === 'admin' || userType === 'super_admin') {
            setUser({
              ...currentUser,
              type: userType,
              name: currentUser.profile.full_name || currentUser.profile.username || 'Admin'
            });
          } else {
            console.warn('⚠️ Non-admin session detected, signing out...');
            await authService.signOut();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuthState();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const { user: authUser } = await authService.signIn(email, password);
      if (authUser) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser?.profile?.user_type === 'admin' || currentUser?.profile?.user_type === 'super_admin') {
          setUser({
            ...currentUser,
            type: currentUser.profile.user_type,
            name: currentUser.profile.full_name || currentUser.profile.username || 'User'
          });
          return { success: true };
        } else {
          await authService.signOut();
          return { success: false, error: 'Access denied. This portal is for administrators only.' };
        }
      }
      return { success: false, error: 'Login failed. Please check your credentials.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
  };

  const handleSignup = async (email, password, userData) => {
    try {
      await authService.signUp(email, password, userData);
      return { success: true, message: 'Account created! Please sign in with your credentials.' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/verify-email" element={<EmailVerification />} />
          
          {/* Landing page - only show if not logged in */}
          <Route path="/" element={
            user ? (
              user.type === 'admin' || user.type === 'super_admin' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#000', color: '#fff', minHeight: '100vh' }}>
                  <h2>Access Denied</h2>
                  <p>This portal is for administrators only.</p>
                  <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Sign Out</button>
                </div>
              )
            ) : (
              <LandingPageWrapper />
            )
          } />

          {/* Login page */}
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <AdminLogin onLogin={handleLogin} onSignup={handleSignup} initialView="login" />
          } />

          {/* Signup page */}
          <Route path="/signup" element={
            user ? <Navigate to="/dashboard" replace /> : <AdminLogin onLogin={handleLogin} onSignup={handleSignup} initialView="signup" />
          } />

          {/* Dashboard */}
          <Route path="/dashboard" element={
            user && (user.type === 'admin' || user.type === 'super_admin') ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
