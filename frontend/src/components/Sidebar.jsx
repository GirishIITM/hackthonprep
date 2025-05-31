import { useState } from 'react';
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaCog,
  FaHome,
  FaMoon,
  FaPlus,
  FaProjectDiagram,
  FaSignOutAlt,
  FaSun,
  FaTachometerAlt,
  FaTasks,
  FaUser
} from 'react-icons/fa';
import {
  Menu,
  MenuItem,
  Sidebar as ProSidebar,
  SubMenu
} from 'react-pro-sidebar';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import "../styles/sidebar.css";
import { authAPI } from '../utils/apiCalls/auth';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    document.documentElement.classList.contains('theme-dark')
  );
  const navigate = useNavigate();

  const handleCollapsedChange = () => {
    setCollapsed(!collapsed);
  };

  const handleToggleSidebar = (value) => {
    setToggled(value);
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('theme-dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/');
    }
  };

  return (
    <ProSidebar
      collapsed={collapsed}
      toggled={toggled}
      onToggle={handleToggleSidebar}
      breakPoint="md"
      className='pro-sidebar'
    >
      {/* Custom Header */}
      <div className="sidebar-header">
        <Menu iconShape="circle">
          {collapsed ? (
            <MenuItem
              icon={<FaAngleDoubleRight />}
              onClick={handleCollapsedChange}
            ></MenuItem>
          ) : (
            <MenuItem
              suffix={<FaAngleDoubleLeft />}
              onClick={handleCollapsedChange}
            >
              <div
                style={{
                  padding: '9px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  fontSize: 15,
                  letterSpacing: '1px'
                }}
              >
                SynergySphere
              </div>
            </MenuItem>
          )}
        </Menu>
      </div>

      {/* Main Content */}
      <Menu iconShape="circle">
        {/* Dashboard */}
        <MenuItem icon={<FaTachometerAlt />}>
          Dashboard
          <NavLink to="/dashboard" />
        </MenuItem>

        {/* Home */}
        <MenuItem icon={<FaHome />}>
          Home
          <NavLink to="/" />
        </MenuItem>

        {/* Projects Section */}
        <SubMenu
          title={'Projects'}
          icon={<FaProjectDiagram />}
          suffix={<span className="badge blue">New</span>}
        >
          <MenuItem>
            View All Projects
            <NavLink to="/solutions/projects" />
          </MenuItem>
          <MenuItem icon={<FaPlus />}>
            Create Project
            <NavLink to="/solutions/projects" />
          </MenuItem>
        </SubMenu>

        {/* Tasks Section */}
        <SubMenu
          title={'Tasks'}
          icon={<FaTasks />}
          suffix={<span className="badge green">Hot</span>}
        >
          <MenuItem>
            View All Tasks
            <NavLink to="/solutions/tasks" />
          </MenuItem>
          <MenuItem icon={<FaPlus />}>
            Create Task
            <NavLink to="/solutions/tasks" />
          </MenuItem>
        </SubMenu>

        {/* Profile */}
        <MenuItem icon={<FaUser />}>
          Profile
          <NavLink to="/profile" />
        </MenuItem>

        {/* Settings */}
        <MenuItem icon={<FaCog />}>
          Settings
          <NavLink to="/settings" />
        </MenuItem>

        {/* Theme Toggle */}
        <MenuItem 
          icon={isDarkMode ? <FaSun /> : <FaMoon />}
          onClick={toggleTheme}
          style={{ cursor: 'pointer' }}
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>

        {/* Logout */}
        <MenuItem 
          icon={<FaSignOutAlt />}
          onClick={handleLogout}
          style={{ cursor: 'pointer', color: 'var(--color-error)' }}
        >
          Logout
        </MenuItem>
      </Menu>

      {/* Custom Footer */}
      <div className="sidebar-footer" style={{ textAlign: 'center', padding: '16px' }}>
        <Link
          className="sidebar-btn"
          style={{ cursor: 'pointer' }}
          to="/profile"
        >
          <FaUser />
          <span>My Account</span>
        </Link>
      </div>
    </ProSidebar>
  );
};

export default Sidebar;

