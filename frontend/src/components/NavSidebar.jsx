import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import "../styles/navSidebar.css";
import { authState, getCurrentUser, isAuthenticated } from "../utils/apiCalls/auth";
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const NavSidebar = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      
      // On mobile, set sidebar to collapsed by default
      if (mobile) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Set initial state
    if (isMobile) {
      setSidebarCollapsed(true);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

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
      <div className="main-layout">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          isMobile={isMobile}
        />
        <div className={`content-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${!sidebarCollapsed && isMobile ? 'sidebar-expanded' : ''}`}>
          <main className="content-area">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default NavSidebar;
