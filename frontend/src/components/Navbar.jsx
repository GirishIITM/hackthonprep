import { faBars, faClose, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import "../styles/navbar.css";
import { clearAuthData, authState, isAuthenticated } from '../utils/apiCalls/auth';

function Navbar({ showWhenAuthenticated = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);

  useEffect(() => {
    const unsubscribe = authState.subscribe((isAuth) => {
      setAuthenticated(isAuth);
    });
    
    setAuthenticated(isAuthenticated());
    return unsubscribe;
  }, []);

  // Don't render navbar for authenticated users unless explicitly allowed
  if (authenticated && !showWhenAuthenticated) {
    return null;
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      clearAuthData();
      closeMenu();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
          <FontAwesomeIcon icon={faProjectDiagram} className="brand-icon" />
          <span>SynergySphere</span>
        </Link>
      </div>

      <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
        <FontAwesomeIcon icon={menuOpen ? faClose : faBars} />
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <Link
          to="/about"
          className={isActive("/about") ? "active" : ""}
          onClick={closeMenu}
        >
          <i className="fas fa-info-circle"></i>
          <span>About</span>
        </Link>

        <Link
          to="/register"
          className={`nav-button register ${isActive("/register") ? "active" : ""}`}
          onClick={closeMenu}
        >
          <i className="fas fa-user-plus"></i>
          <span>Register</span>
        </Link>
        
        <Link
          to="/login"
          className={`nav-button login ${isActive("/login") ? "active" : ""}`}
          onClick={closeMenu}
        >
          <i className="fas fa-sign-in-alt"></i>
          <span>Login</span>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
