import { loadingState, projectAPI } from '@/utils/apiCalls';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
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
  };

  const handleCancel = () => {
    navigate('/solutions/projects');
  };

  return (
    <div className="project-create-page">
      <div className="project-create-container">
        <LoadingIndicator loading={isCreating || loadingState.isLoading('project-create') || loadingState.isLoading('user-search')}>
          {error && (
            <div className="error-alert">
              {error}
              {connectionError && (
                <Button 
                  onClick={() => setConnectionError(false)}
                  className="retry-button"
                  disabled={isRetrying}
                  variant="outline"
                >
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
              )}
            </div>
          )}

          {success && (
            <div className="success-alert">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="project-create-form">
            {/* Basic Project Information */}
            <div className="form-section">
              <h2 className="section-title">Project Details</h2>
              
              <div className="form-row">
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
                  <span className="field-error">{formErrors.name || ''}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="deadline" className="form-label">Deadline</label>
                  <div className="deadline-input-wrapper">
                    <Input
                      id="deadline"
                      name="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className={`deadline-input ${formErrors.deadline ? 'error' : ''}`}
                      disabled={isCreating}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="deadline-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                  </div>
                  <span className="field-error">{formErrors.deadline || ''}</span>
                </div>
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
                <span className="field-error">{formErrors.description || ''}</span>
              </div>
            </div>

            <div className="form-section side-by-side">
              <div className="form-section-content">
                <h2 className="section-title">Team Members</h2>
                <p className="section-description">Add team members to collaborate on this project</p>
                
                <div className="form-group">
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
                        <div className="selected-members-grid">
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
                              <Button
                                type="button"
                                onClick={() => removeMember(member.id)}
                                className="remove-member-btn"
                                disabled={isCreating}
                                title="Remove member"
                                variant="ghost"
                                size="sm"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="field-error"></span>
                </div>
              </div>

              <div className="form-section-content">
                <h2 className="section-title">Project Image</h2>
                <p className="section-description">Add a visual representation for your project</p>
                
                <div className="form-group">
                  <div className="file-upload-container">
                    <input
                      id="project-image-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="file-input-hidden"
                      disabled={isCreating}
                    />
                    
                    {!imagePreview ? (
                      <label htmlFor="project-image-input" className="file-upload-area">
                        <div className="upload-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21,15 16,10 5,21"></polyline>
                          </svg>
                        </div>
                        <div className="upload-text">
                          <p className="upload-primary">Click to upload project image</p>
                          <p className="upload-secondary">JPG, PNG, GIF, WEBP (max 5MB)</p>
                        </div>
                      </label>
                    ) : (
                      <div className="image-preview-container">
                        <div className="image-preview">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="preview-image"
                          />
                          <div className="image-overlay">
                            <Button
                              type="button"
                              onClick={removeImage}
                              className="remove-image-btn"
                              disabled={isCreating}
                              title="Remove image"
                              variant="destructive"
                              size="sm"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </Button>
                            <label htmlFor="project-image-input" className="change-image-btn" title="Change image">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <span className="field-error">{formErrors.project_image || ''}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isCreating}
                className="cancel-button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || connectionError}
                className="create-button"
              >
                {isCreating ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Creating Project...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </LoadingIndicator>
      </div>
    </div>
  );
};

export default ProjectCreate;
