import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sidebar as ProSidebar, 
  Menu, 
  MenuItem, 
  SubMenu,
  sidebarClasses,
  menuClasses
} from 'react-pro-sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTasks, 
  faFolder, 
  faUser, 
  faSignOutAlt, 
  faMoon, 
  faSun,
  faProjectDiagram,
  faCog,
  faHome,
  faChartBar,
  faCalendar,
  faInbox
} from '@fortawesome/free-solid-svg-icons';
import { clearAuthData, getCurrentUser } from "../utils/apiCalls/auth";
import "../styles/sidebar.css";

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const isDark = theme === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('theme-dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('theme-dark', newDarkMode);
  };

  const handleLogout = async () => {
    try {
      clearAuthData();
      navigate('/login', { replace: true });
      if (isMobile) onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuClick = () => {
    if (isMobile) onClose();
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
        />
      )}

      <ProSidebar
        collapsed={!isOpen}
        toggled={isOpen}
        onBackdropClick={onClose}
        breakPoint="md"
        backgroundColor={darkMode ? '#1a1a1a' : '#ffffff'}
        rootStyles={{
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: 'none',
          borderRadius: isMobile ? '0' : '0 12px 12px 0',
          boxShadow: darkMode 
            ? '0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2)' 
            : '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          [`.${sidebarClasses.container}`]: {
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            color: darkMode ? '#ffffff' : '#333333',
            background: darkMode 
              ? 'linear-gradient(145deg, #1a1a1a, #1e1e1e)' 
              : 'linear-gradient(145deg, #ffffff, #f8fafc)'
          }
        }}
      >
        {/* Logo Section */}
        <div style={{
          padding: '20px 15px',
          borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}`,
          textAlign: 'center',
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(0, 123, 255, 0.05), rgba(0, 123, 255, 0.1))' 
            : 'linear-gradient(135deg, rgba(0, 123, 255, 0.02), rgba(0, 123, 255, 0.05))'
        }}>
          <Link 
            to="/" 
            onClick={handleMenuClick}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: '10px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 123, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FontAwesomeIcon 
              icon={faProjectDiagram} 
              style={{ fontSize: '24px', color: '#007bff' }}
            />
            {isOpen && (
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #007bff, #0056b3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SynergySphere
              </span>
            )}
          </Link>
        </div>

        {/* Profile Section */}
        {isOpen && (
          <div className="profile-section">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || <FontAwesomeIcon icon={faUser} />}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '5px',
              color: darkMode ? '#ffffff' : '#333333'
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              fontSize: '12px',
              color: darkMode ? '#a0a0a0' : '#666',
              wordBreak: 'break-word'
            }}>
              {user?.email || ''}
            </div>
          </div>
        )}

        {/* Enhanced Menu */}
        <Menu
          rootStyles={{
            [`.${menuClasses.button}`]: {
              backgroundColor: 'transparent',
              color: darkMode ? '#e0e0e0' : '#444444',
              borderRadius: '10px',
              margin: '2px 8px',
              padding: '12px 16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(0, 123, 255, 0.1))' 
                  : 'linear-gradient(135deg, rgba(0, 123, 255, 0.08), rgba(0, 123, 255, 0.1))',
                color: darkMode ? '#ffffff' : '#007bff',
                transform: 'translateX(6px) translateY(-1px)',
                boxShadow: darkMode 
                  ? '0 4px 12px rgba(0, 123, 255, 0.2)' 
                  : '0 4px 12px rgba(0, 123, 255, 0.15)'
              }
            },
            [`.${menuClasses.active} > .${menuClasses.button}`]: {
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: '#ffffff',
              borderLeft: `4px solid #64b5f6`,
              fontWeight: '700',
              transform: 'translateX(4px)',
              boxShadow: '0 6px 20px rgba(0, 123, 255, 0.3), 0 2px 8px rgba(0, 123, 255, 0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0056b3 0%, #007bff 100%)',
                transform: 'translateX(4px) translateY(-1px)'
              }
            },
            [`.${menuClasses.icon}`]: {
              minWidth: '20px',
              marginRight: '12px',
              fontSize: '16px',
              transition: 'transform 0.3s ease'
            },
            [`.${menuClasses.subMenuContent}`]: {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '0 0 12px 12px',
              margin: '0 8px 8px 8px',
              padding: '8px 0',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
              borderTop: 'none'
            }
          }}
        >
          <MenuItem
            icon={<FontAwesomeIcon icon={faHome} />}
            component={<Link to="/dashboard" onClick={handleMenuClick} />}
            active={location.pathname === '/dashboard'}
          >
            Dashboard
          </MenuItem>

          <MenuItem
            icon={<FontAwesomeIcon icon={faTasks} />}
            component={<Link to="/solutions/tasks" onClick={handleMenuClick} />}
            active={location.pathname === '/solutions/tasks'}
          >
            Tasks
          </MenuItem>

          <MenuItem
            icon={<FontAwesomeIcon icon={faFolder} />}
            component={<Link to="/solutions/projects" onClick={handleMenuClick} />}
            active={location.pathname === '/solutions/projects'}
          >
            Projects
          </MenuItem>

          <SubMenu
            icon={<FontAwesomeIcon icon={faUser} />}
            label="Account"
          >
            <MenuItem
              icon={<FontAwesomeIcon icon={faUser} />}
              component={<Link to="/profile" onClick={handleMenuClick} />}
              active={location.pathname === '/profile'}
            >
              Profile
            </MenuItem>
            <MenuItem
              icon={<FontAwesomeIcon icon={faCog} />}
              component={<Link to="/settings" onClick={handleMenuClick} />}
              active={location.pathname === '/settings'}
            >
              Settings
            </MenuItem>
          </SubMenu>

          <MenuItem
            icon={<FontAwesomeIcon icon={darkMode ? faSun : faMoon} />}
            onClick={toggleDarkMode}
            style={{
              borderTop: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}`,
              marginTop: '10px',
              paddingTop: '15px'
            }}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </MenuItem>

          <MenuItem
            icon={<FontAwesomeIcon icon={faSignOutAlt} />}
            onClick={handleLogout}
            style={{
              borderTop: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}`,
              marginTop: '10px',
              paddingTop: '15px',
              color: darkMode ? '#ff6b6b' : '#dc3545'
            }}
            rootStyles={{
              [`.${menuClasses.button}`]: {
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                  color: darkMode ? '#ff8a8a' : '#dc3545'
                }
              }
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </ProSidebar>
    </>
  );
};

export default Sidebar;
