import { apiRequest } from './apiRequest.js';

export const projectAPI = {
  getAllProjects: () => {
    return apiRequest('/projects', 'GET', null, 'projects-get-all');
  },

  createProject: (name, created_by) => {
    return apiRequest('/projects', 'POST', { name, created_by }, 'projects-create');
  },

  updateProject: (id, data) => {
    return apiRequest(`/projects/${id}`, 'PUT', data, 'projects-update');
  },

  deleteProject: (id) => {
    return apiRequest(`/projects/${id}`, 'DELETE', null, 'projects-delete');
  }
};
