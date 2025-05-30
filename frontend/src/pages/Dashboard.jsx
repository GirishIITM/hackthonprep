import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI, taskAPI } from '../utils/apiCalls';
import { getCurrentUser } from '../utils/apiCalls/auth';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects and tasks
      const [projects, tasks] = await Promise.all([
        projectAPI.getAllProjects(),
        taskAPI.getAllTasks()
      ]);

      // Calculate statistics
      const completedTasks = tasks.filter(task => task.status === 'Completed').length;
      const pendingTasks = tasks.filter(task => task.status !== 'Completed').length;

      setStats({
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks
      });

      // Get recent items (last 5)
      setRecentTasks(tasks.slice(0, 5));
      setRecentProjects(projects.slice(0, 5));
      
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProjectName = (projectId) => {
    const project = recentProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {currentUser?.name}!</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card projects-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>

        <div className="stat-card tasks-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className="stat-card completed-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedTasks}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        <div className="stat-card pending-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingTasks}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/solutions/projects" className="action-btn primary">
            Create New Project
          </Link>
          <Link to="/solutions/tasks" className="action-btn secondary">
            Add New Task
          </Link>
          <Link to="/profile" className="action-btn tertiary">
            View Profile
          </Link>
        </div>
      </div>

      {/* Recent Items */}
      <div className="recent-items">
        <div className="recent-section">
          <h2>Recent Projects</h2>
          {recentProjects.length === 0 ? (
            <div className="empty-state">
              <p>No projects yet. <Link to="/solutions/projects">Create your first project</Link></p>
            </div>
          ) : (
            <div className="recent-list">
              {recentProjects.map(project => (
                <div key={project.id} className="recent-item">
                  <div className="item-icon">📁</div>
                  <div className="item-content">
                    <h4>{project.name}</h4>
                    <p>{project.tasks?.length || 0} tasks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="recent-section">
          <h2>Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet. <Link to="/solutions/tasks">Create your first task</Link></p>
            </div>
          ) : (
            <div className="recent-list">
              {recentTasks.map(task => (
                <div key={task.id} className="recent-item">
                  <div className="item-icon">
                    {task.status === 'Completed' ? '✅' : '📋'}
                  </div>
                  <div className="item-content">
                    <h4>{task.title}</h4>
                    <p>{getProjectName(task.project_id)} • {task.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
