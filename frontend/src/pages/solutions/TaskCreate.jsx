import {
  ArrowLeft,
  Save
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { projectAPI } from '../../utils/apiCalls/projectAPI';
import { taskAPI } from '../../utils/apiCalls/taskAPI';
import { getCurrentUser } from '../../utils/auth';
import { loadingState } from '../../utils/loadingState';
import './TaskCreate.css';

const TaskCreate = () => {
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    due_date: '',
    status: 'Not Started',
    assigned_to: '' // Add assigned user field
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add member search state for task assignment
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [assigneeResults, setAssigneeResults] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [isSearchingAssignee, setIsSearchingAssignee] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeDebounceTimeout, setAssigneeDebounceTimeout] = useState(null);
  
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAllProjects();
      // Handle new API response structure
      const projectsData = response.projects || response || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
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

  const searchAssignees = async (query) => {
    if (!query.trim()) {
      setAssigneeResults([]);
      setShowAssigneeDropdown(false);
      return;
    }

    try {
      setIsSearchingAssignee(true);
      const response = await projectAPI.searchUsers({ q: query, limit: 10 });
      setAssigneeResults(response.users || []);
      setShowAssigneeDropdown(true);
    } catch (err) {
      console.error('User search error:', err);
      setAssigneeResults([]);
    } finally {
      setIsSearchingAssignee(false);
    }
  };

  const handleAssigneeSearch = (e) => {
    const query = e.target.value;
    setAssigneeQuery(query);

    if (assigneeDebounceTimeout) {
      clearTimeout(assigneeDebounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchAssignees(query);
    }, 300);

    setAssigneeDebounceTimeout(timeout);
  };

  const selectAssignee = (user) => {
    setSelectedAssignee(user);
    setFormData(prev => ({ ...prev, assigned_to: user.email }));
    setAssigneeQuery(user.full_name || user.email);
    setAssigneeResults([]);
    setShowAssigneeDropdown(false);
  };

  const clearAssignee = () => {
    setSelectedAssignee(null);
    setFormData(prev => ({ ...prev, assigned_to: '' }));
    setAssigneeQuery('');
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
        formData.status,
        formData.assigned_to // Include assigned user
      );
      
      setSuccess('Task created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/solutions/tasks');
      }, 1500);
      setError('');
    } catch (err) {
      setError('Failed to create task: ' + (err.message || 'Unknown error'));
    }
  };

  if (loadingProjects) {
    return <div className="task-create-loading">Loading projects...</div>;
  }

  return (
    <div className="task-create-page">
      <div className="task-create-header">
        <Button asChild variant="outline">
          <Link to="/solutions/tasks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
        <h1>Create New Task</h1>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-success">
          <CardContent className="p-4">
            <p className="text-success">{success}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="task-create-form">
            <div className="form-group">
              <label htmlFor="project_id">Project *</label>
              <select
                id="project_id"
                name="project_id"
                value={formData.project_id}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Task Title *</label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter task description"
                rows={4}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="due_date">Due Date & Time *</label>
              <Input
                type="datetime-local"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Add Assignee Selection */}
            <div className="form-group">
              <label htmlFor="assigned_to">Assign To (Optional)</label>
              <div className="relative">
                <Input
                  type="text"
                  value={assigneeQuery}
                  onChange={handleAssigneeSearch}
                  placeholder="Search users to assign task..."
                />
                
                {isSearchingAssignee && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                {showAssigneeDropdown && assigneeResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {assigneeResults.map(user => (
                      <div
                        key={user.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3"
                        onClick={() => selectAssignee(user)}
                      >
                        <div className="flex-shrink-0">
                          {user.profile_picture ? (
                            <img 
                              src={user.profile_picture} 
                              alt={user.full_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedAssignee && (
                  <div className="mt-2 flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {selectedAssignee.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm text-gray-900">{selectedAssignee.full_name}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={clearAssignee}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" disabled={loadingState.isLoading('tasks-create')}>
                <Save className="h-4 w-4 mr-2" />
                {loadingState.isLoading('tasks-create') ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskCreate;
