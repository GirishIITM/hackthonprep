import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import "../styles/navSidebar.css";
import { authState, getCurrentUser, isAuthenticated } from "../utils/apiCalls/auth";
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const NavSidebar = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [user, setUser] = useState(getCurrentUser);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const location = useLocation();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = authState.subscribe((isAuth) => {
      setAuthenticated(isAuth);
      setUser(getCurrentUser());
    });
    
    return unsubscribe;
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && sidebarOpen) {
        setSidebarOpen(true); // Keep sidebar open on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Auto-open sidebar on desktop for authenticated users
  useEffect(() => {
    if (authenticated && !isMobile) {
      setSidebarOpen(true);
    } else if (!authenticated || isMobile) {
      setSidebarOpen(false);
    }
  }, [authenticated, isMobile]);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Show regular navbar for non-authenticated users OR for home page only
  if (!authenticated || location.pathname === '/') {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          {children}
        </main>
      </div>
    );
  }

  // Show sidebar layout for authenticated users
  return (
    <div className="nav-container">
      {/* Top bar for mobile */}
      {isMobile && (
        <div className="mobile-topbar" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          zIndex: 997,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar} 
            aria-label="Toggle sidebar"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#333',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 123, 255, 0.08)';
              e.currentTarget.style.color = '#007bff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#333';
            }}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="mobile-brand" style={{
            marginLeft: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#007bff'
          }}>
            SynergySphere
          </div>
        </div>
      )}

      <div className="main-layout" style={{
        paddingTop: isMobile ? '60px' : '0'
      }}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          isMobile={isMobile}
        />
        <div className={`content-wrapper ${sidebarOpen && !isMobile ? 'with-sidebar' : ''}`}>
          <main className="content-area">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default NavSidebar;
