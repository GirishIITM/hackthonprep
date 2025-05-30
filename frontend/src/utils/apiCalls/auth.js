import { loadingState } from "./apiRequest";
const API_BASE_URL = "http://localhost:5000";

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired
 */
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Enhanced API request with loading state tracking and token refresh
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} data - Request payload
 * @param {string} loadingKey - Optional key to track loading state
 * @returns {Promise} - Response promise
 */
const apiRequest = async (
  endpoint,
  method = "GET",
  data = null,
  loadingKey = null
) => {
  // Set loading state if loadingKey is provided
  if (loadingKey) {
    loadingState.setLoading(loadingKey, true);
  }

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Check and refresh token if needed (except for auth endpoints)
  if (!endpoint.startsWith("/auth/")) {
    await ensureValidToken();
  }

  // Add token to headers if available
  const token = localStorage.getItem("access_token");
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    // Handle non-JSON responses (like HTML error pages)
    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      result = { error: `Server returned non-JSON response: ${response.status}` };
    }

    // Reset loading state
    if (loadingKey) {
      loadingState.setLoading(loadingKey, false);
    }

    // Handle token expiration
    if (response.status === 401 && result.error === "Token has expired") {
      const refreshSuccess = await handleTokenRefresh();
      if (refreshSuccess) {
        // Retry the original request with new token
        return apiRequest(endpoint, method, data, loadingKey);
      } else {
        throw new Error("Session expired. Please login again.");
      }
    }

    if (!response.ok) {
      throw new Error(result.error || result.msg || "An error occurred");
    }

    return result;
  } catch (error) {
    console.error("API request error:", error);

    // Reset loading state on error too
    if (loadingKey) {
      loadingState.setLoading(loadingKey, false);
    }

    // Enhanced error handling for network issues
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to server. Please check if the backend server is running on http://localhost:5000');
    }
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The server took too long to respond.');
    }

    throw error;
  }
};

/**
 * Ensure we have a valid access token
 */
const ensureValidToken = async () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (!accessToken || !refreshToken) {
    return;
  }

  if (isTokenExpired(accessToken)) {
    await handleTokenRefresh();
  }
};

/**
 * Handle token refresh
 * @returns {boolean} - True if refresh successful, false otherwise
 */
const handleTokenRefresh = async () => {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken || isTokenExpired(refreshToken)) {
    clearAuthData();
    window.location.href = "/login";
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.access_token) {
      localStorage.setItem("access_token", result.access_token);
      if (result.refresh_token) {
        localStorage.setItem("refresh_token", result.refresh_token);
      }
      return true;
    } else {
      clearAuthData();
      window.location.href = "/login";
      return false;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearAuthData();
    window.location.href = "/login";
    return false;
  }
};

/**
 * Authentication state management
 */
const authState = {
  listeners: new Set(),
  isAuthenticated: false,

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  notify() {
    this.listeners.forEach((callback) => callback(this.isAuthenticated));
  },

  setAuthenticated(value) {
    if (this.isAuthenticated !== value) {
      this.isAuthenticated = value;
      this.notify();
    }
  },
};

/**
 * Clear authentication data from local storage
 * @returns {void}
 */
const clearAuthData = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  loadingState.reset();
  loadingState.setLoading("auth-refresh", false);
  authState.setAuthenticated(false);
};

/**
 * Get the current user from local storage
 * @returns {object|null} - User object or null if not found
 */
const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

/**
 * Check if the user is authenticated
 * @returns {boolean} - True if authenticated, false otherwise
 */
const isAuthenticated = () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const isAuth = !!(
    accessToken &&
    refreshToken &&
    !isTokenExpired(refreshToken)
  );
  authState.setAuthenticated(isAuth);
  return isAuth;
};

/**
 * Authentication API functions
 */
