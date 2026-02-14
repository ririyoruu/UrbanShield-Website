import React, { useState, useEffect } from 'react';
import SimpleAuth from './components/SimpleAuth';
import AdminDashboard from './components/AdminDashboard';
import ModernLoginModal from './components/ModernLoginModal';
import ModernSignupModal from './components/ModernSignupModal';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';
import './styles/common.css';

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Skip loading screen for now

  useEffect(() => {
    // Simplified auth check - only run when needed
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
        // Ignore errors and just show landing page
      }
    };

    checkAuthState();
  }, []);

  // Removed checkUser function - simplified in useEffect above

  const handleLogin = async (email, password) => {
    try {
      const { user: authUser } = await authService.signIn(email, password);
      
      if (authUser) {
        const currentUser = await authService.getCurrentUser();
        
        // Allow admin and other user types to login
        if (currentUser?.profile?.user_type) {
          setUser({
            ...currentUser,
            type: currentUser.profile.user_type,
            name: currentUser.profile.full_name || currentUser.profile.username || 'User'
          });
          setShowLoginModal(false);
          return { success: true };
        } else {
          return { success: false, error: 'Access denied. Invalid user type.' };
        }
      } else {
        return { success: false, error: 'Login failed. Please check your credentials.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred during login.' };
    }
  };

  const handleSignup = async (email, password, userData) => {
    try {
      await authService.signUp(email, password, userData);
      setShowSignupModal(false);
      // Show login modal after successful signup
      setTimeout(() => {
        setShowLoginModal(true);
      }, 1000);
      return { success: true, message: 'Account created successfully! Please log in with your credentials.' };
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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        {!user ? (
          <SimpleAuth 
            onLoginClick={() => setShowLoginModal(true)}
            onSignupClick={() => setShowSignupModal(true)}
          />
        ) : (
          user.type === 'admin' ? (
            <AdminDashboard user={user} onLogout={handleLogout} />
          ) : (
            <div className="user-dashboard">
              <h1>Welcome, {user.name}!</h1>
              <p>Your account type: {user.type}</p>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )
        )}

          {showLoginModal && (
            <ModernLoginModal
              onClose={() => setShowLoginModal(false)}
              onLogin={handleLogin}
              onSwitchToSignup={() => {
                setShowLoginModal(false);
                setShowSignupModal(true);
              }}
            />
          )}

          {showSignupModal && (
            <ModernSignupModal
              onClose={() => setShowSignupModal(false)}
              onSignup={handleSignup}
              onSwitchToLogin={() => {
                setShowSignupModal(false);
                setShowLoginModal(true);
              }}
            />
          )}

      </div>
    </ThemeProvider>
  );
}

export default App;
