import { faBars, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import "../styles/navbar.css";
import { clearAuthData, authState, isAuthenticated } from '../utils/apiCalls/auth';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);

  // Re-check authentication status when location changes or auth state changes
  useEffect(() => {
    const unsubscribe = authState.subscribe((isAuth) => {
      setAuthenticated(isAuth);
    });
    
    // Initial check
    setAuthenticated(isAuthenticated());
    
    return unsubscribe;
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Call logout API if needed
      // await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      closeMenu();
      navigate('/login', { replace: true });
    }
  };

  // Helper function to check if link is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <i className="fas fa-project-diagram"></i>
          <span>SynergySphere</span>
        </Link>
      </div>

      <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
       { menuOpen?(<FontAwesomeIcon icon={faClose} />):(<FontAwesomeIcon icon={faBars} />)}
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {authenticated && (
          <>
            <Link
              to="/solutions/tasks"
              className={isActive("/solutions/tasks") ? "active" : ""}
              onClick={closeMenu}
            >
              <i className="fas fa-tasks"></i>
              <span>Tasks</span>
            </Link>
            <Link
              to="/solutions/projects"
              className={isActive("/solutions/projects") ? "active" : ""}
              onClick={closeMenu}
            >
              <i className="fas fa-folder-open"></i>
              <span>Projects</span>
            </Link>
          </>
        )}

        <Link
          to="/about"
          className={isActive("/about") ? "active" : ""}
          onClick={closeMenu}
        >
          <i className="fas fa-info-circle"></i>
          <span>About</span>
        </Link>

        {authenticated ? (
          <button
            onClick={handleLogout}
            className="logout-button"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        ) : (
          <>
            <Link
              to="/register"
              className={isActive("/register") ? "active" : ""}
              onClick={closeMenu}
            >
              <i className="fas fa-user-plus"></i>
              <span>Register</span>
            </Link>
            <Link
              to="/login"
              className={isActive("/login") ? "active" : ""}
              onClick={closeMenu}
            >
              <i className="fas fa-sign-in-alt"></i>
              <span>Login</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
