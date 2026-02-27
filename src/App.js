import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import EmailVerification from './pages/EmailVerification';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';
import './styles/common.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser?.profile?.user_type === 'admin') {
          setUser({
            ...currentUser,
            type: 'admin',
            name: currentUser.profile.full_name || currentUser.profile.username || 'Admin'
          });
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
        if (currentUser?.profile?.user_type) {
          setUser({
            ...currentUser,
            type: currentUser.profile.user_type,
            name: currentUser.profile.full_name || currentUser.profile.username || 'User'
          });
          return { success: true };
        } else {
          return { success: false, error: 'Access denied. Invalid user type.' };
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
          <Route path="/" element={
            !user ? (
              <AdminLogin onLogin={handleLogin} onSignup={handleSignup} />
            ) : user.type === 'admin' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>This portal is for administrators only.</p>
                <button onClick={handleLogout}>Sign Out</button>
              </div>
            )
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
