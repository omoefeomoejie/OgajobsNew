import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Clock, 
  Shield, 
  Award,
  MessageSquare,
  Calendar
} from 'lucide-react';

interface ArtisanContact {
  email: string;
  phone: string;
  full_name: string;
}

interface ArtisanProfile {
  id: string;
  full_name: string;
  city: string;
  category: string;
  skill: string;
  photo_url?: string;
  profile_url?: string;
  slug: string;
  created_at: string;
  average_rating: number;
  total_reviews: number;
  verification_level: string;
}

interface ArtisanProfileViewerProps {
  artisanId: string;
  showContactInfo?: boolean;
}

export const ArtisanProfileViewer = ({ artisanId, showContactInfo = false }: ArtisanProfileViewerProps) => {
  const { user } = useAuth();
  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null);
  const [contactInfo, setContactInfo] = useState<ArtisanContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    fetchArtisanProfile();
  }, [artisanId]);

  const fetchArtisanProfile = async () => {
    try {
      // Get public artisan info first
      const { data, error } = await supabase
        .from('mv_artisan_directory')
        .select('*')
        .eq('id', artisanId)
        .single();

      if (error) throw error;
      
      if (data) {
        setArtisan({
          id: (data as any).id,
          full_name: (data as any).full_name,
          city: (data as any).city,
          category: (data as any).category,
          skill: (data as any).skill || (data as any).category,
          photo_url: (data as any).photo_url,
          profile_url: (data as any).profile_url,
          slug: (data as any).slug,
          created_at: (data as any).created_at,
          average_rating: (data as any).average_rating || 0,
          total_reviews: (data as any).total_reviews || 0,
          verification_level: 'unverified' // Default value since DB doesn't have this field yet
        });
      }
    } catch (error) {
      console.error('Error fetching artisan profile:', error);
      toast.error('Failed to load artisan profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchContactInfo = async () => {
    if (!user) {
      toast.error('Please log in to view contact information');
      return;
    }

    setLoadingContact(true);
    try {
      const { data, error } = await supabase
        .rpc('get_artisan_contact_info', { artisan_id_param: artisanId });

      if (error) {
        if (error.message.includes('Unauthorized')) {
          toast.error('You need an active booking with this artisan to view contact information');
        } else {
          throw error;
        }
        return;
      }

      if (data && data.length > 0) {
        setContactInfo(data[0]);
        toast.success('Contact information revealed');
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      toast.error('Failed to load contact information');
    } finally {
      setLoadingContact(false);
    }
  };

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'basic': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'premium': return <Award className="w-4 h-4" />;
      case 'standard': return <Shield className="w-4 h-4" />;
      case 'basic': return <Shield className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!artisan) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Artisan profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {artisan.photo_url && (
              <img 
                src={artisan.photo_url} 
                alt={artisan.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <CardTitle className="text-xl">{artisan.full_name}</CardTitle>
              <CardDescription className="text-base">
                {artisan.skill || artisan.category}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{artisan.city}</span>
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={getVerificationColor(artisan.verification_level)}
          >
            {getVerificationIcon(artisan.verification_level)}
            <span className="ml-1 capitalize">{artisan.verification_level}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rating and Reviews */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{artisan.average_rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({artisan.total_reviews} review{artisan.total_reviews !== 1 ? 's' : ''})
            </span>
          </div>
        </div>

        <Separator />

        {/* Contact Information Section */}
        <div>
          <h3 className="font-semibold mb-3">Contact Information</h3>
          {showContactInfo && contactInfo ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {contactInfo.email}
                </a>
              </div>
              {contactInfo.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={`tel:${contactInfo.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Contact information is only available to clients with active bookings for security reasons.
              </p>
              <Button 
                onClick={fetchContactInfo}
                variant="outline"
                disabled={loadingContact}
                className="w-full"
              >
                {loadingContact ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Reveal Contact Info
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            Book Service
          </Button>
        </div>

        {/* Member Since */}
        <div className="text-sm text-muted-foreground">
          Member since {new Date(artisan.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};