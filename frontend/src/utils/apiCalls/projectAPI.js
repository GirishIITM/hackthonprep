import { apiRequest } from "./apiRequest";

export const projectAPI = {
  getAllProjects: () => {
    return apiRequest('/projects', 'GET', null, 'projects-get-all');
  },

  getProject: (id) => {
    return apiRequest(`/projects/${id}`, 'GET', null, 'projects-get-single');
  },

  createProject: (projectData) => {
    const hasImage = projectData.project_image && projectData.project_image instanceof File;
    const hasMemberEmails = projectData.member_emails && Array.isArray(projectData.member_emails);
    
    if (hasImage || hasMemberEmails) {
      const formData = new FormData();
      formData.append('name', projectData.name);
      
      if (projectData.description) {
        formData.append('description', projectData.description);
      }
      
      if (projectData.deadline) {
        const deadlineISO = new Date(projectData.deadline).toISOString();
        formData.append('deadline', deadlineISO);
      }
      
      if (hasMemberEmails) {
        formData.append('member_emails', projectData.member_emails.join(','));
      }
      
      if (hasImage) {
        formData.append('project_image', projectData.project_image);
      }
      
      return apiRequest('/projects', 'POST', formData, 'projects-create', false);
    } else {
      const jsonData = {
        name: projectData.name,
        description: projectData.description || '',
      };
      
      if (projectData.deadline) {
        jsonData.deadline = new Date(projectData.deadline).toISOString();
      }
      
      if (hasMemberEmails) {
        jsonData.member_emails = projectData.member_emails;
      }
      
      return apiRequest('/projects', 'POST', jsonData, 'projects-create');
    }
  },

  updateProject: (id, data) => {
    const jsonData = {
      name: data.name,
      description: data.description || '',
    };
    
    if (data.deadline) {
      jsonData.deadline = new Date(data.deadline).toISOString();
    }
    
    return apiRequest(`/projects/${id}`, 'PUT', jsonData, 'projects-update');
  },

  deleteProject: (id) => {
    return apiRequest(`/projects/${id}`, 'DELETE', null, 'projects-delete');
  },

  addProjectMember: (id, memberData) => {
    return apiRequest(`/projects/${id}/members`, 'POST', memberData, 'projects-add-member');
  },

  searchUsers: (searchParams = {}) => {
    const queryParams = new URLSearchParams(searchParams).toString();
    const endpoint = queryParams ? `/users/search?${queryParams}` : '/users/search';
    return apiRequest(endpoint, 'GET', null, 'users-search');
  }
};
