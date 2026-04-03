import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Upload,
  Image as ImageIcon,
  X,
  Plus,
  Calendar,
  MapPin,
  Trash2,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  location: string;
  completion_date: string;
  client_name?: string;
}

interface WorkGalleryProps {
  artisanId?: string;
  editable?: boolean;
  limit?: number;
}

export function WorkGallery({ artisanId, editable = false, limit }: WorkGalleryProps) {
  const { user } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [newWork, setNewWork] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    client_name: '',
    completion_date: '',
  });

  const targetId = artisanId || user?.id;

  useEffect(() => {
    if (targetId) {
      fetchWorkItems();
    }
  }, [targetId]);

  const getOrCreatePortfolio = async (): Promise<string | null> => {
    if (!user?.id) return null;

    // Try to find existing portfolio
    const { data: existing } = await supabase
      .from('portfolios')
      .select('id')
      .eq('artisan_id', user.id)
      .maybeSingle();

    if (existing?.id) {
      setPortfolioId(existing.id);
      return existing.id;
    }

    // Create one
    const { data: created, error } = await supabase
      .from('portfolios')
      .insert({
        artisan_id: user.id,
        title: 'My Portfolio',
        is_public: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating portfolio:', error);
      return null;
    }

    setPortfolioId(created.id);
    return created.id;
  };

  const fetchWorkItems = async () => {
    setLoading(true);
    try {
      // Get portfolio for this artisan
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('artisan_id', targetId)
        .maybeSingle();

      if (!portfolio?.id) {
        setWorkItems([]);
        return;
      }

      setPortfolioId(portfolio.id);

      const query = supabase
        .from('portfolio_projects')
        .select('id, title, description, category, after_image_url, completion_date, client_name, display_order')
        .eq('portfolio_id', portfolio.id)
        .order('display_order', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const items: WorkItem[] = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description || '',
        image_url: p.after_image_url || '',
        category: p.category,
        location: '',
        completion_date: p.completion_date || new Date().toISOString().split('T')[0],
        client_name: p.client_name || undefined,
      }));

      setWorkItems(limit ? items.slice(0, limit) : items);
    } catch (error) {
      console.error('Error fetching work items:', error);
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `work/${user?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddWork = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select an image');
      return;
    }
    if (!newWork.title || !newWork.description || !newWork.category) {
      toast.error('Please fill in title, description and category');
      return;
    }

    setSaving(true);
    try {
      // Ensure portfolio exists
      const pid = portfolioId || await getOrCreatePortfolio();
      if (!pid) {
        toast.error('Could not create portfolio record');
        return;
      }

      const imageUrl = await handleImageUpload(file);
      if (!imageUrl) return;

      const { error } = await supabase
        .from('portfolio_projects')
        .insert({
          portfolio_id: pid,
          title: newWork.title,
          description: newWork.description,
          category: newWork.category,
          client_name: newWork.client_name || null,
          completion_date: newWork.completion_date || new Date().toISOString().split('T')[0],
          after_image_url: imageUrl,
          display_order: workItems.length,
        });

      if (error) throw error;

      setNewWork({ title: '', description: '', category: '', location: '', client_name: '', completion_date: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPreviewUrl(null);

      toast.success('Work added to gallery');
      await fetchWorkItems();
    } catch (error: any) {
      console.error('Error adding work:', error);
      toast.error(error.message || 'Failed to add work');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWork = async (workId: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_projects')
        .delete()
        .eq('id', workId);

      if (error) throw error;

      setWorkItems(prev => prev.filter(item => item.id !== workId));
      toast.success('Work removed from gallery');
    } catch (error: any) {
      console.error('Error deleting work:', error);
      toast.error('Failed to remove work');
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {editable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Work
            </CardTitle>
            <CardDescription>
              Showcase your completed projects to attract more clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={newWork.title}
                  onChange={(e) => setNewWork(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Modern Kitchen Installation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={newWork.category}
                  onChange={(e) => setNewWork(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Plumbing, Electrical, Carpentry"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name (Optional)</Label>
                <Input
                  id="client_name"
                  value={newWork.client_name}
                  onChange={(e) => setNewWork(prev => ({ ...prev, client_name: e.target.value }))}
                  placeholder="Client's name (if they agree)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion_date">Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={newWork.completion_date}
                  onChange={(e) => setNewWork(prev => ({ ...prev, completion_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                value={newWork.description}
                onChange={(e) => setNewWork(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the work you completed, challenges solved, and results achieved..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Project Image *</Label>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="mx-auto max-h-48 object-contain rounded" />
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                    <div>
                      <Button type="button" variant="outline" disabled={uploading} className="flex items-center gap-2 mx-auto">
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Choose Image'}
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        JPG, PNG or WebP. Max 10MB.
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <Button
              onClick={handleAddWork}
              disabled={saving || uploading}
              className="w-full flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Saving...' : 'Add to Gallery'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workItems.map((work) => (
          <Card key={work.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={work.image_url}
                alt={work.title}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => setSelectedImage(work.image_url)}
              />
              {editable && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => handleDeleteWork(work.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2 h-8 w-8 p-0"
                onClick={() => setSelectedImage(work.image_url)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold">{work.title}</h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {work.category}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {work.description}
              </p>

              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(work.completion_date).toLocaleDateString()}</span>
                </div>
                {work.client_name && (
                  <p className="text-xs">Client: {work.client_name}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workItems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No work samples yet</h3>
            <p className="text-muted-foreground mb-4">
              {editable
                ? 'Start building your portfolio by adding photos of your completed work.'
                : "This artisan hasn't added any work samples yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Project Image</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img
                src={selectedImage}
                alt="Project preview"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
