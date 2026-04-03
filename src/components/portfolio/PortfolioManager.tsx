import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Star, 
  Award, 
  Camera, 
  Upload,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle
} from 'lucide-react';

interface Portfolio {
  id: string;
  title: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  hourly_rate: number;
  profile_image_url: string;
  cover_image_url: string;
  location: any;
  availability_status: string;
  portfolio_views: number;
  is_public: boolean;
  featured: boolean;
}

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: string;
  before_image_url: string;
  after_image_url: string;
  project_images: string[];
  completion_date: string;
  client_name: string;
  project_duration: string;
  materials_used: string[];
  project_cost: number;
  is_featured: boolean;
}

interface ServicePackage {
  id: string;
  package_name: string;
  description: string;
  price: number;
  duration: string;
  includes: string[];
  category: string;
  is_popular: boolean;
}

export function PortfolioManager() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const projectImageRef = useRef<HTMLInputElement>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingProjectImage, setUploadingProjectImage] = useState(false);

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File must be under 10MB', variant: 'destructive' });
      return null;
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${path}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file, 'profile');
      if (url) await updatePortfolio({ profile_image_url: url });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProjectImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProjectImagePreview(URL.createObjectURL(file));
  };

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: '',
    before_image_url: '',
    after_image_url: '',
    completion_date: '',
    client_name: '',
    project_duration: '',
    materials_used: '',
    project_cost: ''
  });

  const [newPackage, setNewPackage] = useState({
    package_name: '',
    description: '',
    price: '',
    duration: '',
    includes: '',
    category: '',
    is_popular: false
  });

  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user]);

  const loadPortfolioData = async () => {
    try {
      // Load main portfolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('artisan_id', user?.id)
        .single();

      if (portfolioError && portfolioError.code !== 'PGRST116') {
        throw portfolioError;
      }

      if (portfolioData) {
        setPortfolio(portfolioData);

        // Load projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('portfolio_projects')
          .select('*')
          .eq('portfolio_id', portfolioData.id)
          .order('display_order', { ascending: true });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Load service packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('service_packages')
          .select('*')
          .eq('portfolio_id', portfolioData.id)
          .order('display_order', { ascending: true });

        if (packagesError) throw packagesError;
        setPackages(packagesData || []);
      }
    } catch (error: any) {
      console.error('Error loading portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = async (portfolioData: Partial<Portfolio>) => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .insert({
          artisan_id: user?.id,
          title: portfolioData.title || 'My Portfolio',
          bio: portfolioData.bio || '',
          specialties: portfolioData.specialties || [],
          years_experience: portfolioData.years_experience || 0,
          hourly_rate: portfolioData.hourly_rate || 5000,
          location: portfolioData.location || null,
          availability_status: 'available',
          is_public: true,
          featured: false
        })
        .select()
        .single();

      if (error) throw error;
      setPortfolio(data);
      return data;
    } catch (error: any) {
      console.error('Error creating portfolio:', error);
      throw error;
    }
  };

  const updatePortfolio = async (updates: Partial<Portfolio>) => {
    if (!portfolio) return;

    try {
      const { data, error } = await supabase
        .from('portfolios')
        .update(updates)
        .eq('id', portfolio.id)
        .select()
        .single();

      if (error) throw error;
      setPortfolio(data);
      
      toast({
        title: "Portfolio Updated",
        description: "Your portfolio has been updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to update portfolio",
        variant: "destructive"
      });
    }
  };

  const resetProjectDialog = () => {
    setNewProject({ title: '', description: '', category: '', before_image_url: '', after_image_url: '', completion_date: '', client_name: '', project_duration: '', materials_used: '', project_cost: '' });
    if (projectImageRef.current) projectImageRef.current.value = '';
    setProjectImagePreview(null);
    setEditingProject(null);
    setShowProjectDialog(false);
  };

  const addProject = async () => {
    if (!portfolio) {
      const newPortfolio = await createPortfolio({ title: 'My Portfolio', bio: 'Professional artisan services', specialties: [], years_experience: 0, hourly_rate: 5000 });
      if (!newPortfolio) return;
    }

    setUploadingProjectImage(true);
    try {
      let imageUrl = newProject.after_image_url;
      const file = projectImageRef.current?.files?.[0];
      if (file) {
        const uploaded = await uploadImage(file, 'project');
        if (uploaded) imageUrl = uploaded;
      }

      const payload = {
        ...newProject,
        after_image_url: imageUrl,
        materials_used: newProject.materials_used.split(',').map(m => m.trim()).filter(Boolean),
        project_cost: parseFloat(newProject.project_cost) || 0,
        completion_date: newProject.completion_date || null
      };

      if (editingProject) {
        // Update existing project
        const { data, error } = await supabase
          .from('portfolio_projects')
          .update(payload)
          .eq('id', editingProject.id)
          .select()
          .single();
        if (error) throw error;
        setProjects(projects.map(p => p.id === editingProject.id ? data : p));
        toast({ title: 'Project Updated', description: 'Your project has been updated' });
      } else {
        // Insert new project
        const { data, error } = await supabase
          .from('portfolio_projects')
          .insert({ portfolio_id: portfolio?.id, ...payload })
          .select()
          .single();
        if (error) throw error;
        setProjects([...projects, data]);
        toast({ title: 'Project Added', description: 'Your project has been added to your portfolio' });
      }

      resetProjectDialog();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({ title: 'Error', description: 'Failed to save project', variant: 'destructive' });
    } finally {
      setUploadingProjectImage(false);
    }
  };

  const resetPackageDialog = () => {
    setNewPackage({ package_name: '', description: '', price: '', duration: '', includes: '', category: '', is_popular: false });
    setEditingPackage(null);
    setShowPackageDialog(false);
  };

  const addPackage = async () => {
    if (!portfolio) {
      const newPortfolio = await createPortfolio({
        title: 'My Portfolio',
        bio: 'Professional artisan services',
        specialties: [],
        years_experience: 0,
        hourly_rate: 5000
      });
      if (!newPortfolio) return;
    }

    try {
      const payload = {
        ...newPackage,
        includes: newPackage.includes.split(',').map(i => i.trim()).filter(Boolean),
        price: parseFloat(newPackage.price) || 0
      };

      if (editingPackage) {
        const { data, error } = await supabase
          .from('service_packages')
          .update(payload)
          .eq('id', editingPackage.id)
          .select()
          .single();
        if (error) throw error;
        setPackages(packages.map(p => p.id === editingPackage.id ? data : p));
        toast({ title: 'Package Updated', description: 'Your service package has been updated' });
      } else {
        const { data, error } = await supabase
          .from('service_packages')
          .insert({
            portfolio_id: portfolio?.id,
            ...payload
          })
          .select()
          .single();
        if (error) throw error;
        setPackages([...packages, data]);
        toast({ title: 'Package Added', description: 'Your service package has been added' });
      }

      resetPackageDialog();
    } catch (error: any) {
      console.error('Error saving package:', error);
      toast({
        title: "Error",
        description: "Failed to save package",
        variant: "destructive"
      });
    }
  };

  const deletePackage = async (packageId: string) => {
    const { error } = await supabase
      .from('service_packages')
      .delete()
      .eq('id', packageId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete package', variant: 'destructive' });
      return;
    }
    setPackages(prev => prev.filter(p => p.id !== packageId));
    toast({ title: 'Package deleted' });
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      setProjects(projects.filter(p => p.id !== projectId));
      toast({
        title: "Project Deleted",
        description: "Project has been removed from your portfolio"
      });
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Manager</h1>
          <p className="text-muted-foreground">Showcase your work and grow your business</p>
        </div>
        {portfolio && (
          <Button variant="outline" onClick={() => window.open(`/portfolio/${portfolio.id}`, '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Portfolio
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="packages">Service Packages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Portfolio Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!portfolio ? (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Create Your Portfolio</h3>
                  <p className="text-muted-foreground mb-4">
                    Showcase your skills and attract more clients
                  </p>
                  <Button 
                    onClick={() => createPortfolio({
                      title: 'My Portfolio',
                      bio: 'Professional artisan services',
                      specialties: [],
                      years_experience: 0,
                      hourly_rate: 5000
                    })}
                  >
                    Create Portfolio
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Portfolio Title</Label>
                      <Input
                        id="title"
                        value={portfolio.title}
                        onChange={(e) => setPortfolio({ ...portfolio, title: e.target.value })}
                        onBlur={() => updatePortfolio({ title: portfolio.title })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={portfolio.bio || ''}
                        onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
                        onBlur={() => updatePortfolio({ bio: portfolio.bio })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate (₦)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={portfolio.hourly_rate}
                        onChange={(e) => setPortfolio({ ...portfolio, hourly_rate: parseFloat(e.target.value) })}
                        onBlur={() => updatePortfolio({ hourly_rate: portfolio.hourly_rate })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        value={portfolio.years_experience}
                        onChange={(e) => setPortfolio({ ...portfolio, years_experience: parseInt(e.target.value) })}
                        onBlur={() => updatePortfolio({ years_experience: portfolio.years_experience })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <Avatar className="w-24 h-24 mx-auto mb-2">
                        <AvatarImage src={portfolio.profile_image_url} />
                        <AvatarFallback>
                          <Camera className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => profilePhotoRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </Button>
                      <input
                        ref={profilePhotoRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePhotoChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{portfolio.portfolio_views}</div>
                        <div className="text-xs text-muted-foreground">Portfolio Views</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{projects.length}</div>
                        <div className="text-xs text-muted-foreground">Projects</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{packages.length}</div>
                        <div className="text-xs text-muted-foreground">Service Packages</div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant={portfolio.is_public ? 'outline' : 'default'}
                        className="w-full"
                        onClick={() => updatePortfolio({ is_public: !portfolio.is_public })}
                      >
                        {portfolio.is_public ? 'Make Private' : 'Publish Portfolio'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        {portfolio.is_public ? 'Portfolio is visible to clients' : 'Portfolio is hidden from clients'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Project Gallery</h2>
            <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mb-4">
                  <div>
                    <Label>Project Photo</Label>
                    <div
                      className="mt-1 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={() => projectImageRef.current?.click()}
                    >
                      {projectImagePreview ? (
                        <img src={projectImagePreview} alt="Preview" className="mx-auto max-h-36 object-contain rounded" />
                      ) : (
                        <div className="space-y-1">
                          <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to choose an image (max 10MB)</p>
                        </div>
                      )}
                      <input
                        ref={projectImageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProjectImageChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="project-title">Project Title</Label>
                      <Input
                        id="project-title"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-category">Category</Label>
                      <Select onValueChange={(value) => setNewProject({ ...newProject, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="carpentry">Carpentry</SelectItem>
                          <SelectItem value="painting">Painting</SelectItem>
                          <SelectItem value="renovation">Renovation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="project-client">Client Name</Label>
                      <Input
                        id="project-client"
                        value={newProject.client_name}
                        onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-duration">Duration</Label>
                      <Input
                        id="project-duration"
                        placeholder="e.g., 2 weeks"
                        value={newProject.project_duration}
                        onChange={(e) => setNewProject({ ...newProject, project_duration: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="project-description">Description</Label>
                      <Textarea
                        id="project-description"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-cost">Project Cost (₦)</Label>
                      <Input
                        id="project-cost"
                        type="number"
                        value={newProject.project_cost}
                        onChange={(e) => setNewProject({ ...newProject, project_cost: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-materials">Materials Used</Label>
                      <Input
                        id="project-materials"
                        placeholder="Comma-separated list"
                        value={newProject.materials_used}
                        onChange={(e) => setNewProject({ ...newProject, materials_used: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="completion-date">Completion Date</Label>
                      <Input
                        id="completion-date"
                        type="date"
                        value={newProject.completion_date}
                        onChange={(e) => setNewProject({ ...newProject, completion_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={resetProjectDialog}>
                    Cancel
                  </Button>
                  <Button onClick={addProject} disabled={uploadingProjectImage}>
                    {uploadingProjectImage ? 'Saving...' : editingProject ? 'Save Changes' : 'Add Project'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  {project.after_image_url ? (
                    <img src={project.after_image_url} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{project.title}</h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProject(project);
                          setNewProject({
                            title: project.title,
                            description: project.description || '',
                            category: project.category,
                            before_image_url: project.before_image_url || '',
                            after_image_url: project.after_image_url || '',
                            completion_date: project.completion_date || '',
                            client_name: project.client_name || '',
                            project_duration: project.project_duration || '',
                            materials_used: (project.materials_used || []).join(', '),
                            project_cost: project.project_cost?.toString() || ''
                          });
                          setProjectImagePreview(project.after_image_url || null);
                          setShowProjectDialog(true);
                        }}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs mb-2">
                    {project.category}
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-2">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.client_name}</span>
                    <span>₦{project.project_cost?.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {projects.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
                <p className="text-gray-500 mb-4">
                  Start building your portfolio by adding your completed projects.
                </p>
                <Button onClick={() => setShowProjectDialog(true)}>
                  Add Your First Project
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Service Packages</h2>
            <Dialog open={showPackageDialog} onOpenChange={setShowPackageDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPackage ? 'Edit Service Package' : 'Create Service Package'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="package-name">Package Name</Label>
                    <Input
                      id="package-name"
                      value={newPackage.package_name}
                      onChange={(e) => setNewPackage({ ...newPackage, package_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="package-description">Description</Label>
                    <Textarea
                      id="package-description"
                      value={newPackage.description}
                      onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="package-price">Price (₦)</Label>
                      <Input
                        id="package-price"
                        type="number"
                        value={newPackage.price}
                        onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="package-duration">Duration</Label>
                      <Input
                        id="package-duration"
                        placeholder="e.g., 1 day"
                        value={newPackage.duration}
                        onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="package-includes">What's Included</Label>
                    <Textarea
                      id="package-includes"
                      placeholder="Comma-separated list of services"
                      value={newPackage.includes}
                      onChange={(e) => setNewPackage({ ...newPackage, includes: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="package-category">Category</Label>
                    <Select onValueChange={(value) => setNewPackage({ ...newPackage, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={resetPackageDialog}>
                    Cancel
                  </Button>
                  <Button onClick={addPackage}>
                    {editingPackage ? 'Save Changes' : 'Create Package'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={`relative ${pkg.is_popular ? 'ring-2 ring-primary' : ''}`}>
                {pkg.is_popular && (
                  <Badge className="absolute -top-2 left-4 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pkg.package_name}</span>
                    <span className="text-2xl font-bold text-primary">
                      ₦{pkg.price.toLocaleString()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {pkg.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{pkg.duration}</span>
                    </div>
                    <div className="space-y-1">
                      {pkg.includes.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setNewPackage({
                          package_name: pkg.package_name,
                          description: pkg.description || '',
                          price: pkg.price.toString(),
                          duration: pkg.duration || '',
                          includes: (pkg.includes || []).join(', '),
                          category: pkg.category || '',
                          is_popular: pkg.is_popular || false
                        });
                        setShowPackageDialog(true);
                      }}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePackage(pkg.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {packages.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Packages</h3>
                <p className="text-gray-500 mb-4">
                  Create service packages to offer clear pricing to your clients.
                </p>
                <Button onClick={() => setShowPackageDialog(true)}>
                  Create Your First Package
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{portfolio?.portfolio_views || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-sm text-muted-foreground">Contact Requests</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">+15%</div>
                    <div className="text-sm text-muted-foreground">This Month</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <p>Analytics data will appear here as your portfolio gains traction.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}