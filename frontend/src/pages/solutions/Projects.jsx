import { useEffect, useState } from 'react';
import LoadingIndicator from '../../components/LoadingIndicator';
import { Button } from '../../components/ui/button';
import { getCurrentUser, loadingState, projectAPI } from '../../utils/apiCalls';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchProjects();

    const loadingUnsubscribe = loadingState.subscribe('projects-get-all', (isLoading) => {
      setLoading(isLoading);
    });

    return () => {
      loadingUnsubscribe();
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const allProjects = await projectAPI.getAllProjects();
      setProjects(allProjects);
      setError('');
    } catch (err) {
      setError('Failed to fetch projects: ' + (err.message || 'Unknown error'));
      console.error('Error fetching projects:', err);
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

    if (!formData.name) {
      setError('Project name is required');
      return;
    }

    try {
      if (isEditing && selectedProject) {
        await projectAPI.updateProject(selectedProject.id, { name: formData.name });
      } else {
        await projectAPI.createProject(formData.name, currentUser.id);
      }

      resetForm();
      fetchProjects();
      setError('');
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} project: ${err.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
    });
    setIsEditing(true);
  };

  const handleDelete = async (projectId) => {
    try {
      await projectAPI.deleteProject(projectId);
      // Update local state to immediately remove the deleted project
      setProjects(projects.filter(project => project.id !== projectId));
      setError('');
    } catch (err) {
      setError('Failed to delete project: ' + (err.message || 'Unknown error'));
    }
    finally {
      setProjects(projects.filter(project => project.id !== projectId));
      setError('');
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setSelectedProject(null);
    setIsEditing(false);
  };

  return (
    <div className="projects-page">
      <LoadingIndicator loading={loading || loadingState.isLoading('projects-create') || loadingState.isLoading('projects-update') || loadingState.isLoading('projects-delete')}>
        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        <div className="projects-grid">
          <div>
            {projects.length === 0 ? (
              <div className="empty-state">
                No projects found. Create a new project to get started.
              </div>
            ) : (
              <div className="project-list">
                {projects.map(project => (
                  <div key={project.id} className="project-item">
                    <div className="project-header">
                      <div>
                        <h3 className="project-name">{project.name}</h3>
                        <p className="project-creator">
                          Created by: {project.created_by === currentUser.id ? 'You' : `User #${project.created_by}`}
                        </p>
                        <div className="project-badges">
                          <span className="project-badge tasks-badge">
                            {project.tasks?.length || 0} Tasks
                          </span>
                          <span className="project-badge members-badge">
                            {project.member_count || 0} Members
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(project)}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(project.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </LoadingIndicator>
    </div>
  );
};

export default Projects;
