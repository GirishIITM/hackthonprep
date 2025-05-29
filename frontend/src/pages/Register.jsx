import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';
import LoadingIndicator from '../components/LoadingIndicator';
import '../styles/register.css';
import { authAPI, loadingState, saveAuthData } from '../utils/apiCalls/auth';
import registerSvg from '../assets/register.svg'; // Adjust the path as necessary

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check loading state from the API
  useEffect(() => {
    const checkLoadingState = () => {
      setIsLoading(loadingState.isLoading('auth-register') || loadingState.isLoading('auth-google-register'));
    };

    // Set initial state
    checkLoadingState();

    // Set up an interval to check the loading state
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
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await authAPI.register(
        formData.name,
        formData.email,
        formData.password
      );

      if (response.msg && response.msg.includes('OTP sent')) {
        setSuccess('Registration successful! Redirecting to email verification...');
        setTimeout(() => {
          navigate('/verify-otp', {
            state: {
              email: formData.email,
              username: formData.name,
              password: formData.password
            }
          });
        }, 1500);
      }
    } catch (error) {
      setError(error.message || 'Failed to register. Please try again.');
    }
  };

  const handleGoogleSuccess = (response) => {
    saveAuthData(response.access_token, response.refresh_token, response.user);
    navigate('/solutions/tasks', { replace: true });
  };

  const handleGoogleError = (error) => {
    setError(error || 'Google registration failed. Please try again.');
  };

  return (
    <div className="register-split-page">
      <div className="register-left">
        <div className="content">
          <h2>New here?</h2>
          <p>
            Create and manage projects, 
            Collaborate with team members,
            Track tasks and progress,
            Send and receive notifications,
          </p>
          <Link to="/login" id="login-btn">
            <button className="btn transparent">login</button>
          </Link>
        </div>
        <img src={registerSvg} alt="Register illustration" className="register-svg-img" />
      </div>
      <div className="register-right">
        <LoadingIndicator loading={isLoading}>
          <div className="register-container">
            <h1 className="register-title">Create an account</h1>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="google-auth-section">
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={isLoading}
                mode="register"
              />
              <div className="divider">
                <span>OR</span>
              </div>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="register-name">Name:</label>
                <input
                  type="text"
                  id="register-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="register-email">Email:</label>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="register-password">Password:</label>
                <input
                  type="password"
                  id="register-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="register-confirm-password">Confirm Password:</label>
                <input
                  type="password"
                  id="register-confirm-password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" disabled={isLoading}>
                Create an account
              </button>
            </form>
            <div className="contentt mobile-only">
              <p className="center-text">
                have an account?
                <a className="btnn" id="sign-up-btn" href="/login" data-discover="true">login</a>
              </p>
            </div>
          </div>
        </LoadingIndicator>
      </div>
    </div>
  );
}