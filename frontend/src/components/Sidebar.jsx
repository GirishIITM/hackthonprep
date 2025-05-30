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
  faHome
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
          zIndex: 1000, // Increased z-index to be above overlay
          transition: 'all 0.3s ease',
          border: 'none',
          boxShadow: darkMode 
            ? '2px 0 15px rgba(0, 0, 0, 0.4)' 
            : '2px 0 15px rgba(0, 0, 0, 0.08)',
          [`.${sidebarClasses.container}`]: {
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            color: darkMode ? '#ffffff' : '#333333'
          }
        }}
      >
        {/* Logo Section */}
        <div style={{
          padding: '20px 15px',
          borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}`,
          textAlign: 'center'
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
              transition: 'all 0.2s ease',
              ':hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 123, 255, 0.05)'
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 123, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
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
          <div style={{
            padding: '20px 15px',
            borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}`,
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#007bff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '24px',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: darkMode 
                ? '0 4px 12px rgba(0, 123, 255, 0.3)' 
                : '0 4px 12px rgba(0, 123, 255, 0.2)',
              transition: 'transform 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            >
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

        <Menu
          rootStyles={{
            [`.${menuClasses.button}`]: {
              backgroundColor: 'transparent',
              color: darkMode ? '#e0e0e0' : '#444444',
              borderRadius: '8px',
              margin: '2px 8px',
              padding: '12px 16px',
              transition: 'all 0.2s ease',
              border: 'none',
              borderLeft: 'none',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 123, 255, 0.08)',
                color: darkMode ? '#ffffff' : '#007bff',
                transform: 'translateX(4px)'
              }
            },
            [`.${menuClasses.active} > .${menuClasses.button}`]: {
              backgroundColor: darkMode ? 'rgba(0, 123, 255, 0.2)' : 'rgba(0, 123, 255, 0.12)',
              color: darkMode ? '#64b5f6' : '#0056b3',
              borderLeft: `3px solid ${darkMode ? '#64b5f6' : '#007bff'}`,
              fontWeight: '600',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(0, 123, 255, 0.25)' : 'rgba(0, 123, 255, 0.15)',
                transform: 'translateX(2px)'
              }
            },
            [`.${menuClasses.icon}`]: {
              minWidth: '20px',
              marginRight: '12px',
              fontSize: '16px'
            },
            // Submenu container styling
            [`.${menuClasses.subMenuContent}`]: {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '0 0 12px 12px',
              margin: '0 8px 8px 8px',
              padding: '8px 0',
              overflow: 'hidden',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
              borderTop: 'none',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '20px',
                top: '0',
                bottom: '0',
                width: '2px',
                backgroundColor: darkMode ? 'rgba(100, 181, 246, 0.3)' : 'rgba(0, 123, 255, 0.2)',
                borderRadius: '1px'
              }
            },
            // Submenu items styling
            [`.${menuClasses.subMenuContent} .${menuClasses.button}`]: {
              borderLeft: 'none !important',
              margin: '2px 12px 2px 32px', // Increased left margin for tree indentation
              padding: '10px 16px',
              fontSize: '14px',
              backgroundColor: 'transparent',
              borderRadius: '6px',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-20px',
                top: '50%',
                width: '12px',
                height: '2px',
                backgroundColor: darkMode ? 'rgba(100, 181, 246, 0.4)' : 'rgba(0, 123, 255, 0.3)',
                borderRadius: '1px',
                transform: 'translateY(-50%)'
              },
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 123, 255, 0.05)',
                color: darkMode ? '#ffffff' : '#007bff',
                transform: 'translateX(4px)',
                boxShadow: darkMode 
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                  : '0 2px 8px rgba(0, 123, 255, 0.1)'
              }
            },
            // Active submenu item styling
            [`.${menuClasses.subMenuContent} .${menuClasses.active} > .${menuClasses.button}`]: {
              backgroundColor: darkMode ? 'rgba(0, 123, 255, 0.15)' : 'rgba(0, 123, 255, 0.08)',
              color: darkMode ? '#64b5f6' : '#0056b3',
              fontWeight: '600',
              borderLeft: `2px solid ${darkMode ? '#64b5f6' : '#007bff'}`,
              marginLeft: '30px',
              '&::before': {
                backgroundColor: darkMode ? '#64b5f6' : '#007bff',
                width: '16px',
                height: '3px'
              },
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(0, 123, 255, 0.2)' : 'rgba(0, 123, 255, 0.12)',
                transform: 'translateX(2px)'
              }
            },
            // Submenu icon styling
            [`.${menuClasses.subMenuContent} .${menuClasses.icon}`]: {
              minWidth: '16px',
              marginRight: '10px',
              fontSize: '14px',
              opacity: 0.8
            },
            // Parent menu item with submenu styling
            [`.${menuClasses.button}[aria-expanded="true"]`]: {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 123, 255, 0.05)',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
              marginBottom: '0',
              '&:hover': {
                transform: 'none'
              }
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
            style={{
              '& > .pro-menu-item': {
                marginBottom: '0'
              }
            }}
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
