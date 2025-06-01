import { AlertCircle, Calendar, CheckCircle, Clock, Edit, Plus, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import LoadingIndicator from '../../components/LoadingIndicator';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { getCurrentUser, loadingState, projectAPI, taskAPI } from '../../utils/apiCalls';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, has_more: false });
  const [filters, setFilters] = useState({
    search: '',
    owner: '',
    status: '',
    member: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    member_emails: [],
    member_permissions: {},
    project_image: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [memberEmailInput, setMemberEmailInput] = useState('');

  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchProjects();

    const loadingUnsubscribe = loadingState.subscribe('projects-get-all', (isLoading) => {
      setLoading(isLoading);
    });

    return () => {
      loadingUnsubscribe();
    };
  }, [filters, pagination.offset]);

  const fetchProjects = async () => {
    try {
      const params = {
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await projectAPI.getAllProjects(params);
      setProjects(response.projects || []);
      setPagination(response.pagination || { total: 0, limit: 20, offset: 0, has_more: false });
      setError('');
    } catch (err) {
      setError('Failed to fetch projects: ' + (err.message || 'Unknown error'));
      console.error('Error fetching projects:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addMemberEmail = () => {
    if (memberEmailInput.trim() && !formData.member_emails.includes(memberEmailInput.trim())) {
      const email = memberEmailInput.trim();
      setFormData(prev => ({
        ...prev,
        member_emails: [...prev.member_emails, email],
        member_permissions: { ...prev.member_permissions, [email]: false }
      }));
      setMemberEmailInput('');
    }
  };

  const removeMemberEmail = (email) => {
    setFormData(prev => {
      const newPermissions = { ...prev.member_permissions };
      delete newPermissions[email];
      return {
        ...prev,
        member_emails: prev.member_emails.filter(e => e !== email),
        member_permissions: newPermissions
      };
    });
  };

  const toggleMemberPermission = (email) => {
    setFormData(prev => ({
      ...prev,
      member_permissions: {
        ...prev.member_permissions,
        [email]: !prev.member_permissions[email]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      if (isEditing && selectedProject) {
        await projectAPI.updateProject(selectedProject.id, formData);
      } else {
        await projectAPI.createProject(formData);
      }

      resetForm();
      fetchProjects();
      setError('');
      setShowCreateForm(false);
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} project: ${err.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
      member_emails: [],
      member_permissions: {},
      project_image: null
    });
    setIsEditing(true);
    setShowCreateForm(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectAPI.deleteProject(projectId);
      setProjects(projects.filter(project => project.id !== projectId));
      setError('');
    } catch (err) {
      setError('Failed to delete project: ' + (err.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      deadline: '',
      member_emails: [],
      member_permissions: {},
      project_image: null
    });
    setSelectedProject(null);
    setIsEditing(false);
    setMemberEmailInput('');
  };

  const loadMore = () => {
    setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-50 border-green-200';
      case 'overdue': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage and organize your collaborative projects</p>
          </div>
          
          <Sheet open={showCreateForm} onOpenChange={setShowCreateForm}>
            <SheetTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[500px] sm:max-w-[500px]">
              <ScrollArea className="h-full">
                <SheetHeader>
                  <SheetTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</SheetTitle>
                </SheetHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 py-6">
                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Name *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter project name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter project description"
                      className="w-full p-3 border border-input rounded-md resize-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[80px]"
                      rows="3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deadline</label>
                    <Input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                    />
                  </div>

                  {!isEditing && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Project Image</label>
                        <Input
                          type="file"
                          name="project_image"
                          onChange={handleInputChange}
                          accept="image/*"
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-medium">Add Members</label>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            value={memberEmailInput}
                            onChange={(e) => setMemberEmailInput(e.target.value)}
                            placeholder="Enter member email"
                            className="flex-1"
                          />
                          <Button type="button" onClick={addMemberEmail} variant="outline" size="default">
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {formData.member_emails.length > 0 && (
                          <div className="space-y-2">
                            {formData.member_emails.map(email => (
                              <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">{email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={formData.member_permissions[email] || false}
                                      onChange={() => toggleMemberPermission(email)}
                                      className="rounded border-gray-300"
                                    />
                                    Editor
                                  </label>
                                  <Button 
                                    type="button" 
                                    onClick={() => removeMemberEmail(email)}
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={loadingState.isLoading('projects-create') || loadingState.isLoading('projects-update')}
                    >
                      {isEditing ? 'Update Project' : 'Create Project'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => { setShowCreateForm(false); resetForm(); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>

                <select
                  value={filters.owner}
                  onChange={(e) => handleFilterChange('owner', e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">All Projects</option>
                  <option value="me">My Projects</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Content */}
        <LoadingIndicator loading={loading}>
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No projects found</h3>
                    <p className="text-muted-foreground">Create a new project or adjust your filters to see projects.</p>
                  </div>
                  <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {projects.length} of {pagination.total} projects
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map(project => (
                  <Card key={project.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(project.status)}
                            <span className={`text-xs px-2 py-1 rounded-full border capitalize ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                        </div>
                        
                        {(project.is_owner || project.user_can_edit) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(project)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {project.is_owner && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(project.id)}
                                  variant="destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {project.project_image && (
                        <img 
                          src={project.project_image} 
                          alt={project.name} 
                          className="w-full h-32 object-cover rounded-md"
                        />
                      )}
                      
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Tasks: {project.task_stats.completed}/{project.task_stats.total}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full" 
                              style={{ 
                                width: `${project.task_stats.total > 0 ? (project.task_stats.completed / project.task_stats.total) * 100 : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {project.members.slice(0, 3).map(member => (
                              <Tooltip key={member.id}>
                                <TooltipTrigger asChild>
                                  <Avatar className="w-8 h-8 border-2 border-background">
                                    <AvatarImage src={member.profile_picture} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(member.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{member.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.is_owner ? 'Owner' : member.isEditor ? 'Editor' : 'Viewer'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {project.member_count > 3 && (
                              <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                <span className="text-xs font-medium">+{project.member_count - 3}</span>
                              </div>
                            )}
                          </div>
                          
                          {project.user_can_edit && (
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                              Editor
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    
                    {project.deadline && (
                      <CardFooter className="pt-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Due: {formatDate(project.deadline)}
                        </div>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
              
              {pagination.has_more && (
                <div className="flex justify-center pt-6">
                  <Button onClick={loadMore} variant="outline" className="gap-2">
                    Load More Projects
                  </Button>
                </div>
              )}
            </div>
          )}
        </LoadingIndicator>
      </div>
    </div>
  );
};

export default Projects;
