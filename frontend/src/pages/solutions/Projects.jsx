import { AlertCircle, Calendar, CheckCircle, CircleEllipsis, Clock, Edit, Plus, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
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
import { getCurrentUser, loadingState, projectAPI } from '../../utils/apiCalls';


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
  
  // Member search state
  const [memberQuery, setMemberQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState(null);

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
    setSelectedMembers([]);
    setMemberQuery('');
    setSearchResults([]);
    setShowDropdown(false);
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
        user => !selectedMembers.some(selected => selected.id === user.id) &&
                !formData.member_emails.includes(user.email)
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

  const addMemberFromSearch = (user) => {
    setSelectedMembers(prev => [...prev, user]);
    setFormData(prev => ({
      ...prev,
      member_emails: [...prev.member_emails, user.email],
      member_permissions: { ...prev.member_permissions, [user.email]: false }
    }));
    setMemberQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeMemberFromSelected = (userId) => {
    const member = selectedMembers.find(m => m.id === userId);
    if (member) {
      setSelectedMembers(prev => prev.filter(m => m.id !== userId));
      removeMemberEmail(member.email);
    }
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
            <SheetContent className="w-full sm:w-[550px] sm:max-w-[550px] p-0">
              <ScrollArea className="h-full">
                <div className="p-4 sm:p-6">
                  <SheetHeader className="pb-6">
                    <SheetTitle className="text-xl font-semibold">
                      {isEditing ? 'Edit Project' : 'Create New Project'}
                    </SheetTitle>
                  </SheetHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 pb-6">
                    {error && (
                      <div className="p-3 sm:p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Basic Information Section */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="border-b border-gray-200 pb-3 sm:pb-4">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Basic Information</h3>
                        <p className="text-sm text-muted-foreground">Essential project details</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-900">Project Name *</label>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter a descriptive project name"
                            required
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-900">Description</label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Describe your project goals and objectives..."
                            className="w-full p-3 border border-input rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] sm:min-h-[100px] transition-colors"
                            rows="3"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-900">Deadline</label>
                          <Input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleInputChange}
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-muted-foreground">Optional: Set a target completion date</p>
                        </div>
                      </div>
                    </div>

                    {!isEditing && (
                      <>
                        <div className="space-y-4 sm:space-y-6">
                          <div className="border-b border-gray-200 pb-3 sm:pb-4">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Visual Assets</h3>
                            <p className="text-sm text-muted-foreground">Add images to make your project stand out</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-900">Project Image</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 hover:border-gray-400 transition-colors">
                              <Input
                                type="file"
                                name="project_image"
                                onChange={handleInputChange}
                                accept="image/*"
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-colors"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                Upload a project banner or logo (PNG, JPG, GIF up to 10MB)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                          <div className="border-b border-gray-200 pb-3 sm:pb-4">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Team Members</h3>
                            <p className="text-sm text-muted-foreground">Invite collaborators to your project</p>
                          </div>

                          <div className="space-y-4">
                            {/* User Search Input */}
                            <div className="member-search-container relative">
                              <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                  <Input
                                    type="text"
                                    value={memberQuery}
                                    onChange={handleMemberSearch}
                                    placeholder="Search users by name, username, or email..."
                                    className="flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                  />
                                  
                                  {isSearching && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Search Dropdown */}
                              {showDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 mt-1">
                                  {searchResults.map(user => (
                                    <div
                                      key={user.id}
                                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                                      onClick={() => addMemberFromSearch(user)}
                                    >
                                      <Avatar className="w-8 h-8 mr-3">
                                        <AvatarImage src={user.profile_picture} />
                                        <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
                                          {getInitials(user.full_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                          {user.full_name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          {user.email}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {showDropdown && memberQuery && searchResults.length === 0 && !isSearching && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                                  <div className="p-4 text-center text-gray-500 text-sm">
                                    No users found
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Manual Email Input */}
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-700">Or add by email address</div>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                  type="email"
                                  value={memberEmailInput}
                                  onChange={(e) => setMemberEmailInput(e.target.value)}
                                  placeholder="Enter member email address"
                                  className="flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMemberEmail())}
                                />
                                <Button 
                                  type="button" 
                                  onClick={addMemberEmail} 
                                  variant="outline" 
                                  size="default"
                                  className="w-full sm:w-auto px-4 hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <UserPlus className="w-4 h-4 mr-2 sm:mr-0" />
                                  <span className="sm:hidden">Add Member</span>
                                </Button>
                              </div>
                            </div>
                            
                            {/* Selected Members Display */}
                            {(selectedMembers.length > 0 || formData.member_emails.length > 0) && (
                              <div className="space-y-3">
                                <div className="text-sm font-medium text-gray-900">
                                  Added Members ({selectedMembers.length + formData.member_emails.filter(email => !selectedMembers.some(m => m.email === email)).length})
                                </div>
                                <div className="space-y-2">
                                  {/* Members added via search */}
                                  {selectedMembers.map(member => (
                                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors gap-3 sm:gap-0">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                                          <AvatarImage src={member.profile_picture} />
                                          <AvatarFallback className="text-xs sm:text-sm font-medium bg-blue-100 text-blue-700">
                                            {getInitials(member.full_name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1 min-w-0 flex-1">
                                          <span className="text-sm font-medium text-gray-900">{member.full_name}</span>
                                          <div className="text-xs text-muted-foreground break-all">{member.email}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {formData.member_permissions[member.email] ? 'Can edit project' : 'View only access'}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between sm:justify-end gap-3">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={formData.member_permissions[member.email] || false}
                                            onChange={() => toggleMemberPermission(member.email)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <span className="font-medium">Editor</span>
                                        </label>
                                        <Button 
                                          type="button" 
                                          onClick={() => removeMemberFromSelected(member.id)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Members added via email */}
                                  {formData.member_emails
                                    .filter(email => !selectedMembers.some(m => m.email === email))
                                    .map(email => (
                                    <div key={email} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors gap-3 sm:gap-0">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                                          <AvatarFallback className="text-xs sm:text-sm font-medium bg-blue-100 text-blue-700">
                                            {getInitials(email)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1 min-w-0 flex-1">
                                          <span className="text-sm font-medium text-gray-900 break-all">{email}</span>
                                          <div className="text-xs text-muted-foreground">
                                            {formData.member_permissions[email] ? 'Can edit project' : 'View only access'}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between sm:justify-end gap-3">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={formData.member_permissions[email] || false}
                                            onChange={() => toggleMemberPermission(email)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <span className="font-medium">Editor</span>
                                        </label>
                                        <Button 
                                          type="button" 
                                          onClick={() => removeMemberEmail(email)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                      <Button 
                        type="submit" 
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                        disabled={loadingState.isLoading('projects-create') || loadingState.isLoading('projects-update')}
                      >
                        {isEditing ? 'Update Project' : 'Create Project'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => { setShowCreateForm(false); resetForm(); }}
                        className="px-6 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

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
                              <Button size="sm" variant="ghost" className="group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                                <CircleEllipsis className="w-4 h-4" />
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
                                  className="text-red-600 focus:text-red-600"
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
