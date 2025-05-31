import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, projectAPI } from '../../utils/apiCalls';
import './ProjectCreate.css';

const ProjectCreate = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    try {
      await projectAPI.createProject(formData.name, currentUser.id);
      navigate('/solutions/projects');
    } catch (err) {
      setError(`Failed to create project: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/solutions/projects');
  };

  return (
    <div className="project-create-container">
      <div className="project-create-header">
        <h1 className="project-create-title">Create New Project</h1>
        <p className="project-create-subtitle">Start a new project to organize your tasks</p>
      </div>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <div className="project-create-form-container">
        <form onSubmit={handleSubmit} className="project-create-form">
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Enter project description"
              rows="4"
            />
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreate;
