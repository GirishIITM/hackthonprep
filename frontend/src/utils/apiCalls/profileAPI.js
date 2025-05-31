import { apiRequest } from '/src/utils/apiCalls/apiRequest.js';

export const profileAPI = {
  getProfile: () => apiRequest('/profile', 'GET'),

  updateProfile: (data) => apiRequest('/profile', 'PUT', data),

  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('profile_image', file);
    return apiRequest('/profile/upload-image', 'POST', formData, false);
  },

  updateAbout: (about) => apiRequest('/profile', 'PUT', { about }),

  updateUsername: (username) => apiRequest('/profile', 'PUT', { username })
};
