const API_BASE_URL = 'http://localhost:5000';

export const loadingState = {
  states: {},
  listeners: {},

  setLoading: (requestKey, isLoading) => {
    loadingState.states[requestKey] = isLoading;
    if (loadingState.listeners[requestKey]) {
      loadingState.listeners[requestKey].forEach(callback => callback(isLoading));
    }
  },

  isLoading: (requestKey) => {
    return !!loadingState.states[requestKey];
  },

  isAnyLoading: () => {
    return Object.values(loadingState.states).some(state => state === true);
  },

  subscribe: (requestKey, callback) => {
    if (!loadingState.listeners[requestKey]) {
      loadingState.listeners[requestKey] = [];
    }
    loadingState.listeners[requestKey].push(callback);
    return () => {
      loadingState.listeners[requestKey] =
        loadingState.listeners[requestKey].filter(cb => cb !== callback);
    };
  }
};

export const apiRequest = async (endpoint, method = 'GET', data = null, loadingKey = null) => {
  if (loadingKey) {
    loadingState.setLoading(loadingKey, true);
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const token = localStorage.getItem('token');
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
      throw new Error(result.error || 'An error occurred');
    }

    if (loadingKey) {
      loadingState.setLoading(loadingKey, false);
    }

    return result;
  } catch (error) {
    console.error('API request error:', error);
    if (loadingKey) {
      loadingState.setLoading(loadingKey, false);
    }
    throw error;
  }
};