const authAPI = {
  /**
   * Register a new user (sends OTP)
   * @param {string} fullName - User's full name
   * @param {string} username - Username
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Registration response
   */
  register: (fullName, username, email, password) => {
    return apiRequest(
      "/auth/register",
      "POST",
      { full_name: fullName, username, email, password },
      "auth-register"
    );
  },

  /**
   * Verify OTP and complete registration
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @param {string} fullName - User's full name
   * @param {string} username - Username
   * @param {string} password - User password
   * @returns {Promise} - Verification response
   */
  verifyOTP: (email, otp, fullName, username, password) => {
    return apiRequest(
      "/auth/verify-otp",
      "POST",
      { email, otp, full_name: fullName, username, password },
      "auth-verify-otp"
    );
  },

  /**
   * Resend OTP for email verification
   * @param {string} email - User email
   * @param {string} username - Username (optional)
   * @returns {Promise} - Resend OTP response
   */
  resendOTP: (email, username = "User") => {
    return apiRequest(
      "/auth/resend-otp",
      "POST",
      { email, username },
      "auth-resend-otp"
    );
  },

  /**
   * Login an existing user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Login response with token and user data
   */
  login: (email, password) => {
    return apiRequest(
      "/auth/login",
      "POST",
      { username: email, email, password },
      "auth-login"
    );
  },

  /**
   * Request password reset for an email
   * @param {string} email - User email
   * @returns {Promise} - Password reset response
   */
  forgotPassword: (email) => {
    return apiRequest(
      "/auth/forgot-password",
      "POST",
      { email },
      "auth-forgot-password"
    );
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} new_password - New password
   * @returns {Promise} - Reset password response
   */
  resetPassword: (token, new_password) => {
    return apiRequest(
      "/auth/reset-password",
      "POST",
      { token, new_password },
      "auth-reset-password"
    );
  },

  /**
   * Refresh access token
   * @returns {Promise} - Refresh token response
   */
  refreshToken: () => {
    const refreshToken = localStorage.getItem("refresh_token");
    return fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    }).then((response) => response.json());
  },

  /**
   * Logout the current user
   * @returns {Promise} - Logout response
   */
  logout: () => {
    return apiRequest("/auth/logout", "DELETE", null, "auth-logout");
  },

  /**
   * Update user settings
   * @param {object} settings - Settings object (notify_email, notify_in_app)
   * @returns {Promise} - Settings update response
   */
  updateSettings: (settings) => {
    return apiRequest(
      "/auth/settings",
      "PUT",
      settings,
      "auth-update-settings"
    );
  },

  /**
   * Register with Google OAuth
   * @param {string} googleToken - Google OAuth token
   * @returns {Promise} - Google register response
   */
  googleRegister: (googleToken) => {
    return apiRequest(
      "/auth/google-register",
      "POST",
      { token: googleToken },
      "auth-google-register"
    );
  },

  /**
   * Login with Google OAuth
   * @param {string} googleToken - Google OAuth token
   * @returns {Promise} - Google login response
   */
  googleLogin: (googleToken) => {
    return apiRequest(
      "/auth/google-login",
      "POST",
      { token: googleToken },
      "auth-google-login"
    );
  },

  /**
   * Get Google OAuth client ID
   * @returns {Promise} - Client ID response
   */
  getGoogleClientId: () => {
    return apiRequest(
      "/auth/google/client-id",
      "GET",
      null,
      "auth-google-client-id"
    );
  },

  /**
   * Get current user from backend
   * @returns {Promise} - User data response
   */
  getCurrentUserFromBackend: () => {
    return apiRequest('/profile', 'GET', null, 'auth-get-profile');
  },
};

/**
 * Profile API functions
 */
const profileAPI = {
  /**
   * Get current user profile
   * @returns {Promise} - Profile data response
   */
  getProfile: () => {
    return apiRequest("/profile", "GET", null, "profile-get");
  },

  /**
   * Update user profile
   * @param {object} profileData - Profile data to update
   * @returns {Promise} - Update response
   */
  updateProfile: (profileData) => {
    return apiRequest("/profile", "PUT", profileData, "profile-update");
  },

  /**
   * Upload profile image
   * @param {File} imageFile - Image file to upload
   * @returns {Promise} - Upload response
   */
  uploadProfileImage: (imageFile) => {
    const formData = new FormData();
    formData.append('profile_image', imageFile);
    
    return new Promise(async (resolve, reject) => {
      try {
        loadingState.setLoading("profile-image-upload", true);
        
        await ensureValidToken();
        const token = localStorage.getItem("access_token");
        
        const response = await fetch(`${API_BASE_URL}/profile/upload-image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();
        loadingState.setLoading("profile-image-upload", false);

        if (!response.ok) {
          throw new Error(result.error || "Image upload failed");
        }

        resolve(result);
      } catch (error) {
        loadingState.setLoading("profile-image-upload", false);
        reject(error);
      }
    });
  },
};

/**
 * Save authentication data to local storage
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {object} user - User object
 * @returns {void}
 */
const saveAuthData = (accessToken, refreshToken, user) => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
  resetLoadingState();
  authState.setAuthenticated(true);
};

// Reset loading state utility
const resetLoadingState = () => {
  const loadingKeys = [
    "auth-refresh",
    "auth-login",
    "auth-google-login",
    "auth-google-register",
    "auth-google-client-id",
    "auth-register",
    "auth-verify-otp",
    "auth-resend-otp",
    "auth-forgot-password",
    "auth-reset-password",
    "auth-logout",
    "auth-update-settings",
    "profile-image-upload", 
  ];

  loadingState.reset();
  loadingKeys.forEach((key) => loadingState.setLoading(key, false));
};

export {
  authAPI,
  profileAPI,
  authState,
  clearAuthData,
  getCurrentUser,
  isAuthenticated,
  loadingState,
  resetLoadingState,
  saveAuthData,
};

