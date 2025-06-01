import {
    ArrowLeft,
    Calendar,
    CheckSquare,
    FileText,
    FolderKanban,
    Save,
    Tag,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/solutions/tasks">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Create New Task</h1>
            </div>
          </div>
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
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Task Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Task Title */}
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Task Title *
                    </label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter task description"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    />
                  </div>

                  {/* Project */}
                  <div className="space-y-2">
                    <label htmlFor="project" className="flex items-center space-x-2 text-sm font-medium">
                      <FolderKanban className="h-4 w-4" />
                      <span>Project</span>
                    </label>
                    <select
                      id="project"
                      name="project_id"
                      value={formData.project_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    >
                      <option value="">Select a project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignee */}
                  <div className="space-y-2">
                    <label htmlFor="assignee" className="flex items-center space-x-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      <span>Assignee</span>
                    </label>
                    <Input
                      id="assignee"
                      name="assignee"
                      value={formData.assignee}
                      onChange={handleInputChange}
                      placeholder="Enter assignee name"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <label htmlFor="dueDate" className="flex items-center space-x-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      <span>Due Date</span>
                    </label>
                    <Input
                      id="dueDate"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <label htmlFor="priority" className="flex items-center space-x-2 text-sm font-medium">
                      <Tag className="h-4 w-4" />
                      <span>Priority</span>
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-4 pt-4">
                    <Button type="submit" className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Create Task</span>
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link to="/solutions/tasks">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </LoadingIndicator>
    </div>
  );
};

export default TaskCreate;
