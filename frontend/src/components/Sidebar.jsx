import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import "../styles/sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    let theme = localStorage.getItem('theme');
    console.log("theme", theme);
    setDarkMode(true);
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('theme-dark');
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''} ${darkMode ? 'dark' : ''}`}>
      <div className="navigation-section">
        <ul className="nav-list">
          <li className={`nav-item ${location.pathname === "/solutions/tasks" ? "active" : ""}`}>
            <Link
              to="/solutions/tasks"
              onClick={onClose}
            >
              <span className="nav-icon">📋</span>
              Tasks
            </Link>
          </li>
          <li className={`nav-item ${location.pathname === "/solutions/projects" ? "active" : ""}`}>
            <Link
              to="/solutions/projects"
              onClick={onClose}
            >
              <span className="nav-icon">📁</span>
              Projects
            </Link>
          </li>
        </ul>
      </div>
      <button className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

    </div>
  );
};

export default Sidebar;
