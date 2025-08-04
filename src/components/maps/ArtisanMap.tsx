import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Navigation, 
  Star, 
  Phone, 
  MessageCircle, 
  Filter,
  Search,
  Locate
} from 'lucide-react';

interface Artisan {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: number;
  price: string;
  avatar: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  verified: boolean;
  available: boolean;
}

interface ArtisanMapProps {
  category?: string;
  userLocation?: { lat: number; lng: number };
}

export function ArtisanMap({ category, userLocation }: ArtisanMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [searchRadius, setSearchRadius] = useState(5); // km
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState(userLocation);
  const { toast } = useToast();

  // Mock artisan data - replace with actual API call
  const mockArtisans: Artisan[] = [
    {
      id: '1',
      name: 'John Okoro',
      category: 'Plumbing',
      rating: 4.8,
      reviews: 156,
      distance: 1.2,
      price: '₦5,000 - ₦15,000',
      avatar: '/avatars/john.jpg',
      location: { lat: 6.5244, lng: 3.3792, address: 'Victoria Island, Lagos' },
      verified: true,
      available: true
    },
    {
      id: '2', 
      name: 'Mary Adebayo',
      category: 'Electrical',
      rating: 4.9,
      reviews: 203,
      distance: 2.1,
      price: '₦3,000 - ₦12,000',
      avatar: '/avatars/mary.jpg',
      location: { lat: 6.4281, lng: 3.4219, address: 'Ajah, Lagos' },
      verified: true,
      available: true
    },
    {
      id: '3',
      name: 'Ibrahim Hassan', 
      category: 'Carpentry',
      rating: 4.7,
      reviews: 89,
      distance: 3.5,
      price: '₦8,000 - ₦25,000',
      avatar: '/avatars/ibrahim.jpg',
      location: { lat: 6.4698, lng: 3.5852, address: 'Lekki, Lagos' },
      verified: true,
      available: false
    }
  ];

  useEffect(() => {
    getCurrentLocation();
    setArtisans(mockArtisans);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userPosition && artisans.length > 0) {
      initializeMap();
    }
  }, [userPosition, artisans]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Location error:', error);
        // Default to Lagos if location access denied
        setUserPosition({ lat: 6.5244, lng: 3.3792 });
        toast({
          title: "Location access denied",
          description: "Using default location. Enable location for better results.",
          variant: "destructive"
        });
      }
    );
  };

  const initializeMap = () => {
    if (!mapContainer.current || !userPosition) return;

    // For now, we'll create a simple interactive map placeholder
    // In production, integrate with Google Maps, Mapbox, or OpenStreetMap
    const mapElement = mapContainer.current;
    mapElement.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
        border-radius: 8px;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          text-align: center;
          font-size: 14px;
        ">
          <div style="margin-bottom: 8px;">📍 Interactive Map</div>
          <div style="font-size: 12px; opacity: 0.8;">
            ${artisans.length} artisans found within ${searchRadius}km
          </div>
        </div>
        ${artisans.map((artisan, index) => `
          <div 
            data-artisan-id="${artisan.id}"
            style="
              position: absolute;
              top: ${20 + index * 15}%;
              left: ${30 + index * 20}%;
              width: 24px;
              height: 24px;
              background: ${artisan.available ? '#10b981' : '#ef4444'};
              border: 2px solid white;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              font-weight: bold;
            "
            title="${artisan.name} - ${artisan.category}"
          >
            ${index + 1}
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for artisan pins
    artisans.forEach((artisan, index) => {
      const pin = mapElement.querySelector(`[data-artisan-id="${artisan.id}"]`);
      if (pin) {
        pin.addEventListener('click', () => {
          setSelectedArtisan(artisan);
        });
      }
    });
  };

  const handleContactArtisan = (artisan: Artisan, action: 'call' | 'message') => {
    if (action === 'call') {
      window.open(`tel:+234${artisan.id}`, '_self');
    } else {
      // Navigate to messaging
      toast({
        title: "Opening chat",
        description: `Starting conversation with ${artisan.name}`
      });
    }
  };

  const handleBookArtisan = (artisan: Artisan) => {
    toast({
      title: "Booking initiated",
      description: `Redirecting to book ${artisan.name} for ${artisan.category} services`
    });
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Map Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Find Nearby Artisans</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
            >
              <Locate className="w-4 h-4 mr-1" />
              My Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search location..."
                className="w-full"
              />
            </div>
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>Search radius:</span>
              <Input
                type="number"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-16 h-8"
                min="1"
                max="50"
              />
              <span>km</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Busy</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Interactive Map */}
        <Card className="lg:order-1">
          <CardContent className="p-0">
            <div 
              ref={mapContainer}
              className="w-full h-80 rounded-lg"
            />
          </CardContent>
        </Card>

        {/* Artisan List */}
        <div className="space-y-3 lg:order-2">
          {artisans.map((artisan) => (
            <Card 
              key={artisan.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedArtisan?.id === artisan.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedArtisan(artisan)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={artisan.avatar} alt={artisan.name} />
                    <AvatarFallback>{artisan.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm">{artisan.name}</h3>
                      <Badge 
                        variant={artisan.available ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {artisan.available ? 'Available' : 'Busy'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1">{artisan.category}</p>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{artisan.rating}</span>
                        <span className="text-xs text-muted-foreground">({artisan.reviews})</span>
                      </div>
                      {artisan.verified && (
                        <Badge variant="outline" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{artisan.distance}km away</span>
                        </div>
                        <div className="font-medium text-primary">{artisan.price}</div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactArtisan(artisan, 'call');
                          }}
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactArtisan(artisan, 'message');
                          }}
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Selected Artisan Details */}
      {selectedArtisan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedArtisan.name}</span>
              <Button onClick={() => setSelectedArtisan(null)} variant="ghost" size="sm">
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">Location</h4>
                <p className="text-sm text-muted-foreground mb-4">{selectedArtisan.location.address}</p>
                
                <h4 className="font-medium mb-2">Service Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2">{selectedArtisan.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price Range:</span>
                    <span className="ml-2">{selectedArtisan.price}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="ml-2">{selectedArtisan.distance}km away</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="ml-2">{selectedArtisan.rating}/5.0 ({selectedArtisan.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  className="w-full"
                  disabled={!selectedArtisan.available}
                  onClick={() => handleBookArtisan(selectedArtisan)}
                >
                  Book Now
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleContactArtisan(selectedArtisan, 'message')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleContactArtisan(selectedArtisan, 'call')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}