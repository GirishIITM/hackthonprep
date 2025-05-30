import { useEffect, useState } from 'react';
import { authAPI } from '../utils/apiCalls/auth';

const GoogleLoginButton = ({ onSuccess, onError, disabled = false, mode = 'login' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [initError, setInitError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  useEffect(() => {
    fetchClientIdWithRetry();
  }, [onError]);

  const fetchClientIdWithRetry = async (attempt = 0) => {
    try {
      setInitError(null);
      const response = await authAPI.getGoogleClientId();
      setClientId(response.client_id);
      setRetryCount(0);
    } catch (error) {
      console.error(`Failed to get Google client ID (attempt ${attempt + 1}):`, error);
      
      // Check if it's a server connectivity issue
      const isServerError = error.message.includes('Unable to connect to server') || 
                           error.message.includes('Failed to fetch');
      
      if (attempt < MAX_RETRIES && !isServerError) {
        setRetryCount(attempt + 1);
        setTimeout(() => {
          fetchClientIdWithRetry(attempt + 1);
        }, RETRY_DELAY * (attempt + 1)); // Exponential backoff
      } else {
        const errorMessage = isServerError 
          ? 'Backend server is not available. Please check if the server is running.'
          : (error.message || 'Failed to initialize Google OAuth');
        setInitError(errorMessage);
        onError?.(errorMessage);
      }
    }
  };

  useEffect(() => {
    if (!clientId) return;

    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleOAuth;
    script.onerror = () => {
      setInitError('Failed to load Google OAuth script');
      onError?.('Failed to load Google OAuth script');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [clientId]);

  const initializeGoogleOAuth = () => {
    if (window.google && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (error) {
        console.error('Failed to initialize Google OAuth:', error);
        setInitError('Failed to initialize Google OAuth');
        onError?.('Failed to initialize Google OAuth');
      }
    }
  };

  const handleGoogleResponse = async (response) => {
    setIsLoading(true);
    try {
      let result;
      if (mode === 'register') {
        result = await authAPI.googleRegister(response.credential);
      } else {
        result = await authAPI.googleLogin(response.credential);
      }
      onSuccess(result);
    } catch (error) {
      console.error('Google authentication failed:', error);
      onError(error.message || `Google ${mode} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (!window.google || disabled || isLoading || !clientId || initError) return;

    try {
      setIsLoading(true);
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsLoading(false);
          onError?.('Google authentication was cancelled or unavailable');
        }
      });
    } catch (error) {
      console.error('Failed to trigger Google authentication:', error);
      setIsLoading(false);
      onError?.('Failed to trigger Google authentication');
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setInitError(null);
    fetchClientIdWithRetry();
  };

  // Show error state with retry option
  if (initError) {
    return (
      <div style={{ textAlign: 'center', padding: '12px' }}>
        <div style={{ 
          color: '#d93025', 
          fontSize: '14px', 
          marginBottom: '8px' 
        }}>
          {initError.includes('server') ? 'Server connection failed' : 'Google authentication is currently unavailable'}
        </div>
        <div style={{ 
          color: '#5f6368', 
          fontSize: '12px', 
          marginBottom: '8px' 
        }}>
          {initError}
        </div>
        <button
          type="button"
          onClick={handleRetry}
          style={{
            padding: '8px 16px',
            border: '1px solid #dadce0',
            borderRadius: '4px',
            backgroundColor: '#fff',
            color: '#3c4043',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state while fetching client ID
  if (!clientId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '12px',
        border: '1px solid #dadce0',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
        color: '#5f6368',
        fontSize: '14px',
      }}>
        {retryCount > 0 ? (
          <>
            <div className="spinner" style={{
              width: '16px',
              height: '16px',
              border: '2px solid #dadce0',
              borderTop: '2px solid #4285f4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Retrying... ({retryCount}/{MAX_RETRIES})
          </>
        ) : (
          'Loading Google OAuth...'
        )}
      </div>
    );
  }

  const buttonText = mode === 'register' 
    ? (isLoading ? 'Creating account...' : 'Continue with Google') 
    : (isLoading ? 'Signing in...' : 'Continue with Google');

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={disabled || isLoading || !clientId || initError}
        className="google-login-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '12px',
          border: '1px solid #dadce0',
          borderRadius: '4px',
          backgroundColor: '#fff',
          color: '#3c4043',
          fontSize: '14px',
          fontWeight: '500',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled || isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? (
          <div className="spinner" style={{
            width: '18px',
            height: '18px',
            border: '2px solid #dadce0',
            borderTop: '2px solid #4285f4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {buttonText}
      </button>
    </>
  );
};

export default GoogleLoginButton;
