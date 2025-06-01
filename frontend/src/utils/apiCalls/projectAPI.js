import { apiRequest } from "./apiRequest.js";

export const projectAPI = {
  getAllProjects: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.owner) queryParams.append('owner', params.owner);
    if (params.member) queryParams.append('member', params.member);
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    
    const endpoint = queryParams.toString() ? `/projects?${queryParams}` : '/projects';
    return apiRequest(endpoint, 'GET', null, 'projects-get-all');
  },

  getProject: (id) => {
    return apiRequest(`/projects/${id}`, 'GET', null, 'projects-get-single');
  },

  createProject: (projectData) => {
    const hasImage = projectData.project_image && projectData.project_image instanceof File;
    const hasMemberEmails = projectData.member_emails && Array.isArray(projectData.member_emails);
    const hasMemberPermissions = projectData.member_permissions && typeof projectData.member_permissions === 'object';
    
    if (hasImage || hasMemberEmails || hasMemberPermissions) {
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
      
      if (hasMemberPermissions) {
        Object.entries(projectData.member_permissions).forEach(([email, isEditor]) => {
          formData.append(`member_permission_${email}`, isEditor.toString());
        });
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
      
      if (hasMemberPermissions) {
        jsonData.member_permissions = projectData.member_permissions;
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

  addProjectMember: (projectId, memberData) => {
    const data = {
      email: memberData.email,
      isEditor: memberData.isEditor || false
    };
    return apiRequest(`/projects/${projectId}/members`, 'POST', data, 'projects-add-member');
  },

  searchUsers: (searchParams = {}) => {
    const queryParams = new URLSearchParams(searchParams).toString();
    const endpoint = queryParams ? `/users/search?${queryParams}` : '/users/search';
    return apiRequest(endpoint, 'GET', null, 'users-search');
  }
};
