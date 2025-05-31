import { apiRequest } from '/src/utils/apiCalls/apiRequest.js';

export const taskAPI = {
  getAllTasks: () => {
    return apiRequest('/tasks', 'GET', null, 'tasks-get-all');
  },

  createTask: (project_id, title, description, due_date, status) => {
    return apiRequest('/tasks', 'POST', { project_id, title, description, due_date, status }, 'tasks-create');
  },

  updateTask: (id, project_id, title, description, due_date, status) => {
    return apiRequest(`/tasks/${id}`, 'PUT', { project_id, title, description, due_date, status }, 'tasks-update');
  },

  deleteTask: (id, project_id) => {
    return apiRequest(`/tasks/${id}`, 'DELETE', { project_id }, 'tasks-delete');
  }
};
