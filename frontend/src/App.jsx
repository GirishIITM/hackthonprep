import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import NavSidebar from './components/NavSidebar';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Projects from './pages/solutions/Projects';
import Tasks from './pages/solutions/Tasks';
import VerifyOTP from './pages/VerifyOTP';
import { authState, isAuthenticated } from './utils/apiCalls/auth';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = authState.subscribe((isAuth) => {
      setAuthenticated(isAuth);
    });
    
    // Initial authentication check
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      setIsLoading(false);
    };
    
    checkAuth();
    
    return unsubscribe;
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <main>
          <Routes>
            {/* Public routes */}
            <Route path='/register' element={
              <>
                <Navbar />
                {authenticated ? <Navigate to="/dashboard" replace /> : <Register />}
              </>
            } />
            
            {/* OTP Verification route */}
            <Route path='/verify-otp' element={
              <>
                <Navbar />
                {authenticated ? <Navigate to="/dashboard" replace /> : <VerifyOTP />}
              </>
            } />
            
            <Route path='/login' element={
              <>
                <Navbar />
                {authenticated ? <Navigate to="/dashboard" replace /> : <Login />}
              </>
            } />
            <Route path='/about' element={
              <>
                <Navbar showWhenAuthenticated={true} />
                <About />
              </>
            } />

            {/* Add Google OAuth callback route */}
            <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />

            {/* Add this route for Reset Password */}
            <Route path="/reset-password" element={
              <>
                <Navbar />
                <ResetPassword />
              </>
            } />

            {/* Forgot password route */}
            <Route path="/forgot-password" element={
              <>
                <Navbar />
                <ForgotPassword />
              </>
            } />

            {/* Home page - accessible to everyone, no redirection for authenticated users */}
            <Route path='/' element={
              <>
                <Navbar showWhenAuthenticated={true} />
                <Home />
              </>
            } />

            {/* Protected routes with NavSidebar */}
            <Route path='/dashboard' element={
              <PrivateRoute>
                <NavSidebar>
                  <Dashboard />
                </NavSidebar>
              </PrivateRoute>
            } />
            
            <Route path='/solutions/tasks' element={
              <PrivateRoute>
                <NavSidebar>
                  <Tasks />
                </NavSidebar>
              </PrivateRoute>
            } />
            
            <Route path='/solutions/projects' element={
              <PrivateRoute>
                <NavSidebar>
                  <Projects />
                </NavSidebar>
              </PrivateRoute>
            } />

            <Route path='/settings' element={
              <PrivateRoute>
                <NavSidebar>
                  <Settings />
                </NavSidebar>
              </PrivateRoute>
            } />

            {/* Profile route - protected and with NavSidebar */}
            <Route path='/profile' element={
              <PrivateRoute>
                <NavSidebar>
                  <Profile />
                </NavSidebar>
              </PrivateRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// Google OAuth callback component for handling popup authentication
const GoogleOAuthCallback = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    if (error) {
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      }, window.location.origin);
      window.close();
      return;
    }

    if (code) {
      // Convert authorization code to credential token via backend
      fetch(`${window.location.origin}/api/auth/google/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state })
      })
      .then(response => response.json())
      .then(data => {
        if (data.credential) {
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            credential: data.credential
          }, window.location.origin);
        } else {
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: 'Failed to exchange authorization code'
          }, window.location.origin);
        }
        window.close();
      })
      .catch(error => {
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error.message || 'Authentication failed'
        }, window.location.origin);
        window.close();
      });
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '16px'
    }}>
      Processing authentication...
    </div>
  );
};

export default App;
