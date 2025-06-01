import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getCurrentUser, loadingState, projectAPI, taskAPI } from '../../utils/apiCalls';
import './TaskCreate.css';

const TaskCreate = () => {
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    due_date: '',
    status: 'Not Started'
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const allProjects = await projectAPI.getAllProjects();
      setProjects(allProjects);
    } catch (err) {
      setError('Failed to load projects: ' + (err.message || 'Unknown error'));
      console.error('Error fetching projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.project_id || !formData.title || !formData.due_date) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await taskAPI.createTask(
        formData.project_id,
        formData.title,
        formData.description,
        formData.due_date,
        formData.status
      );
      navigate('/solutions/tasks');
    } catch (err) {
      setError(`Failed to create task: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    navigate('/solutions/tasks');
  };

  return (
    <div className="task-create-container">
      <LoadingIndicator loading={loadingState.isLoading('task-create') || loadingState.isLoading('projects-fetch') || loadingProjects}>
        <div className="task-create-header">
          <h1 className="task-create-title">Create New Task</h1>
          <p className="task-create-subtitle">Add a new task to your project</p>
        </div>

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="no-projects-alert">
            <p>No projects available. You need to create a project first before adding tasks.</p>
            <Button
              onClick={() => navigate('/solutions/projects/create')}
            >
              Create Project
            </Button>
          </div>
        ) : (
          <div className="task-create-form-container">
            <form onSubmit={handleSubmit} className="task-create-form">
              <div className="form-group">
                <label className="form-label">Project *</label>
                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select a Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Enter task description"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <Input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1"
                >
                  Create Task
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </LoadingIndicator>
    </div>
  );
};

export default TaskCreate;
