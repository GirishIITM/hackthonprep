import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';
import '../styles/verifyOTP.css';
import { authAPI, loadingState } from '../utils/apiCalls/auth';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get registration data from location state
  const { email, username, password } = location.state || {};

  // Redirect if no registration data
  useEffect(() => {
    if (!email || !username || !password) {
      navigate('/register', { replace: true });
    }
  }, [email, username, password, navigate]);

  // Check loading states
  useEffect(() => {
    const checkLoadingStates = () => {
      setIsVerifying(loadingState.isLoading('auth-verify-otp'));
      setIsResending(loadingState.isLoading('auth-resend-otp'));
    };

    checkLoadingStates();
    const interval = setInterval(checkLoadingStates, 100);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    try {
      const response = await authAPI.verifyOTP(email, otp, username, password);
      
      if (response.msg === "Registration completed successfully") {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration completed! Please log in with your credentials.' 
            } 
          });
        }, 2000);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setError('');
    setSuccess('');
    setCanResend(false);
    setCountdown(60);

    try {
      const response = await authAPI.resendOTP(email, username);
      setSuccess('New OTP sent to your email!');
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError(error.message || 'Failed to resend OTP. Please try again.');
      setCanResend(true);
      setCountdown(0);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  // Don't render if no registration data
  if (!email) {
    return null;
  }

  return (
    <div className="page">
      <LoadingIndicator loading={isVerifying || isResending}>
        <div className="verify-otp-container">
          <h1 className="verify-otp-title">Verify Your Email</h1>
          
          <p className="verify-otp-subtitle">
            We've sent a 6-digit verification code to:
            <br />
            <strong>{email}</strong>
          </p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form className="verify-otp-form" onSubmit={handleSubmit}>
            <div className="otp-input-container">
              <label htmlFor="otp-input">Enter OTP:</label>
              <input
                type="text"
                id="otp-input"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength="6"
                className="otp-input"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isVerifying || otp.length !== 6}
              className="verify-button"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="resend-section">
            <p>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || isResending}
              className="resend-button"
            >
              {isResending ? 'Sending...' : 
               !canResend ? `Resend in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>

          <div className="back-to-register">
            <Link to="/register" className="back-link">
              ← Back to Registration
            </Link>
          </div>
        </div>
      </LoadingIndicator>
    </div>
  );
}
