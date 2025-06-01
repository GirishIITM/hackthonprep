import { loadingState, projectAPI } from '@/utils/apiCalls';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import './ProjectCreate.css';

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    project_image: null
  });
  const [isCreating, setIsCreating] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Member selection state
  const [memberQuery, setMemberQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState(null);

  useEffect(() => {
    const checkLoadingState = () => {
      setIsCreating(loadingState.isLoading('projects-create'));
    };
    
    checkLoadingState();
    const interval = setInterval(checkLoadingState, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await projectAPI.searchUsers({ q: query, limit: 10 });
      
      const filteredResults = response.users.filter(
        user => !selectedMembers.some(selected => selected.id === user.id)
      );
      
      setSearchResults(filteredResults);
      setShowDropdown(true);
    } catch (err) {
      console.error('User search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMemberSearch = (e) => {
    const query = e.target.value;
    setMemberQuery(query);

    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchUsers(query);
    }, 300);

    setSearchDebounceTimeout(timeout);
  };

  const addMember = (user) => {
    setSelectedMembers(prev => [...prev, user]);
    setMemberQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeMember = (userId) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== userId));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.member-search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Project name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Project name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Project name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        errors.deadline = 'Deadline must be in the future';
      }
    }
    
    if (formData.project_image) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(formData.project_image.type)) {
        errors.project_image = 'Please select a valid image file (JPG, PNG, GIF, or WEBP)';
      }
      
      if (formData.project_image.size > maxSize) {
        errors.project_image = 'Image size must be less than 5MB';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (error) {
      setError('');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, project_image: file }));
      
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      
      if (formErrors.project_image) {
        setFormErrors(prev => ({ ...prev, project_image: '' }));
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, project_image: null }));
    setImagePreview(null);
    const fileInput = document.getElementById('project-image-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setConnectionError(false);
      setIsRetrying(false);
      
      const projectData = {
        ...formData,
        member_emails: selectedMembers.map(member => member.email)
      };
      
      const response = await projectAPI.createProject(projectData);
      
      if (response && response.project_id) {
        setSuccess('Project created successfully! Redirecting...');
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          deadline: '',
          project_image: null
        });
        setSelectedMembers([]);
        setImagePreview(null);
        setFormErrors({});
        
        setTimeout(() => {
          navigate('/solutions/projects');
        }, 1500);
      }
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to create project';
      
      if (errorMessage.includes('Unable to connect to server') || 
          errorMessage.includes('Network Error') ||
          errorMessage.includes('server is currently unavailable')) {
        setConnectionError(true);
        setIsRetrying(true);
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('Project name already exists')) {
        setFormErrors({ name: 'A project with this name already exists' });
      } else if (errorMessage.includes('Invalid image')) {
        setFormErrors({ project_image: 'Invalid image file. Please select a different image.' });
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleRetryConnection = () => {
    setConnectionError(false);
    setIsRetrying(true);
    setError('');
    
    connectionState.setOnline(true);
  };

  const handleCancel = () => {
    navigate('/solutions/projects');
  };

  return (
    <div className="project-create-page">
      <div className="project-create-container">
        {error && (
          <div className="error-alert">
            {error}
            {connectionError && (
              <button 
                onClick={() => setConnectionError(false)}
                className="retry-button"
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="success-alert">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="project-create-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Project Name <span className="required">*</span>
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
              className={formErrors.name ? 'error' : ''}
              disabled={isCreating}
              maxLength={100}
            />
            {formErrors.name && (
              <span className="field-error">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Project description (optional)"
              rows="4"
              className={`form-textarea ${formErrors.description ? 'error' : ''}`}
              disabled={isCreating}
              maxLength={500}
            />
            <div className="character-count">
              {formData.description.length}/500 characters
            </div>
            {formErrors.description && (
              <span className="field-error">{formErrors.description}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="deadline" className="form-label">Deadline</label>
            <Input
              id="deadline"
              name="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={handleInputChange}
              className={formErrors.deadline ? 'error' : ''}
              disabled={isCreating}
              min={new Date().toISOString().slice(0, 16)}
            />
            {formErrors.deadline && (
              <span className="field-error">{formErrors.deadline}</span>
            )}
          </div>

          {/* Member Selection Section */}
          <div className="form-group">
            <label className="form-label">Project Members</label>
            <div className="member-selection-container">
              <div className="member-search-container">
                <Input
                  type="text"
                  value={memberQuery}
                  onChange={handleMemberSearch}
                  placeholder="Search users by name, username, or email..."
                  className="member-search-input"
                  disabled={isCreating}
                />
                
                {isSearching && (
                  <div className="search-loading">
                    <span className="loading-spinner"></span>
                  </div>
                )}
                
                {showDropdown && searchResults.length > 0 && (
                  <div className="search-dropdown">
                    {searchResults.map(user => (
                      <div
                        key={user.id}
                        className="search-result-item"
                        onClick={() => addMember(user)}
                      >
                        <div className="user-avatar">
                          {user.profile_picture ? (
                            <img 
                              src={user.profile_picture} 
                              alt={user.full_name}
                              className="avatar-image"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.full_name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showDropdown && memberQuery && searchResults.length === 0 && !isSearching && (
                  <div className="search-dropdown">
                    <div className="no-results">No users found</div>
                  </div>
                )}
              </div>
              
              {selectedMembers.length > 0 && (
                <div className="selected-members">
                  <div className="selected-members-header">
                    Selected Members ({selectedMembers.length})
                  </div>
                  <div className="selected-members-list">
                    {selectedMembers.map(member => (
                      <div key={member.id} className="selected-member">
                        <div className="member-avatar">
                          {member.profile_picture ? (
                            <img 
                              src={member.profile_picture} 
                              alt={member.full_name}
                              className="avatar-image"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {member.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="member-info">
                          <div className="member-name">{member.full_name}</div>
                          <div className="member-email">{member.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="remove-member-btn"
                          disabled={isCreating}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="project-image" className="form-label">Project Image</label>
            <input
              id="project-image-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className={`form-file-input ${formErrors.project_image ? 'error' : ''}`}
              disabled={isCreating}
            />
            <div className="file-input-help">
              Supported formats: JPG, PNG, GIF, WEBP (max 5MB)
            </div>
            {formErrors.project_image && (
              <span className="field-error">{formErrors.project_image}</span>
            )}
            
            {imagePreview && (
              <div className="image-preview-container">
                <div className="image-preview">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="preview-image"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="remove-image-btn"
                    disabled={isCreating}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <Button 
              type="submit" 
              disabled={isCreating || connectionError}
              className="create-button"
            >
              {isCreating ? 'Creating Project...' : 'Create Project'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isCreating}
              className="cancel-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreate;
