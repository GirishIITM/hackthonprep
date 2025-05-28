import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';
import LoadingIndicator from '../components/LoadingIndicator';
import '../styles/login.css';

import { authAPI, loadingState, saveAuthData } from '../utils/apiCalls/auth';
import registerSvg from '../assets/log.svg';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for message passed from register page or previous navigation
  const from = location.state?.from || "/solutions/tasks"; // Default redirect to tasks

  // Check loading state from the API
  useEffect(() => {
    const checkLoadingState = () => {
      setIsLoading(loadingState.isLoading('auth-login'));
    };
    checkLoadingState();
    const interval = setInterval(checkLoadingState, 100);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authAPI.login(formData.email, formData.email, formData.password);
      saveAuthData(response.access_token, response.refresh_token, response.user);
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.message || 'Failed to login. Please check your credentials.');
    }
  };

  const handleGoogleSuccess = (response) => {
    saveAuthData(response.access_token, response.refresh_token, response.user);
    navigate(from, { replace: true });
  };

  const handleGoogleError = (error) => {
    setError(error || 'Google login failed. Please try again.');
  };

  return (
    <div className="login-split-page">
      <div className="login-left">
        <div className="content">
          <h2>Welcome Back!</h2>
          <p>
            To keep connected with us please login with your personal info.
          </p>
          <Link to="/register" className="btn transparent" id="sign-up-btn">
            Sign up
          </Link>
        </div>
        <img src={registerSvg} alt="Login illustration" className="login-svg-img" />
      </div>
      <div className="login-right">
        <LoadingIndicator loading={isLoading}>
          <div className="login-container">
            <h1 className="login-title">Login into account</h1>
            {error && <div className="error-message">{error}</div>}
            {location.state?.message && <div className="success-message">{location.state.message}</div>}
            <div className="google-auth-section">
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={isLoading}
              />
              <div className="divider">
                <span>OR</span>
              </div>
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="login-email">Email:</label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password">Password:</label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" disabled={isLoading}>Login</button>
            </form>
            <p className="login-link-text">
              <Link to="/forgot-password">Forgot Password?</Link>
            </p>
            
          </div>
        </LoadingIndicator>
      </div>
    </div>
  );
}