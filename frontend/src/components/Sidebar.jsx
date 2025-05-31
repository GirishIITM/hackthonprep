import { useState } from 'react';
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaCog,
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
import { NavLink, useNavigate } from 'react-router-dom';
import "../styles/sidebar.css";
import { authAPI } from '../utils/apiCalls/auth';

const Sidebar = ({ collapsed, onCollapsedChange, isMobile }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    document.documentElement.classList.contains('theme-dark')
  );
  const navigate = useNavigate();

  const handleCollapsedChange = () => {
    if (onCollapsedChange) {
      onCollapsedChange(!collapsed);
    }
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
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/');
    }
  };

  return (
    <ProSidebar
      collapsed={collapsed}
      breakPoint="never"
      className='pro-sidebar'
    >
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
                  fontSize: '15px',
                  letterSpacing: '1px',
                  color: 'var(--color-text)',
                  display: 'block'
                }}
              >
                SynergySphere
              </div>
            </MenuItem>
          )}
        </Menu>
      </div>

      <Menu iconShape="circle">
        <MenuItem icon={<FaTachometerAlt />} component={<NavLink to="/dashboard" />}>
          Dashboard
        </MenuItem>

        <SubMenu
          label='Solutions' 
          icon={<FaProjectDiagram />}
        >
          <MenuItem component={<NavLink to="/solutions/projects" />}>
            View All Projects
          </MenuItem>
          <MenuItem icon={<FaPlus />} component={<NavLink to="/solutions/projects/create" />}>
            Create Project
          </MenuItem>
        </SubMenu>

        <SubMenu
          label={'Tasks'}
          icon={<FaTasks />}
        >
          <MenuItem component={<NavLink to="/solutions/tasks" />}>
            View All Tasks
          </MenuItem>
          <MenuItem icon={<FaPlus />} component={<NavLink to="/solutions/tasks/create" />}>
            Create Task
          </MenuItem>
        </SubMenu>

        <MenuItem icon={<FaUser />} component={<NavLink to="/profile" />}>
          Profile
        </MenuItem>

        <MenuItem icon={<FaCog />} component={<NavLink to="/settings" />}>
          Settings
        </MenuItem>

        <MenuItem 
          icon={isDarkMode ? <FaSun /> : <FaMoon />}
          onClick={toggleTheme}
          style={{ cursor: 'pointer' }}
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>

        <MenuItem 
          icon={<FaSignOutAlt />}
          onClick={handleLogout}
          style={{ cursor: 'pointer', color: 'var(--color-error)' }}
        >
          Logout
        </MenuItem>
      </Menu>
    </ProSidebar>
  );
};

export default Sidebar;

