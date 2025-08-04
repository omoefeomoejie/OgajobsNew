import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Plus,
  Star,
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
  rating?: number;
}

interface WorkGalleryProps {
  artisanId?: string;
  editable?: boolean;
  limit?: number;
}

export function WorkGallery({ artisanId, editable = false, limit }: WorkGalleryProps) {
  const { user } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newWork, setNewWork] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    client_name: '',
    completion_date: '',
  });

  // Mock data for demonstration
  const sampleWorks: WorkItem[] = [
    {
      id: '1',
      title: 'Modern Kitchen Installation',
      description: 'Complete kitchen renovation with modern appliances and cabinetry.',
      image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      category: 'Carpentry',
      location: 'Victoria Island, Lagos',
      completion_date: '2024-01-15',
      client_name: 'Mrs. Johnson',
      rating: 5
    },
    {
      id: '2',
      title: 'Bathroom Plumbing Repair',
      description: 'Fixed leaking pipes and installed new fixtures in master bathroom.',
      image_url: 'https://images.unsplash.com/photo-1584622781564-1d987173c5e4?w=500',
      category: 'Plumbing',
      location: 'Ikoyi, Lagos',
      completion_date: '2024-01-10',
      client_name: 'Mr. Adebayo',
      rating: 4
    },
    {
      id: '3',
      title: 'Electrical Installation',
      description: 'Rewired entire house and installed new electrical panel.',
      image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500',
      category: 'Electrical',
      location: 'Lekki, Lagos',
      completion_date: '2024-01-05',
      client_name: 'Dr. Okafor',
      rating: 5
    },
    {
      id: '4',
      title: 'House Painting Project',
      description: 'Interior and exterior painting of 4-bedroom duplex.',
      image_url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500',
      category: 'Painting',
      location: 'Surulere, Lagos',
      completion_date: '2023-12-20',
      client_name: 'Mrs. Akinola',
      rating: 4
    },
  ];

  // Use sample data for now
  useState(() => {
    setWorkItems(limit ? sampleWorks.slice(0, limit) : sampleWorks);
  });

  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `work/${user?.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars') // Using avatars bucket since it's public
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
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await handleImageUpload(file);
      if (!imageUrl) return;

      const workItem: WorkItem = {
        id: Date.now().toString(),
        ...newWork,
        image_url: imageUrl,
        completion_date: newWork.completion_date || new Date().toISOString().split('T')[0],
      };

      setWorkItems(prev => [workItem, ...prev]);
      setNewWork({
        title: '',
        description: '',
        category: '',
        location: '',
        client_name: '',
        completion_date: '',
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Work added to gallery successfully');
    } catch (error) {
      console.error('Error adding work:', error);
      toast.error('Failed to add work');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWork = async (workId: string) => {
    try {
      setWorkItems(prev => prev.filter(item => item.id !== workId));
      toast.success('Work removed from gallery');
    } catch (error) {
      console.error('Error deleting work:', error);
      toast.error('Failed to remove work');
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
        <span className="text-sm ml-1">({rating})</span>
      </div>
    );
  };

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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newWork.location}
                  onChange={(e) => setNewWork(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Victoria Island, Lagos"
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
              
              <div className="space-y-2 md:col-span-2">
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
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <div className="space-y-2">
                  <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG or WebP. Max 10MB. High quality images work best.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleAddWork} 
              disabled={loading || uploading}
              className="w-full flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Adding Work...' : 'Add to Gallery'}
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
              
              <div className="space-y-2 text-sm text-muted-foreground">
                {work.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{work.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(work.completion_date).toLocaleDateString()}</span>
                </div>
                
                {work.client_name && (
                  <p className="text-xs">
                    Client: {work.client_name}
                  </p>
                )}
              </div>
              
              {work.rating && renderStars(work.rating)}
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
                ? "Start building your portfolio by adding photos of your completed work."
                : "This artisan hasn't added any work samples yet."
              }
            </p>
            {editable && (
              <Button variant="outline">
                Add Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Preview Dialog */}
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