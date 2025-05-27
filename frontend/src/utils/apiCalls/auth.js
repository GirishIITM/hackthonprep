import { loadingState } from "./apiRequest";
const API_BASE_URL = "http://localhost:5000";

/**
 * Enhanced API request with loading state tracking
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

  // Add token to headers if available
  const token = localStorage.getItem("token");
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "An error occurred");
    }

    // Reset loading state
    if (loadingKey) {
      loadingState.setLoading(loadingKey, false);
    }

    return result;
  } catch (error) {
    console.error("API request error:", error);

    // Reset loading state on error too
    if (loadingKey) {
      loadingState.setLoading(loadingKey, false);
    }

    throw error;
  }
};

/**
 * Clear authentication data from local storage
 * @returns {void}
 */
const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  loadingState.reset();
  loadingState.setLoading("auth-refresh", false);
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
  return !!localStorage.getItem("token");
};

/**
 * Authentication API functions
 */
const authAPI = {
  /**
   * Register a new user (sends OTP)
   * @param {string} username - Username
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Registration response
   */
  register: (username, email, password) => {
    return apiRequest(
      "/auth/register",
      "POST",
      { username, email, password },
      "auth-register"
    );
  },

  /**
   * Verify OTP and complete registration
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @param {string} username - Username
   * @param {string} password - User password
   * @returns {Promise} - Verification response
   */
  verifyOTP: (email, otp, username, password) => {
    return apiRequest(
      "/auth/verify-otp",
      "POST",
      { email, otp, username, password },
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
   * @param {string} username - Username
   * @param {string} password - User password
   * @returns {Promise} - Login response with token and user data
   */
  login: (username, password) => {
    return apiRequest(
      "/auth/login",
      "POST",
      { username, password },
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
    return apiRequest("/auth/refresh", "POST", null, "auth-refresh");
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
};

/**
 * Save authentication data to local storage
 * @param {string} token - Authentication token
 * @param {object} user - User object
 * @returns {void}
 */
const saveAuthData = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  loadingState.reset();
  loadingState.setLoading("auth-refresh", false);
  loadingState.setLoading("auth-login", false);
  loadingState.setLoading("auth-register", false);
  loadingState.setLoading("auth-verify-otp", false);
  loadingState.setLoading("auth-resend-otp", false);
  loadingState.setLoading("auth-forgot-password", false);
  loadingState.setLoading("auth-reset-password", false);
  loadingState.setLoading("auth-logout", false);
  loadingState.setLoading("auth-update-settings", false);
}
// Reset loading state utility
const resetLoadingState = () => {
  loadingState.reset();
  loadingState.setLoading("auth-refresh", false);
  loadingState.setLoading("auth-login", false);
  loadingState.setLoading("auth-register", false);
  loadingState.setLoading("auth-verify-otp", false);
  loadingState.setLoading("auth-resend-otp", false);
  loadingState.setLoading("auth-forgot-password", false);
  loadingState.setLoading("auth-reset-password", false);
  loadingState.setLoading("auth-logout", false);
  loadingState.setLoading("auth-update-settings", false);
};

export {
  authAPI,
  clearAuthData,
  getCurrentUser,
  isAuthenticated,
  loadingState, resetLoadingState, saveAuthData
};

