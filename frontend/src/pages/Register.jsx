import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';
import '../styles/register.css';
import { authAPI, loadingState } from '../utils/apiCalls/auth';

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
      setIsLoading(loadingState.isLoading('auth-register'));
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

      console.log('Registration response:', response);

      if (response.msg && response.msg.includes('OTP sent')) {
        setSuccess('Registration successful! Redirecting to email verification...');
        
        // Redirect to OTP verification page with registration data
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

  return (
    <div className="page">
      <LoadingIndicator loading={isLoading}>
        <div className="register-container">
          <h1 className="register-title">Create an account</h1>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

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
          <p className="register-link-text">
            Already have an account?{" "}
            <Link to="/login" id="login-link">
              Login
            </Link>
          </p>
        </div>
      </LoadingIndicator>
    </div>
  );
}
