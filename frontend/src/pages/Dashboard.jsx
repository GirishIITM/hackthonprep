import {
  Calendar,
  CheckSquare,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { projectAPI, taskAPI } from '../utils/apiCalls';
import { getCurrentUser } from '../utils/apiCalls/auth';

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
      
      // Fetch projects and tasks with proper error handling
      const [projectsResponse, tasksResponse] = await Promise.all([
        projectAPI.getAllProjects().catch(err => {
          console.error('Failed to fetch projects:', err);
          return { projects: [], pagination: { total: 0 } };
        }),
        taskAPI.getAllTasks().catch(err => {
          console.error('Failed to fetch tasks:', err);
          return [];
        })
      ]);

      // Handle new API response structure
      const projects = projectsResponse.projects || [];
      const tasks = Array.isArray(tasksResponse) ? tasksResponse : [];

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
      setRecentTasks(tasks.slice(-5).reverse());
      setRecentProjects(projects.slice(-5).reverse());
      
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

  const statsData = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      change: "+20.1%",
      changeType: "positive"
    },
    {
      title: "Total Tasks", 
      value: stats.totalTasks,
      icon: CheckSquare,
      change: "+15.3%",
      changeType: "positive"
    },
    {
      title: "Team Members",
      value: "24",
      icon: Users,
      change: "+8.2%", 
      changeType: "positive"
    },
    {
      title: "Completion Rate",
      value: "87%",
      icon: Target,
      change: "+5.4%",
      changeType: "positive"
    }
  ];

  const recentActivity = [
    {
      icon: CheckSquare,
      title: "Task completed",
      description: "User registration feature completed",
      time: "2 minutes ago"
    },
    {
      icon: FolderKanban,
      title: "New project created", 
      description: "E-commerce platform project started",
      time: "1 hour ago"
    },
    {
      icon: Users,
      title: "Team member added",
      description: "John Doe joined the development team",
      time: "3 hours ago"
    }
  ];

  const StatCard = ({ title, value, icon, description, className = "" }) => {
    const Icon = icon;
    return (
      <Card className={`hover:shadow-lg transition-shadow ${className}`}>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="text-4xl"><Icon className="h-6 w-6" /></div>
          <div className="flex flex-col">
            <div className="text-3xl font-bold text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <LoadingIndicator loading={loading}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6" />
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          </div>
          <p className="text-lg text-muted-foreground">Welcome back, {currentUser?.name || 'User'}!</p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              className="border-blue-200 dark:border-blue-800"
            />
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your most common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link to="/solutions/projects">Create New Project</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="solutions/tasks">Add New Task</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/profile">View Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📁</span>
                Recent Projects
              </CardTitle>
              <CardDescription>Your latest projects</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No projects yet.</p>
                  <Button asChild variant="outline">
                    <Link to="/projects">Create your first project</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProjects.map(project => (
                    <div 
                      key={project.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="text-2xl">📁</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.task_count || 0} tasks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📋</span>
                Recent Tasks
              </CardTitle>
              <CardDescription>Your latest tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No tasks yet.</p>
                  <Button asChild variant="outline">
                    <Link to="/tasks">Create your first task</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="text-2xl">
                        {task.status === 'Completed' ? '✅' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getProjectName(task.project_id)} • {task.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid (Lucide Icons) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-green-600">{stat.change}</span>
                    <span>from last month</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <FolderKanban className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Create New Project</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Add New Task</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Invite Team Member</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </LoadingIndicator>
    </div>
  );
};

export default Dashboard;
