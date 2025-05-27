import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/resetpassword.css';

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Replace this with your API call for password reset
      // await api.resetPassword(formData.email, formData.password);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (

      <div className="reset-container">
        <h1 className="reset-title">Reset Password</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form className="reset-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="reset-email">Email:</label>
            <input
              type="email"
              id="reset-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="reset-password">New Password:</label>
            <input
              type="password"
              id="reset-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="reset-confirm-password">Confirm New Password:</label>
            <input
              type="password"
              id="reset-confirm-password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>

  );
}