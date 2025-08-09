import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, MapPin, Phone, Mail } from 'lucide-react';

export default function Favorites() {
  const [favorites] = useState([
    {
      id: 1,
      name: "Emeka Okafor",
      service: "Plumbing",
      rating: 4.9,
      location: "Victoria Island, Lagos",
      phone: "+234 803 123 4567",
      email: "emeka@example.com",
      completedJobs: 156,
      responseTime: "< 1 hour"
    },
    {
      id: 2,
      name: "Fatima Ahmed",
      service: "Home Cleaning",
      rating: 4.8,
      location: "Ikeja, Lagos",
      phone: "+234 803 234 5678",
      email: "fatima@example.com",
      completedJobs: 203,
      responseTime: "< 30 mins"
    },
    {
      id: 3,
      name: "John Adebayo",
      service: "Electrical Work",
      rating: 4.7,
      location: "Lekki, Lagos",
      phone: "+234 803 345 6789",
      email: "john@example.com",
      completedJobs: 89,
      responseTime: "< 2 hours"
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Favorite Artisans</h1>
          <p className="text-muted-foreground">Your trusted service providers</p>
        </div>
        <Badge variant="secondary">{favorites.length} Favorites</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((artisan) => (
          <Card key={artisan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{artisan.name}</CardTitle>
                  <Badge variant="outline">{artisan.service}</Badge>
                </div>
                <Button size="icon" variant="ghost" className="text-red-500">
                  <Heart className="w-4 h-4 fill-current" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{artisan.rating}</span>
                <span className="text-muted-foreground">({artisan.completedJobs} jobs)</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{artisan.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{artisan.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{artisan.email}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Responds in {artisan.responseTime}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">Book Now</Button>
                <Button size="sm" variant="outline">Message</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {favorites.length === 0 && (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground">
            Start adding artisans to your favorites to quickly book their services.
          </p>
        </div>
      )}
    </div>
  );
}