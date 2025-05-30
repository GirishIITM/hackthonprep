import { apiRequest } from './apiRequest.js';

export const profileAPI = {
  getProfile: () => apiRequest('/auth/profile/', 'GET'),
  
  updateProfile: (data) => apiRequest('/auth/profile/', 'PATCH', data),
  
  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return apiRequest('/auth/profile/upload-image/', 'POST', formData, false);
  },

  updateAbout: (about) => apiRequest('/auth/profile/', 'PATCH', { about }),
  
  updateUsername: (username) => apiRequest('/auth/profile/', 'PATCH', { username })
};
