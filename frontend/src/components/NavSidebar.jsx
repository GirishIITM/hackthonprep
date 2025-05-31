import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import "../styles/navSidebar.css";
import { authState, getCurrentUser, isAuthenticated } from "../utils/apiCalls/auth";
import Navbar from './Navbar';
import Sidebar from './Sidebar';

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
        <div className="mobile-topbar">
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar} 
            aria-label="Toggle sidebar"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="mobile-brand">
            SynergySphere
          </div>
        </div>
      )}

      <div className={`main-layout ${isMobile ? 'mobile-layout' : ''}`}>
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={closeSidebar}
            isMobile={isMobile}
          />
        </div>
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
